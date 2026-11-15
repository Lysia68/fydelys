import { NextResponse, type NextRequest } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"
import { checkAuth } from "@/lib/auth-check"
import { exigerRole, ADMIN } from "@/lib/roles"

export const dynamic = "force-dynamic"

// POST /api/team/suspend { userId, studioId } — suspendre un coach.
//
// Route appelee par les reglages (onglet Utilisateurs) mais qui N'EXISTAIT PAS
// avant le 15/11/2026 : la suspension d'un coach echouait toujours.
//   - ADMIN du studio uniquement (super-admin compris) ;
//   - la cible doit etre un COACH de CE studio — jamais soi-meme, jamais un
//     admin (role admin, meme s'il coache aussi) ;
//   - effet : profiles.suspended_at. Le middleware deconnecte alors le coach
//     et le renvoie sur /login (comme un adherent suspendu), et checkAuth
//     refuse ses appels /api.
// Necessite la migration supabase/migrations/20261115_profiles_suspended_at.sql.
//
// DELETE (supprimer un coach), aussi appele par les reglages, n'est PAS
// implemente : supprimer un compte d'equipe pose des questions (seances
// assignees, historique) a trancher d'abord. Il repond 405 explicitement.
export async function POST(req: NextRequest) {
  const { userId, studioId } = await req.json().catch(() => ({}))
  if (!userId || !studioId) return NextResponse.json({ error: "userId et studioId requis" }, { status: 400 })

  const auth = await checkAuth(req, studioId)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const refus = exigerRole(auth, ADMIN)
  if (refus) return refus

  if (userId === (auth as any).user?.id)
    return NextResponse.json({ error: "Vous ne pouvez pas suspendre votre propre compte." }, { status: 403 })

  const db = createServiceSupabase()
  const { data: cible } = await db.from("profiles").select("role, studio_id").eq("id", userId).maybeSingle()
  if (!cible || cible.studio_id !== studioId || cible.role !== "coach")
    return NextResponse.json({ error: "Seul un coach de votre studio peut être suspendu." }, { status: 403 })

  const { error } = await db.from("profiles").update({ suspended_at: new Date().toISOString() }).eq("id", userId)
  if (error) {
    console.error("[team/suspend]", error.message)
    return NextResponse.json({
      error: /suspended_at/.test(error.message)
        ? "Suspension indisponible : la migration profiles.suspended_at n'est pas appliquée."
        : "Suspension impossible.",
    }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  return NextResponse.json({ error: "La suppression d'un coach n'est pas encore disponible." }, { status: 405 })
}
