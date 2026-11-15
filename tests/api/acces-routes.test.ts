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
  // `clearAllMocks` ne vide PAS la file des mockResolvedValueOnce : un test
  // interrompu laisserait son compte au suivant. On repart du compte par defaut.
  vi.mocked(checkAuth).mockReset()
  vi.mocked(checkAuth).mockImplementation((async () => compte("admin", "studio-123", "test-uid")) as any)
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

// ── 4. sa/studios : SUPER-ADMIN uniquement ───────────────────────────────────
describe("GET /api/sa/studios", () => {
  const lire = async () => {
    const { GET } = await import("@/app/api/sa/studios/route")
    return GET(createMockRequest("https://fydelys.fr/api/sa/studios"))
  }
  for (const [lbl, a, code] of [["sans compte", SANS_COMPTE, 401], ["admin de studio", compte("admin"), 403], ["coach", compte("coach"), 403], ["adherent", compte("adherent"), 403]] as const) {
    it(`${lbl} : ${code}, aucune lecture`, async () => {
      commeSi(a)
      expect((await lire()).status).toBe(code)
      expect(mockDb.from).not.toHaveBeenCalled()
      expect(mockDb.auth.admin.listUsers).not.toHaveBeenCalled()
    })
  }
  it("super-admin : liste renvoyee", async () => {
    commeSi(compte("superadmin", ""))
    donnees.studios = [{ id: "s1", name: "S" }]
    const res = await lire()
    expect(res.status).toBe(200)
    expect(mockDb.from).toHaveBeenCalledWith("studios")
  })
})

// ── 5. bookings (creation) : le membre lui-meme, ou l'equipe de son studio ──
describe("POST /api/bookings", () => {
  const pour = (memberId: string, extra: any = {}) => ({ sessionId: "sess1", memberId, studioId: "studio-123", ...extra })
  const aucuneResa = () => expect(ecritures.filter(e => e.table === "bookings" && e.op === "insert")).toEqual([])
  beforeEach(() => { donnees.sessions = { studio_id: "studio-123", spots: 10 } })

  it("sans compte : 401, aucune reservation", async () => {
    commeSi(SANS_COMPTE)
    expect((await appel("bookings", "POST", pour("m-alice"))).res.status).toBe(401)
    aucuneResa()
  })
  it("adherent qui reserve au nom d'un AUTRE membre : 403", async () => {
    commeSi(compte("adherent")); donnees.members = { id: "m-bob" }
    expect((await appel("bookings", "POST", pour("m-alice"))).res.status).toBe(403)
    aucuneResa()
  })
  it("adherent qui envoie force=true, meme pour lui-meme : 403", async () => {
    commeSi(compte("adherent")); donnees.members = { id: "m-alice" }
    expect((await appel("bookings", "POST", pour("m-alice", { force: true }))).res.status).toBe(403)
    aucuneResa()
  })
  it("adherent qui cree un invite : 403", async () => {
    commeSi(compte("adherent")); donnees.members = { id: "m-alice" }
    expect((await appel("bookings", "POST", { sessionId: "sess1", studioId: "studio-123", guestName: "X", hostMemberId: "m-alice" })).res.status).toBe(403)
    aucuneResa()
  })
  it("seance d'un autre studio : 403", async () => {
    commeSi(compte("admin")); donnees.sessions = { studio_id: "autre" }; donnees.members = { studio_id: "studio-123" }
    expect((await appel("bookings", "POST", pour("m-alice", { force: true }))).res.status).toBe(403)
    aucuneResa()
  })
  it("equipe : membre d'un autre studio : 403", async () => {
    commeSi(compte("admin")); donnees.members = { studio_id: "autre" }
    expect((await appel("bookings", "POST", pour("m-x", { force: true }))).res.status).toBe(403)
    aucuneResa()
  })
  it("adherent pour LUI-MEME : passe le controle d'acces", async () => {
    commeSi(compte("adherent")); donnees.members = { id: "m-alice", studio_id: "studio-123" }
    expect((await appel("bookings", "POST", pour("m-alice"))).res.status).not.toBe(403)
  })
  it("equipe (coach) pour un membre du studio, avec force : passe le controle d'acces", async () => {
    commeSi(compte("coach")); donnees.members = { studio_id: "studio-123" }
    expect((await appel("bookings", "POST", pour("m-alice", { force: true }))).res.status).not.toBe(403)
  })
})

