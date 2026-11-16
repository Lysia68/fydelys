import { NextResponse, type NextRequest } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createServerSupabase } from "@/lib/supabase-server"
import { aujourdhuiParis } from "@/lib/stats-presences"
import { membresInactifs, STATUTS_ACTIFS, type MembreLu, type PresenceLue } from "@/lib/membres-inactifs"

export const dynamic = "force-dynamic"

// GET /api/dashboard/membres-inactifs?studioId=…
//
// Membres actifs AVEC DU CREDIT, sans presence pointee depuis plus d'un an
// (ou jamais venus et inscrits depuis plus d'un an), avec le nombre EXACT de
// jours. Definitions : lib/membres-inactifs.ts (changees le 15/11/2026 : avant,
// derniere reservation, seuil 30 jours, sans condition de credit).
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
        .select("id, first_name, last_name, email, joined_at, credits")
        .eq("studio_id", studioId).is("deleted_at", null).in("status", STATUTS_ACTIFS)
        .gt("credits", 0)                          // seuls les membres qui ont du credit
        .order("id").range(de, a)),
      toutesLesPages<any>((de, a) => sb.from("bookings")
        .select("id, member_id, sessions!inner(session_date, studio_id)")
        .eq("sessions.studio_id", studioId)
        .eq("status", "confirmed")
        .eq("attended", true)                      // « venir » = presence POINTEE
        .not("member_id", "is", null)
        .order("id").range(de, a)),
    ])
    const presences: PresenceLue[] = brutes.flatMap(b => {
      const s = Array.isArray(b.sessions) ? b.sessions[0] : b.sessions
      return s?.session_date ? [{ member_id: b.member_id, session_date: s.session_date }] : []
    })

    const inactifs = membresInactifs(membres, presences, aujourdhuiParis())
    return NextResponse.json({ total: inactifs.length, membres: inactifs })
  } catch (e: any) {
    console.error("[dashboard/membres-inactifs]", e?.message)
    return NextResponse.json({ error: "Impossible de charger les membres absents depuis plus d'un an" }, { status: 500 })
  }
}
