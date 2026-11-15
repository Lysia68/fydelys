import { NextResponse, type NextRequest } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"
import { checkAuth } from "@/lib/auth-check"
import { exigerRole, ADMIN } from "@/lib/roles"
import { compterSeancesDuCoach } from "@/lib/seances-coach"

export const dynamic = "force-dynamic"

// /api/team/suspend { userId, studioId } — appelee par les reglages (onglet
// Utilisateurs) ; n'existait pas avant le 15/11/2026.
//
// Pour les DEUX actions :
//   - ADMIN du studio uniquement (super-admin compris) ;
//   - la cible doit etre un COACH de CE studio — jamais soi-meme, jamais un
//     admin (role admin, meme s'il coache aussi).
//
// POST = suspendre : profiles.suspended_at (migration
//   20261115_profiles_suspended_at.sql). Historique INTACT, seances futures
//   TOUJOURS assignees (aucune reassignation automatique) : la reponse donne
//   leur nombre, a reassigner a la main. Le middleware deconnecte le coach,
//   checkAuth refuse ses appels /api.
// DELETE = supprimer : seulement si le coach n'a AUCUNE seance, passee ou
//   future. Sinon 409 « Ce coach a un historique : suspendez-le plutôt. »

type Cible = { db: ReturnType<typeof createServiceSupabase>; userId: string; studioId: string }

async function verifierCible(req: NextRequest, action: string): Promise<NextResponse | Cible> {
  const { userId, studioId } = await req.json().catch(() => ({}))
  if (!userId || !studioId) return NextResponse.json({ error: "userId et studioId requis" }, { status: 400 })

  const auth = await checkAuth(req, studioId)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const refus = exigerRole(auth, ADMIN)
  if (refus) return refus

  if (userId === (auth as any).user?.id)
    return NextResponse.json({ error: `Vous ne pouvez pas ${action} votre propre compte.` }, { status: 403 })

  const db = createServiceSupabase()
  const { data: cible } = await db.from("profiles").select("role, studio_id").eq("id", userId).maybeSingle()
  if (!cible || cible.studio_id !== studioId || cible.role !== "coach")
    return NextResponse.json({ error: `Seul un coach de votre studio peut être ${action === "suspendre" ? "suspendu" : "supprimé"}.` }, { status: 403 })

  return { db, userId, studioId }
}

export async function POST(req: NextRequest) {
  const v = await verifierCible(req, "suspendre")
  if (v instanceof NextResponse) return v
  const { db, userId, studioId } = v

  const { error } = await db.from("profiles").update({ suspended_at: new Date().toISOString() }).eq("id", userId)
  if (error) {
    console.error("[team/suspend]", error.message)
    return NextResponse.json({
      error: /suspended_at/.test(error.message)
        ? "Suspension indisponible : la migration profiles.suspended_at n'est pas appliquée."
        : "Suspension impossible.",
    }, { status: 500 })
  }
  // Seances futures toujours assignees au coach : l'admin les reassigne.
  const seancesFutures = await compterSeancesDuCoach(db, studioId, userId, { futures: true }).catch(() => null)
  return NextResponse.json({ ok: true, seancesFutures })
}

export async function DELETE(req: NextRequest) {
  const v = await verifierCible(req, "supprimer")
  if (v instanceof NextResponse) return v
  const { db, userId, studioId } = v

  // Aucune seance, passee OU future : sinon l'historique perdrait son coach.
  const n = await compterSeancesDuCoach(db, studioId, userId)
  if (n > 0)
    return NextResponse.json({ error: "Ce coach a un historique : suspendez-le plutôt.", seances: n }, { status: 409 })

  await db.from("coach_disciplines").delete().eq("profile_id", userId).eq("studio_id", studioId)
  const { error: pErr } = await db.from("profiles").delete().eq("id", userId)
  if (pErr) {
    console.error("[team/suspend DELETE] profil :", pErr.message)
    return NextResponse.json({ error: "Suppression impossible." }, { status: 500 })
  }
  // Compte de connexion : supprime, sauf s'il sert encore a une fiche membre
  // (meme personne adherente quelque part) — meme regle que DELETE /api/members.
  const { data: fiches } = await db.from("members").select("id").eq("auth_user_id", userId).is("deleted_at", null).limit(1)
  if (!fiches || fiches.length === 0) {
    const { error: aErr } = await db.auth.admin.deleteUser(userId)
    if (aErr) console.warn("[team/suspend DELETE] compte de connexion non supprimé :", aErr.message)
  }
  return NextResponse.json({ ok: true })
}
