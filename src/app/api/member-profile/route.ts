import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createServiceSupabase } from "@/lib/supabase-server"
import { notifierNouveauMembre } from "@/lib/notify-new-member"
import { estEquipeDuStudio } from "@/lib/roles"

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

    const body = await req.json()
    const { studioId, memberId, first_name, last_name, phone, birth_date, address, postal_code, city, profession } = body
    if (!studioId) return NextResponse.json({ error: "studioId manquant" }, { status: 400 })

    const db = createServiceSupabase()

    const updateData: any = {
      first_name:       first_name?.trim()     || null,
      last_name:        last_name?.trim()      || null,
      phone:            phone?.trim()          || null,
      birth_date:       birth_date             || null,
      address:          address?.trim()        || null,
      postal_code:      postal_code?.trim()    || null,
      city:             city?.trim()           || null,
      profession:       profession?.trim()     || null,
      profile_complete: true,
    }

    let updateErr = null
    let targetId: string | null = null
    let wasNew = false
    // Vrai si la fiche modifiee est celle du compte appelant (seul cas ou l'on
    // synchronise aussi son profil — voir plus bas).
    let estSoi = false

    // 1. memberId fourni — garde du 15/11/2026. Avant : TOUT compte connecte
    //    modifiait N'IMPORTE QUELLE fiche par son id. Desormais : sa propre
    //    fiche (l'espace adherent envoie `me.id`), ou une fiche du studio de
    //    l'equipe appelante (« Vue membre » d'un admin). Les champs ecrits sont
    //    la liste fixe `updateData` ci-dessus, jamais le corps brut.
    if (memberId) {
      const { data: cible } = await db.from("members").select("studio_id, auth_user_id").eq("id", memberId).maybeSingle()
      if (!cible || cible.studio_id !== studioId)
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
      estSoi = cible.auth_user_id === user.id
      if (!estSoi) {
        const { data: profil } = await db.from("profiles").select("role, studio_id").eq("id", user.id).maybeSingle()
        if (!estEquipeDuStudio({ profile: profil }, cible.studio_id))
          return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
      }
      targetId = memberId
      const { error } = await db.from("members").update(updateData).eq("id", memberId)
      updateErr = error
    } else {
      estSoi = true
      // 2. Chercher le membre par auth_user_id (self-edit adhérent)
      updateData.auth_user_id = user.id

      const { data: byUid } = await db.from("members")
        .select("id, status").eq("studio_id", studioId).eq("auth_user_id", user.id).maybeSingle()

      if (byUid) {
        targetId = byUid.id
        wasNew = byUid.status === "nouveau"
        if (wasNew) updateData.status = "actif"
        const { error } = await db.from("members").update(updateData).eq("id", byUid.id)
        updateErr = error
      } else {
        // 3. Fallback par email
        const { data: byEmail } = await db.from("members")
          .select("id, status").eq("studio_id", studioId).eq("email", user.email!).maybeSingle()
        if (byEmail) {
          targetId = byEmail.id
          wasNew = byEmail.status === "nouveau"
          if (wasNew) updateData.status = "actif"
          const { error } = await db.from("members").update(updateData).eq("id", byEmail.id)
          updateErr = error
        } else {
          return NextResponse.json({ error: "Membre introuvable" }, { status: 404 })
        }
      }
    }

    if (updateErr) {
      console.error("[member-profile] update error:", updateErr.message)
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    // Sync profil — UNIQUEMENT pour sa propre fiche. Avant : quand un admin
    // modifiait la fiche d'un autre membre, ce bloc reecrivait le prenom et le
    // nom de l'ADMIN avec ceux du membre (`.eq("id", user.id)`).
    if (estSoi) {
      await db.from("profiles").update({
        first_name: first_name?.trim(),
        last_name:  last_name?.trim(),
      }).eq("id", user.id)
    }

    console.log("[member-profile] Updated for user:", user.id, "studio:", studioId)

    // Envoyer email de bienvenue uniquement au premier remplissage (nouveau → actif)
    // Appel direct de la fonction serveur (plus de route HTTP publique, 15/11/2026).
    if (targetId && wasNew) {
      await notifierNouveauMembre(db, targetId, studioId)
        .catch(e => console.warn("[member-profile] notify error:", e.message))
    }

    return NextResponse.json({ ok: true })

  } catch (err: any) {
    console.error("[member-profile] error:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const studioId = searchParams.get("studioId")
    if (!studioId) return NextResponse.json({ error: "studioId manquant" }, { status: 400 })

    const db = createServiceSupabase()
    const SELECT = "id, first_name, last_name, email, status, credits, credits_total, created_at, phone, address, postal_code, city, profile_complete"

    // Par auth_user_id en priorité
    let { data: member } = await db.from("members").select(SELECT)
      .eq("studio_id", studioId).eq("auth_user_id", user.id).maybeSingle()

    // Fallback par email
    if (!member && user.email) {
      const { data: byEmail } = await db.from("members").select(SELECT)
        .eq("studio_id", studioId).eq("email", user.email).maybeSingle()
      member = byEmail
    }

    if (!member) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 })
    return NextResponse.json({ ok: true, member })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}