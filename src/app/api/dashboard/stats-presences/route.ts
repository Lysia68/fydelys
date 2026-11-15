import { NextResponse, type NextRequest } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createServerSupabase } from "@/lib/supabase-server"
import {
  agreger, aujourdhuiParis, finDuMois, semainePrecedente, semainesDuMois,
  type LigneReservation,
} from "@/lib/stats-presences"

export const dynamic = "force-dynamic"

// GET /api/dashboard/stats-presences?studioId=…&annee=2026&mois=11
//
// Agrege COTE SERVEUR les presences (reservations confirmees) et les valides
// (presence pointee) — definitions dans lib/stats-presences.ts.
//
// Les donnees sont lues avec le client de l'UTILISATEUR (cle anonyme + ses
// cookies) : les policies RLS s'appliquent comme dans le reste du tableau de
// bord. La cle de service ne sert qu'a `checkAuth` (lecture du profil). Et le
// filtre `studio_id` est pose explicitement, en plus de la RLS.

const PAGE = 1000 // plafond PostgREST : au-dela, la reponse est TRONQUEE sans erreur

async function lireReservations(
  sb: Awaited<ReturnType<typeof createServerSupabase>>,
  studioId: string, du: string, au: string,
): Promise<LigneReservation[]> {
  const lignes: LigneReservation[] = []
  for (let depart = 0; ; depart += PAGE) {
    const { data, error } = await sb.from("bookings")
      .select("id, attended, sessions!inner(session_date, studio_id, status)")
      .eq("sessions.studio_id", studioId)
      .gte("sessions.session_date", du)
      .lte("sessions.session_date", au)
      .eq("status", "confirmed")
      .order("id")                       // tri sur cle unique : pagination stable
      .range(depart, depart + PAGE - 1)
    if (error) throw new Error(error.message)
    for (const b of (data || []) as any[]) {
      const s = Array.isArray(b.sessions) ? b.sessions[0] : b.sessions
      if (!s || s.status === "cancelled") continue // seance annulee : ne compte pas
      lignes.push({ session_date: s.session_date, attended: b.attended })
    }
    if (!data || data.length < PAGE) return lignes
  }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams
  const studioId = q.get("studioId")
  if (!studioId) return NextResponse.json({ error: "studioId requis" }, { status: 400 })

  const auth = await checkAuth(req, studioId)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (auth.profile?.role === "adherent")
    return NextResponse.json({ error: "Accès réservé à l'équipe du studio" }, { status: 403 })

  const aujourdhui = aujourdhuiParis()
  const annee = Number(q.get("annee") || aujourdhui.slice(0, 4))
  const mois = Number(q.get("mois") || aujourdhui.slice(5, 7))
  if (!Number.isInteger(annee) || annee < 2000 || annee > 2100 || !Number.isInteger(mois) || mois < 1 || mois > 12)
    return NextResponse.json({ error: "Mois ou année invalide" }, { status: 400 })

  try {
    const sb = await createServerSupabase()
    const debutMois = `${annee}-${String(mois).padStart(2, "0")}-01`
    const fin = finDuMois(annee, mois)
    const precedente = semainePrecedente(aujourdhui)

    const [lignesMois, lignesPrec, seances] = await Promise.all([
      lireReservations(sb, studioId, debutMois, fin),
      lireReservations(sb, studioId, precedente.lundi, precedente.dimanche),
      sb.from("sessions").select("id", { count: "exact", head: true })
        // `or` et non `neq` : `NULL <> 'cancelled'` n'est pas vrai en SQL, un
        // `neq` seul ecarterait les seances sans statut.
        .eq("studio_id", studioId).or("status.is.null,status.neq.cancelled")
        .gte("session_date", debutMois).lte("session_date", fin),
    ])
    if (seances.error) throw new Error(seances.error.message)

    return NextResponse.json({
      annee, mois,
      // Distingue « aucune seance » (etat vide) de « des seances, aucun inscrit » (zeros).
      nbSeances: seances.count ?? 0,
      semaines: agreger(semainesDuMois(annee, mois), lignesMois),
      semainePrecedente: {
        ...precedente,
        valides: lignesPrec.filter(l => l.attended === true).length,
      },
    })
  } catch (e: any) {
    console.error("[dashboard/stats-presences]", e?.message)
    return NextResponse.json({ error: "Impossible de calculer les statistiques" }, { status: 500 })
  }
}