// ── 6. send-reminder : equipe du studio ; destinataires relus en base ─────────
describe("POST /api/send-reminder", () => {
  // Ce qu'un attaquant envoyait : une adresse libre et un contenu libre.
  const corps = { sessId: "sess1", studioId: "studio-123",
    members: [{ email: "victime@exterieur.com", name: "Victime" }], sess: { teacher: "<a href=https://phish>clic</a>" } }
  const envois = async () => {
    const { sendEmail } = await import("@/lib/email")
    return vi.mocked(sendEmail).mock.calls.map((c: any) => c[0])
  }
  beforeEach(() => {
    donnees.sessions = { studio_id: "studio-123", session_date: "2026-11-20", session_time: "10:00:00", duration_min: 60, teacher: "Lea", room: "A" }
    donnees.bookings = [{ members: { first_name: "Alice", last_name: "M", email: "alice@studio.fr", studio_id: "studio-123" } }]
  })

  for (const [lbl, a, code] of [["sans compte", SANS_COMPTE, 401], ["adherent", compte("adherent"), 403], ["admin d'un autre studio", AUTRE_STUDIO, 403]] as const) {
    it(`${lbl} : ${code}, aucun mail`, async () => {
      commeSi(a)
      expect((await appel("send-reminder", "POST", corps)).res.status).toBe(code)
      expect(await envois()).toEqual([])
    })
  }
  it("seance d'un autre studio : 403, aucun mail", async () => {
    commeSi(compte("admin")); donnees.sessions = { ...donnees.sessions, studio_id: "autre" }
    expect((await appel("send-reminder", "POST", corps)).res.status).toBe(403)
    expect(await envois()).toEqual([])
  })
  it("equipe du studio : mail aux SEULS inscrits relus en base, jamais a l'adresse ni au contenu de la requete", async () => {
    commeSi(compte("coach"))
    const { res } = await appel("send-reminder", "POST", corps)
    expect(res.status).toBe(200)
    const mails = await envois()
    expect(mails.map((m: any) => m.to)).toEqual(["alice@studio.fr"])
    expect(JSON.stringify(mails)).not.toContain("victime@exterieur.com")
    expect(JSON.stringify(mails)).not.toContain("phish")
    expect(mails[0].html).toContain("Lea")
  })
})

// ── 7. Fuites sans compte ────────────────────────────────────────────────────
const get = async (chemin: string, qs: string) => {
  const mod: any = await import(`@/app/api/${chemin}/route`)
  const res = await mod.GET(createMockRequest(`https://studio.fydelys.fr/api/${chemin}?${qs}`))
  return { res, json: await res.json().catch(() => ({})) }
}

describe("GET /api/bookings", () => {
  it("sans compte : 401", async () => {
    commeSi(SANS_COMPTE)
    expect((await get("bookings", "memberId=m-alice&studioId=studio-123")).res.status).toBe(401)
  })
  it("adherent qui lit les reservations d'un AUTRE membre : 403", async () => {
    commeSi(compte("adherent")); donnees.members = { id: "m-bob" }
    expect((await get("bookings", "memberId=m-alice&studioId=studio-123")).res.status).toBe(403)
  })
  it("adherent : ses propres reservations", async () => {
    commeSi(compte("adherent")); donnees.members = { id: "m-alice" }
    expect((await get("bookings", "memberId=m-alice&studioId=studio-123")).res.status).toBe(200)
  })
  it("equipe : membre d'un autre studio : 403", async () => {
    commeSi(compte("admin")); donnees.members = { studio_id: "autre" }
    expect((await get("bookings", "memberId=m-x&studioId=studio-123")).res.status).toBe(403)
  })
  it("planning (sessionIds) : adherent 403 ; equipe 200, filtre sur les seances du studio", async () => {
    commeSi(compte("adherent"))
    expect((await get("bookings", "sessionIds=s1,s2&studioId=studio-123")).res.status).toBe(403)
    commeSi(compte("coach")); donnees.bookings = []
    expect((await get("bookings", "sessionIds=s1,s2&studioId=studio-123")).res.status).toBe(200)
  })
})

