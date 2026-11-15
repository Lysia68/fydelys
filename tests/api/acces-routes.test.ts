import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockRequest } from "../helpers"
import { mockDb } from "../setup"
import { checkAuth } from "@/lib/auth-check"

// ── Controle d'acces des routes fermees le 15/11/2026 (audit) ──────────────
// Pour chaque route : le refus (sans compte, mauvais role, autre studio) ET
// le cas legitime. Voir docs/AUDIT-ACCES-API.md.

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(async () => ({ ok: true, provider: "brevo" })),
  emailProviderConfigured: () => true,
}))

const SANS_COMPTE = { error: "Non authentifié", status: 401 }
const AUTRE_STUDIO = { error: "Accès refusé — studio non autorisé", status: 403 }
const compte = (role: string, studio_id = "studio-123", id = "u1") =>
  ({ user: { id, email: `${id}@t.fr` }, profile: { role, studio_id }, studioId: studio_id })
const commeSi = (a: any) => vi.mocked(checkAuth).mockResolvedValueOnce(a)

/** Chaine Supabase generique : chaque table renvoie ce qu'on lui donne. */
let donnees: Record<string, any>
let ecritures: { table: string; op: string; v: any }[]
beforeEach(() => {
  vi.clearAllMocks()
  donnees = {}
  ecritures = []
  mockDb.from.mockImplementation((table: string) => {
    const c: any = {}
    ;["select", "eq", "neq", "is", "in", "not", "or", "order", "limit", "gte", "lte"].forEach(k => { c[k] = vi.fn(() => c) })
    const val = () => donnees[table] ?? null
    c.single = vi.fn(() => Promise.resolve({ data: val(), error: null }))
    c.maybeSingle = vi.fn(() => Promise.resolve({ data: val(), error: null }))
    c.then = (ok: any) => Promise.resolve({ data: Array.isArray(val()) ? val() : val() ? [val()] : [], error: null }).then(ok)
    for (const op of ["insert", "update", "delete", "upsert"]) {
      c[op] = vi.fn((v: any) => { ecritures.push({ table, op, v }); return c })
    }
    return c
  })
  ;(mockDb.auth.admin as any).generateLink = vi.fn(async () => ({
    data: { properties: { action_link: "https://x/verify?token=t", hashed_token: "t" } }, error: null,
  }))
  mockDb.auth.admin.listUsers.mockResolvedValue({ data: { users: [] } })
  mockDb.auth.admin.createUser.mockResolvedValue({ data: { user: { id: "u-new" } }, error: null })
})

const appel = async (chemin: string, methode: string, body?: any) => {
  const mod: any = await import(`@/app/api/${chemin}/route`)
  const res = await mod[methode](createMockRequest(`https://studio.fydelys.fr/api/${chemin}`, { method: methode, body }))
  return { res, json: await res.json().catch(() => ({})) }
}

// ── 2. invite-coach : seulement un ADMIN du studio vise ─────────────────────
describe("POST /api/invite-coach", () => {
  const corps = { email: "coach@t.fr", firstName: "C", studioId: "studio-123" }
  const rienCree = () => {
    expect(mockDb.auth.admin.createUser).not.toHaveBeenCalled()
    expect(ecritures.filter(e => e.table === "invitations")).toEqual([])
  }

  it("sans compte : 401, rien n'est cree", async () => {
    commeSi(SANS_COMPTE)
    expect((await appel("invite-coach", "POST", corps)).res.status).toBe(401)
    rienCree()
  })
  it("coach du studio : 403", async () => {
    commeSi(compte("coach"))
    expect((await appel("invite-coach", "POST", corps)).res.status).toBe(403)
    rienCree()
  })
  it("adherent du studio : 403", async () => {
    commeSi(compte("adherent"))
    expect((await appel("invite-coach", "POST", corps)).res.status).toBe(403)
    rienCree()
  })
  it("admin d'un autre studio : refus relaye", async () => {
    commeSi(AUTRE_STUDIO)
    expect((await appel("invite-coach", "POST", corps)).res.status).toBe(403)
    rienCree()
  })
  it("admin du studio : invitation creee", async () => {
    commeSi(compte("admin"))
    donnees.studios = { id: "studio-123", name: "S", slug: "s", email: "s@t.fr" }
    const { res } = await appel("invite-coach", "POST", corps)
    expect(res.status).toBe(200)
    expect(ecritures.some(e => e.table === "invitations" && e.op === "insert")).toBe(true)
  })
})
