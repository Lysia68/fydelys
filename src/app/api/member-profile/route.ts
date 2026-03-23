import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    // Vérifier la session via cookie
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const { studioId, first_name, last_name, phone, address, postal_code, city } = await req.json()
    if (!studioId) return NextResponse.json({ error: "studioId manquant" }, { status: 400 })

    const db = createServiceSupabase()

    // Chercher le membre — par auth_user_id en priorité
    const { data: byUid } = await db.from("members")
      .select("id").eq("studio_id", studioId).eq("auth_user_id", user.id).maybeSingle()

    const updateData = {
      first_name:       first_name?.trim()     || null,
      last_name:        last_name?.trim()      || null,
      phone:            phone?.trim()          || null,
      address:          address?.trim()        || null,
      postal_code:      postal_code?.trim()    || null,
      city:             city?.trim()           || null,
      profile_complete: true,
      status:           "actif",
      auth_user_id:     user.id,
    }

    let updateErr = null

    if (byUid) {
      const { error } = await db.from("members").update(updateData).eq("id", byUid.id)
      updateErr = error
    } else {
      // Fallback par email
      const { error } = await db.from("members").update(updateData)
        .eq("studio_id", studioId).eq("email", user.email!)
      updateErr = error
    }

    if (updateErr) {
      console.error("[member-profile] update error:", updateErr.message)
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    // Sync profil
    await db.from("profiles").update({
      first_name: first_name?.trim(),
      last_name:  last_name?.trim(),
    }).eq("id", user.id)

    console.log("[member-profile] Updated for user:", user.id, "studio:", studioId)
    return NextResponse.json({ ok: true })

  } catch (err: any) {
    console.error("[member-profile] error:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}