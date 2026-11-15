import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockRequest } from "../helpers"
import { mockDb } from "../setup"

// ── /api/verify-token : un admin ou un coach d'un AUTRE studio n'est jamais
// rétrogradé en adhérent ─────────────────────────────────────────────────
//
// Jusqu'au 15/11/2026 : un compte admin du studio A qui ouvrait un lien de
// connexion du studio B voyait son profil RÉÉCRIT en adhérent de B
// (`update({ role: "adherent", studio_id: B })`) — il perdait l'accès à son
// propre studio, sans retour possible autrement qu'en base.

let profil: any
let majProfils: any[]
let insertions: { table: string; v: any }[]

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  profil = null
  majProfils = []
  insertions = []
  mockDb.auth.verifyOtp.mockResolvedValue({
    data: { user: { id: "u-gerant", email: "gerant@studio-a.fr", user_metadata: {} } }, error: null,
  })
  mockDb.from.mockImplementation((table: string) => {
    const c: any = {}
    ;["select", "eq", "neq", "is", "order", "limit", "not"].forEach(k => { c[k] = vi.fn(() => c) })
    c.single = vi.fn(() => Promise.resolve({ data: table === "studios" ? { id: "s-B", slug: "studiob" } : null, error: null }))
    c.maybeSingle = vi.fn(() => Promise.resolve({ data: table === "profiles" ? profil : null, error: null }))
    c.update = vi.fn((v: any) => { if (table === "profiles") majProfils.push(v); return c })
    c.insert = vi.fn((v: any) => { insertions.push({ table, v }); return Promise.resolve({ error: null }) })
    return c
  })
})

const ouvrirLienDuStudioB = async () => {
  const { POST } = await import("@/app/api/verify-token/route")
  const res = await POST(createMockRequest("https://fydelys.fr/api/verify-token", {
    method: "POST", body: { tokenHash: "h", type: "magiclink", tenantSlug: "studiob", isRegister: false },
  }))
  return { res, json: await res.json() }
}

describe("verify-token : pas de rétrogradation d'un compte d'équipe d'un autre studio", () => {
  for (const role of ["admin", "coach"]) {
    it(`${role} du studio A sur un lien du studio B : refus clair, profil intact, aucune fiche adhérent`, async () => {
      profil = { role, studio_id: "s-A" }
      const { res, json } = await ouvrirLienDuStudioB()
      expect(res.status).toBe(403)
      expect(json.error).toMatch(/autre studio/)
      expect(json.code).toBe("autre_studio") // /auth/confirm le transmet a /login
      expect(majProfils).toEqual([])                                   // profil NON réécrit
      expect(insertions.filter(i => i.table === "members")).toEqual([]) // pas de fiche adhérent créée
      expect(res.headers.get("set-cookie")).toBeNull()                 // pas de session posée
    })
  }

  it("admin du MÊME studio : connexion normale, profil inchangé", async () => {
    profil = { role: "admin", studio_id: "s-B" }
    const { res, json } = await ouvrirLienDuStudioB()
    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(majProfils).toEqual([])
  })

  it("profil admin SANS studio (artefact de l'ancien déclencheur) : devient adhérent, comme avant", async () => {
    profil = { role: "admin", studio_id: null }
    const { res } = await ouvrirLienDuStudioB()
    expect(res.status).toBe(200)
    expect(majProfils).toEqual([{ role: "adherent", studio_id: "s-B" }])
  })

  it("nouveau compte sans profil : devient adhérent du studio (inchangé)", async () => {
    profil = null
    const { res } = await ouvrirLienDuStudioB()
    expect(res.status).toBe(200)
    expect(insertions.find(i => i.table === "profiles")?.v).toMatchObject({ role: "adherent", studio_id: "s-B" })
  })
})
