import { NextResponse, type NextRequest } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createServerSupabase } from "@/lib/supabase-server"
import { aujourdhuiParis } from "@/lib/stats-presences"
import { membresInactifs, STATUTS_ACTIFS, type MembreLu, type ReservationLue } from "@/lib/membres-inactifs"

export const dynamic = "force-dynamic"

// GET /api/dashboard/membres-inactifs?studioId=…
//
// Membres actifs sans reservation confirmee depuis plus de 30 jours, avec le
// nombre EXACT de jours (definitions : lib/membres-inactifs.ts).
//
// Calcul serveur et pagine : la carte le faisait dans le navigateur sur des
// seances chargees SANS pagination — au-dela de 1 000 lignes, la « derniere
// reservation » pouvait etre fausse. Lecture avec le client de l'UTILISATEUR
// (RLS) ; filtre studio_id explicite ; adherents refuses.

const PAGE = 1000 // plafond PostgREST : au-dela, la reponse est TRONQUEE sans erreur

type Client = Awaited<ReturnType<typeof createServerSupabase>>

async function toutesLesPages<T>(lire: (de: number, a: number) => PromiseLike<{ data: any[] | null; error: any }>): Promise<T[]> {
  const lignes: T[] = []
  for (let de = 0; ; de += PAGE) {
    const { data, error } = await lire(de, de + PAGE - 1)
    if (error) throw new Error(error.message)
    lignes.push(...((data || []) as T[]))
    if (!data || data.length < PAGE) return lignes
  }
}

export async function GET(req: NextRequest) {
  const studioId = req.nextUrl.searchParams.get("studioId")
  if (!studioId) return NextResponse.json({ error: "studioId requis" }, { status: 400 })

  const auth = await checkAuth(req, studioId)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (auth.profile?.role === "adherent")
    return NextResponse.json({ error: "Accès réservé à l'équipe du studio" }, { status: 403 })

  try {
    const sb: Client = await createServerSupabase()
    const [membres, brutes] = await Promise.all([
      toutesLesPages<MembreLu>((de, a) => sb.from("members")
        .select("id, first_name, last_name, email, joined_at")
        .eq("studio_id", studioId).is("deleted_at", null).in("status", STATUTS_ACTIFS)
        .order("id").range(de, a)),
      toutesLesPages<any>((de, a) => sb.from("bookings")
        .select("id, member_id, sessions!inner(session_date, studio_id)")
        .eq("sessions.studio_id", studioId)
        .eq("status", "confirmed")
        .not("member_id", "is", null)
        .order("id").range(de, a)),
    ])
    const reservations: ReservationLue[] = brutes.flatMap(b => {
      const s = Array.isArray(b.sessions) ? b.sessions[0] : b.sessions
      return s?.session_date ? [{ member_id: b.member_id, session_date: s.session_date }] : []
    })

    const inactifs = membresInactifs(membres, reservations, aujourdhuiParis())
    return NextResponse.json({ total: inactifs.length, membres: inactifs })
  } catch (e: any) {
    console.error("[dashboard/membres-inactifs]", e?.message)
    return NextResponse.json({ error: "Impossible de charger les membres sans réservation" }, { status: 500 })
  }
}
