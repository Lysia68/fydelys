import { NextRequest, NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"
import { checkAuth } from "@/lib/auth-check"
import { exigerRole, ADMIN } from "@/lib/roles"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const { studioId } = await req.json()
    if (!studioId) return NextResponse.json({ error: "studioId requis" }, { status: 400 })

    // Seul un ADMIN du studio (garde du 15/11/2026). Avant : sans compte,
    // n'importe qui coupait Stripe pour n'importe quel studio.
    const auth = await checkAuth(req, studioId)
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
    const refus = exigerRole(auth, ADMIN)
    if (refus) return refus

    const db = createServiceSupabase()

    await db.from("studios").update({
      stripe_connect_id:     null,
      stripe_connect_status: "not_connected",
    }).eq("id", studioId)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("Connect disconnect error:", err?.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