describe("GET /api/members/history", () => {
  it("sans compte : 401 ; adherent : 403 ; equipe d'un autre studio : 403", async () => {
    commeSi(SANS_COMPTE); expect((await get("members/history", "memberId=m1")).res.status).toBe(401)
    donnees.members = { studio_id: "studio-123" }
    commeSi(compte("adherent")); expect((await get("members/history", "memberId=m1")).res.status).toBe(403)
    commeSi(compte("admin", "autre")); expect((await get("members/history", "memberId=m1")).res.status).toBe(403)
  })
  it("equipe du studio du membre : 200", async () => {
    commeSi(compte("coach")); donnees.members = { studio_id: "studio-123" }
    expect((await get("members/history", "memberId=m1")).res.status).toBe(200)
  })
})

describe("GET /api/invoice", () => {
  beforeEach(() => {
    donnees.member_payments = { id: "p1", amount: 10, studio_id: "studio-123", member_id: "m-alice", members: { first_name: "A" } }
    donnees.studios = { name: "S" }
  })
  it("sans compte : 401", async () => {
    commeSi(SANS_COMPTE); expect((await get("invoice", "paymentId=p1")).res.status).toBe(401)
  })
  it("adherent qui n'est pas le payeur : 403", async () => {
    commeSi(compte("adherent")); donnees.members = { id: "m-bob" }
    expect((await get("invoice", "paymentId=p1")).res.status).toBe(403)
  })
  it("equipe d'un autre studio : 403", async () => {
    commeSi(compte("admin", "autre")); donnees.members = null
    expect((await get("invoice", "paymentId=p1")).res.status).toBe(403)
  })
  it("le payeur lui-meme, et l'equipe du studio : 200", async () => {
    commeSi(compte("adherent")); donnees.members = { id: "m-alice" }
    expect((await get("invoice", "paymentId=p1")).res.status).toBe(200)
    commeSi(compte("admin"))
    expect((await get("invoice", "paymentId=p1")).res.status).toBe(200)
  })
})

describe("/api/team", () => {
  it("GET : sans compte 401 ; adherent 403 ; coach du studio 200", async () => {
    commeSi(SANS_COMPTE); expect((await get("team", "studioId=studio-123")).res.status).toBe(401)
    commeSi(compte("adherent")); expect((await get("team", "studioId=studio-123")).res.status).toBe(403)
    commeSi(compte("coach")); donnees.profiles = []
    expect((await get("team", "studioId=studio-123")).res.status).toBe(200)
  })
  it("POST : sans compte 401 ; coach 403 ; rien n'est ecrit", async () => {
    commeSi(SANS_COMPTE); expect((await appel("team", "POST", { coachId: "c1", discIds: ["d1"], studioId: "studio-123" })).res.status).toBe(401)
    commeSi(compte("coach")); expect((await appel("team", "POST", { coachId: "c1", discIds: ["d1"], studioId: "studio-123" })).res.status).toBe(403)
    expect(ecritures).toEqual([])
  })
  it("POST : admin, mais coach d'un AUTRE studio : 403, rien n'est ecrit", async () => {
    commeSi(compte("admin")); donnees.profiles = { studio_id: "autre" }
    expect((await appel("team", "POST", { coachId: "c1", discIds: ["d1"], studioId: "studio-123" })).res.status).toBe(403)
    expect(ecritures).toEqual([])
  })
  it("POST : admin du studio, coach du studio : disciplines enregistrees", async () => {
    commeSi(compte("admin")); donnees.profiles = { studio_id: "studio-123" }
    expect((await appel("team", "POST", { coachId: "c1", discIds: ["d1"], studioId: "studio-123" })).res.status).toBe(200)
    expect(ecritures.some(e => e.table === "coach_disciplines" && e.op === "insert")).toBe(true)
  })
})

