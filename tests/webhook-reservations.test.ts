import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { resolve } from "path"

// Une reservation creee par un webhook Stripe (achat d'une seance) doit naitre
// « pas encore pointee » (attended NULL), comme toute reservation. Jusqu'au
// 15/11/2026 elle naissait attended = false, soit « absent » avant meme la
// seance (rattrapage des lignes existantes : requete fournie a part).
//
// Garde au niveau du source : tester le webhook de bout en bout exigerait de
// simuler la signature Stripe ; ce qui compte ici est la valeur inseree.
const WEBHOOKS = ["src/app/api/connect/webhook/route.ts", "src/app/api/stripe/webhook/route.ts"]

describe("webhooks Stripe : reservation creee non pointee", () => {
  for (const f of WEBHOOKS) {
    it(`${f} insere attended: null, jamais attended: false`, () => {
      const src = readFileSync(resolve(__dirname, "..", f), "utf8")
      const insert = src.slice(src.indexOf('db.from("bookings").insert('), src.indexOf('db.from("bookings").insert(') + 600)
      expect(insert).toContain('status: "confirmed"')
      expect(insert).toMatch(/attended:\s*null/)
      expect(insert).not.toMatch(/attended:\s*false/)
    })
  }
})
