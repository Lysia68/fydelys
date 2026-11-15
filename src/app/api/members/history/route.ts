import { NextResponse, type NextRequest } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"
import { checkAuth } from "@/lib/auth-check"
import { estEquipeDuStudio } from "@/lib/roles"

export const dynamic = "force-dynamic"

// GET /api/members/history?memberId=xxx
//
// EQUIPE du studio du membre uniquement (garde du 15/11/2026 ; seul appelant :
// la fiche membre de l'espace admin). Avant : sans compte, n'importe qui
// lisait l'historique des reservations ET des paiements d'un membre.
export async function GET(request: NextRequest) {
  const memberId = request.nextUrl.searchParams.get("memberId")
  if (!memberId) return NextResponse.json({ error: "memberId requis" }, { status: 400 })

  const auth = await checkAuth(request)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = createServiceSupabase()
  const { data: membre } = await db.from("members").select("studio_id").eq("id", memberId).maybeSingle()
  // Membre inexistant ou d'un autre studio : meme reponse.
  if (!membre || !estEquipeDuStudio(auth, membre.studio_id))
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  const [bookingsRes, paymentsRes] = await Promise.all([
    db.from("bookings")
      .select("status, created_at, sessions(session_date, session_time, teacher, room, disciplines(name, icon))")
      .eq("member_id", memberId)
      .order("created_at", { ascending: false })
      .limit(50),
    db.from("member_payments")
      .select("id, amount, payment_date, payment_type, status, notes, source, stripe_payment_id")
      .eq("member_id", memberId)
      .order("payment_date", { ascending: false })
      .limit(50),
  ])

  if (bookingsRes.error) return NextResponse.json({ error: bookingsRes.error.message }, { status: 500 })
  return NextResponse.json({ bookings: bookingsRes.data || [], payments: paymentsRes.data || [] })
}