// ── 8. Routes de l'equipe : l'adherent est refuse ────────────────────────────
describe("routes de l'equipe — adherent refuse, equipe acceptee", () => {
  const cas: [string, () => Promise<Response>][] = [
    ["GET /api/activity", async () => (await import("@/app/api/activity/route")).GET(createMockRequest("https://s.fydelys.fr/api/activity?studioId=studio-123"))],
    ["GET /api/export", async () => (await import("@/app/api/export/route")).GET(createMockRequest("https://s.fydelys.fr/api/export?studioId=studio-123&type=members"))],
    ["POST /api/disciplines", async () => (await import("@/app/api/disciplines/route")).POST(createMockRequest("https://s.fydelys.fr/api/disciplines", { method: "POST", body: { studioId: "studio-123", name: "Yoga" } }))],
    ["GET /api/members", async () => (await import("@/app/api/members/route")).GET(createMockRequest("https://s.fydelys.fr/api/members?studioId=studio-123"))],
    ["POST /api/members", async () => (await import("@/app/api/members/route")).POST(createMockRequest("https://s.fydelys.fr/api/members", { method: "POST", body: { studioId: "studio-123", email: "n@t.fr", first_name: "N" } }))],
  ]
  for (const [lbl, f] of cas) {
    it(`${lbl} : adherent du studio → 403, rien n'est ecrit`, async () => {
      commeSi(compte("adherent"))
      expect((await f()).status).toBe(403)
      expect(ecritures).toEqual([])
    })
    it(`${lbl} : coach du studio → pas de refus d'acces`, async () => {
      commeSi(compte("coach"))
      // Une exception APRES le controle (bouchon de base minimal) prouve aussi
      // que l'acces a ete accorde : un refus repond 403 avant toute lecture.
      const r = await f().catch(() => null)
      expect(r?.status).not.toBe(403)
    })
  }
})

// ── 8 bis. member-profile : sa propre fiche, ou l'equipe du studio ───────────
describe("POST /api/member-profile", () => {
  const corps = (memberId?: string) => ({ studioId: "studio-123", ...(memberId ? { memberId } : {}), first_name: "Nouveau", last_name: "Nom", role: "admin", credits: 999 })
  const poster = async (b: any) => (await import("@/app/api/member-profile/route")).POST(createMockRequest("https://s.fydelys.fr/api/member-profile", { method: "POST", body: b }))
  const majMembres = () => ecritures.filter(e => e.table === "members" && e.op === "update")
  const majProfils = () => ecritures.filter(e => e.table === "profiles" && e.op === "update")
  beforeEach(() => { mockDb.auth.getUser.mockResolvedValue({ data: { user: { id: "u-alice", email: "alice@t.fr" } } }) })

  it("sans compte : 401", async () => {
    mockDb.auth.getUser.mockResolvedValueOnce({ data: { user: null } })
    expect((await poster(corps("m-bob"))).status).toBe(401)
  })
  it("adherent qui vise la fiche d'un AUTRE membre : 403, rien n'est ecrit", async () => {
    donnees.members = { studio_id: "studio-123", auth_user_id: "u-bob" }
    donnees.profiles = { role: "adherent", studio_id: "studio-123" }
    expect((await poster(corps("m-bob"))).status).toBe(403)
    expect(majMembres()).toEqual([])
  })
  it("fiche d'un autre studio : 403", async () => {
    donnees.members = { studio_id: "autre", auth_user_id: "u-alice" }
    expect((await poster(corps("m-x"))).status).toBe(403)
    expect(majMembres()).toEqual([])
  })
  it("sa propre fiche : ecrite, champs autorises seulement, profil synchronise", async () => {
    donnees.members = { studio_id: "studio-123", auth_user_id: "u-alice" }
    expect((await poster(corps("m-alice"))).status).toBe(200)
    const ecrit = majMembres()[0].v
    expect(ecrit.first_name).toBe("Nouveau")
    expect(ecrit).not.toHaveProperty("role")
    expect(ecrit).not.toHaveProperty("credits")
    expect(majProfils()).toHaveLength(1)
  })
  it("admin du studio sur la fiche d'un membre : ecrite, et le profil de l'ADMIN n'est PAS reecrit", async () => {
    donnees.members = { studio_id: "studio-123", auth_user_id: "u-bob" }
    donnees.profiles = { role: "admin", studio_id: "studio-123" }
    expect((await poster(corps("m-bob"))).status).toBe(200)
    expect(majMembres()).toHaveLength(1)
    expect(majProfils()).toEqual([])
  })
})
