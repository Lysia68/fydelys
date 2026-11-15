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

export function exigerRole(auth: any, roles: string[]): NextResponse | null {
  const role = auth?.profile?.role
  if (role === "superadmin" || roles.includes(role)) return null
  return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
}
