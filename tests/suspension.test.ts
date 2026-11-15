import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockRequest } from "./helpers"
import { mockDb } from "./setup"

// ── Coach suspendu (profiles.suspended_at, 15/11/2026) ─────────────────────
// Bloque par le middleware (pages) comme un adherent suspendu, et par le VRAI
// checkAuth (routes /api). Tant que la migration n'est pas appliquee, la
// lecture echoue : personne n'est suspendu, et rien ne tombe.

let profil: any
let suspension: { data: any; error: any }
beforeEach(() => {
  vi.clearAllMocks()
  profil = { role: "coach", studio_id: "s1" }
  suspension = { data: { suspended_at: "2026-11-15T10:00:00Z" }, error: null }
  ;(mockDb.auth as any).signOut = vi.fn(async () => ({ error: null }))
  mockDb.auth.getUser.mockResolvedValue({ data: { user: { id: "u-coach", email: "c@t.fr" } } })
  mockDb.from.mockImplementation((table: string) => {
    const c: any = {}
    let colonnes = ""
    c.select = vi.fn((cols: string) => { colonnes = cols; return c })
    ;["eq", "is", "order", "limit"].forEach(k => { c[k] = vi.fn(() => c) })
    c.single = vi.fn(async () => ({ data: table === "profiles" ? profil : null, error: null }))
    c.maybeSingle = vi.fn(async () => (table === "profiles" && colonnes.includes("suspended_at") ? suspension : { data: null, error: null }))
    return c
  })
})

const page = async () => {
  const { middleware } = await import("@/middleware")
  return middleware(createMockRequest("https://yogaplus.fydelys.fr/planning", { headers: { host: "yogaplus.fydelys.fr" } }))
}
const vraiCheckAuth = async () => {
  const { checkAuth } = await vi.importActual<typeof import("@/lib/auth-check")>("@/lib/auth-check")
  return checkAuth(createMockRequest("https://yogaplus.fydelys.fr/api/x"), "s1")
}

describe("middleware : coach suspendu", () => {
  it("coach suspendu : deconnecte et renvoye sur /login?error=compte_suspendu", async () => {
    const res = await page()
    expect(res.headers.get("location") || "").toContain("/login?error=compte_suspendu")
    expect((mockDb.auth as any).signOut).toHaveBeenCalled()
  })
  it("coach non suspendu : passe", async () => {
    suspension = { data: { suspended_at: null }, error: null }
    const res = await page()
    expect(res.headers.get("location") || "").not.toContain("compte_suspendu")
    expect((mockDb.auth as any).signOut).not.toHaveBeenCalled()
  })
  it("migration non appliquee (colonne absente) : personne n'est bloque", async () => {
    suspension = { data: null, error: { message: "column profiles.suspended_at does not exist" } }
    const res = await page()
    expect(res.headers.get("location") || "").not.toContain("compte_suspendu")
  })
})

describe("checkAuth (vrai) : coach suspendu", () => {
  it("coach suspendu : 403 « Compte suspendu »", async () => {
    expect(await vraiCheckAuth()).toEqual({ error: "Compte suspendu", status: 403 })
  })
  it("coach actif : accepte", async () => {
    suspension = { data: { suspended_at: null }, error: null }
    expect(await vraiCheckAuth()).toMatchObject({ studioId: "s1" })
  })
  it("migration non appliquee : accepte (rien ne tombe)", async () => {
    suspension = { data: null, error: { message: "column profiles.suspended_at does not exist" } }
    expect(await vraiCheckAuth()).toMatchObject({ studioId: "s1" })
  })
  it("un admin n'est jamais traite comme suspendu par ce controle", async () => {
    profil = { role: "admin", studio_id: "s1" }
    expect(await vraiCheckAuth()).toMatchObject({ studioId: "s1" })
  })
})
