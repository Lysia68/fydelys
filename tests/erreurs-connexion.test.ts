import { describe, it, expect } from "vitest"
import { messageErreurConnexion, codeApresEchecVerification } from "@/lib/erreurs-connexion"

describe("erreurs de connexion : code → message sur /login", () => {
  it("compte d'equipe d'un autre studio : message dedie, pas « lien expire »", () => {
    expect(codeApresEchecVerification({ code: "autre_studio" })).toBe("autre_studio")
    const m = messageErreurConnexion("autre_studio")!
    expect(m).toMatch(/autre studio/)
    expect(m).not.toMatch(/expiré/)
  })
  it("tout autre echec de verification : « lien_expire » (comportement d'avant)", () => {
    expect(codeApresEchecVerification({})).toBe("lien_expire")
    expect(codeApresEchecVerification(null)).toBe("lien_expire")
    expect(messageErreurConnexion("lien_expire")).toMatch(/expiré/)
  })
  it("codes existants inchanges ; code inconnu : message generique ; aucun code : rien", () => {
    expect(messageErreurConnexion("compte_suspendu")).toMatch(/suspendu/)
    expect(messageErreurConnexion("compte_supprime")).toMatch(/n'existe plus/)
    expect(messageErreurConnexion("zzz")).toBe("Erreur de connexion. Veuillez réessayer.")
    expect(messageErreurConnexion(null)).toBeNull()
  })
})
