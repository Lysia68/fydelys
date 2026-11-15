import { describe, it, expect } from "vitest"
import { existsSync } from "fs"
import { resolve } from "path"

// ── Routes SUPPRIMEES pour raison de securite : elles ne doivent pas revenir ──
//
// /api/create-profile (supprimee le 15/11/2026) :
//   - appelee par AUCUN code (ni src, ni supabase, ni scripts) ; son corps
//     ({ userId, userEmail, userMetadata, tenantSlug }) n'est pas celui d'un
//     webhook Supabase ;
//   - sans authentification, elle creait un profil avec le role lu dans la
//     requete (`userMetadata.role`) : profil ADMIN de n'importe quel studio ;
//   - et sa branche « profil existant » rattachait le compte appelant a la
//     fiche membre de n'importe quelle adresse e-mail.
//   La creation de profil est assuree par /api/verify-token, /api/exchange-code
//   et /auth/callback.

const SUPPRIMEES = ["src/app/api/create-profile/route.ts"]

describe("routes supprimees pour raison de securite", () => {
  for (const f of SUPPRIMEES) {
    it(`${f} n'existe pas`, () => {
      expect(existsSync(resolve(__dirname, "../..", f))).toBe(false)
    })
  }
})
