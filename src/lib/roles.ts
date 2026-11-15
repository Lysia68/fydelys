import { NextResponse } from "next/server"

// ── Controle du ROLE, apres `checkAuth` ───────────────────────────────────
//
// `checkAuth(req, studioId)` verifie la session et le STUDIO, pas le role : un
// adherent du studio passe. Ce controle-ci se fait APRES, dans la route :
//
//   const auth = await checkAuth(req, studioId)
//   if ("error" in auth) return …
//   const refus = exigerRole(auth, EQUIPE); if (refus) return refus
//
// Pourquoi pas DANS checkAuth : tous les tests remplacent checkAuth par un
// double (tests/setup.ts). Un controle place dedans ne serait jamais execute
// par les tests des routes, et une mutation qui le supprime survivrait.
// Ici, la fonction est reelle dans les tests.
//
// Le super-admin passe toujours.

export const ADMIN = ["admin"]
export const EQUIPE = ["admin", "coach", "staff"]

/**
 * Vrai si le compte est de l'EQUIPE du studio donne (ou super-admin). Pour les
 * routes ou le studio n'est pas dans la requete mais se deduit de l'objet
 * demande (membre, paiement) : lire l'objet, puis comparer.
 */
export function estEquipeDuStudio(auth: any, studioId: string | null | undefined): boolean {
  const p = auth?.profile
  if (p?.role === "superadmin") return true
  return !!studioId && EQUIPE.includes(p?.role) && p?.studio_id === studioId
}

export function exigerRole(auth: any, roles: string[]): NextResponse | null {
  const role = auth?.profile?.role
  if (role === "superadmin" || roles.includes(role)) return null
  return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
}
