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

// Stripe : aucun appel reseau ; on observe seulement s'il est sollicite.
const stripeAppels: string[] = []
vi.mock("stripe", () => ({
  default: class {
    accounts = {
      createLoginLink: async () => { stripeAppels.push("createLoginLink"); return { url: "https://connect.stripe.com/express/x" } },
      create: async () => { stripeAppels.push("create"); return { id: "acct_1" } },
      retrieve: async () => { stripeAppels.push("retrieve"); return { charges_enabled: true, details_submitted: true } },
    }
    accountLinks = { create: async () => { stripeAppels.push("accountLinks"); return { url: "https://connect.stripe.com/setup/x" } } }
  },
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
  stripeAppels.length = 0
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

// ── 3. connect/onboard, connect/disconnect, connect/status : ADMIN du studio ─
describe("Stripe Connect (onboard, disconnect, status)", () => {
  const routes: [string, string, any][] = [
    ["connect/onboard", "POST", { studioId: "studio-123" }],
    ["connect/disconnect", "POST", { studioId: "studio-123" }],
  ]
  const studioActif = { id: "studio-123", name: "S", slug: "s", stripe_connect_id: "acct_1", stripe_connect_status: "active" }

  for (const [chemin, m, corps] of routes) {
    for (const [lbl, a, code] of [["sans compte", SANS_COMPTE, 401], ["adherent", compte("adherent"), 403], ["coach", compte("coach"), 403], ["admin d'un autre studio", AUTRE_STUDIO, 403]] as const) {
      it(`${chemin} — ${lbl} : ${code}, ni Stripe ni base`, async () => {
        commeSi(a); donnees.studios = studioActif
        expect((await appel(chemin, m, corps)).res.status).toBe(code)
        expect(stripeAppels).toEqual([])
        expect(ecritures).toEqual([])
      })
    }
  }

  it("connect/status — sans compte : 401 ; adherent : 403", async () => {
    const { GET } = await import("@/app/api/connect/status/route")
    const req = () => createMockRequest("https://studio.fydelys.fr/api/connect/status?studioId=studio-123")
    commeSi(SANS_COMPTE); expect((await GET(req())).status).toBe(401)
    commeSi(compte("adherent")); expect((await GET(req())).status).toBe(403)
    expect(stripeAppels).toEqual([])
  })

  it("admin du studio : onboard renvoie le lien, disconnect deconnecte, status repond", async () => {
    donnees.studios = studioActif
    commeSi(compte("admin"))
    const on = await appel("connect/onboard", "POST", { studioId: "studio-123" })
    expect(on.res.status).toBe(200)
    expect(on.json.url).toMatch(/stripe\.com/)
    commeSi(compte("admin"))
    expect((await appel("connect/disconnect", "POST", { studioId: "studio-123" })).res.status).toBe(200)
    expect(ecritures).toContainEqual({ table: "studios", op: "update", v: { stripe_connect_id: null, stripe_connect_status: "not_connected" } })
    commeSi(compte("admin"))
    const { GET } = await import("@/app/api/connect/status/route")
    expect((await GET(createMockRequest("https://studio.fydelys.fr/api/connect/status?studioId=studio-123"))).status).toBe(200)
  })
})
