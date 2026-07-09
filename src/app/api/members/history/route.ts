import { NextResponse, type NextRequest } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

// GET /api/members/history?memberId=xxx
export async function GET(request: NextRequest) {
  const memberId = request.nextUrl.searchParams.get("memberId")
  if (!memberId) return NextResponse.json({ error: "memberId requis" }, { status: 400 })

  const db = createServiceSupabase()
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
