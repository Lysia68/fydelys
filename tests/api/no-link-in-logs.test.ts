import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createMockRequest } from "../helpers"
import { mockDb } from "../setup"

// ── Aucun lien de connexion dans les logs ────────────────────────────
//
// Jusqu'au 15/11/2026, send-magic-link loguait `linkData.properties` (lien
// complet + hashed_token) et invite-coach loguait `magicLinkUrl`. Ces valeurs
// suffisent a se connecter a la place de l'utilisateur tant que le lien est
// valable : tout lecteur des logs Vercel le pouvait.
//
// Le test fait passer un jeton reconnaissable dans tout le circuit, verifie
// qu'il ARRIVE dans le mail (sinon le test ne prouverait rien : il n'aurait
// pas atteint le code qui fabrique le lien), puis qu'il n'apparait dans
// AUCUN appel a console.*.

const JETON = "JETON-SECRET-0123456789"
const ACTION_LINK = `https://test.supabase.co/auth/v1/verify?token_hash=${JETON}&type=magiclink&redirect_to=https://fydelys.fr`

const sendEmail = vi.fn()
const emailProviderConfigured = vi.fn()
vi.mock("@/lib/email", () => ({
  sendEmail: (...a: any[]) => sendEmail(...a),
  emailProviderConfigured: () => emailProviderConfigured(),
}))

const signInWithOtp = vi.fn()
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ auth: { signInWithOtp } })),
}))

const generateLink = vi.fn()
let spies: ReturnType<typeof vi.spyOn>[] = []
let ip = 0

beforeEach(() => {
  vi.clearAllMocks()
  mockDb.from.mockReturnValue(mockDb._chain)
  mockDb._chain.eq.mockReturnValue(mockDb._chain)
  mockDb._chain.single.mockResolvedValue({
    data: { id: "studio-123", name: "Studio Test", slug: "studiotest", email: "studio@test.fr" },
    error: null,
  })
  ;(mockDb.auth.admin as any).generateLink = generateLink
  ;(mockDb.auth.admin as any).updateUserById = vi.fn().mockResolvedValue({ error: null })
  mockDb.auth.admin.listUsers.mockResolvedValue({ data: { users: [] } })
  mockDb.auth.admin.createUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null })
  generateLink.mockResolvedValue({
    data: { properties: { action_link: ACTION_LINK, hashed_token: JETON, email_otp: "123456" } },
    error: null,
  })
  sendEmail.mockResolvedValue({ ok: true, provider: "brevo" })
  emailProviderConfigured.mockReturnValue(true)
  signInWithOtp.mockResolvedValue({ error: null })
  spies = (["log", "info", "warn", "error", "debug"] as const).map(m =>
    vi.spyOn(console, m).mockImplementation(() => {}))
})

afterEach(() => spies.forEach(s => s.mockRestore()))

/** Tout ce qui a ete ecrit dans la console, serialise. */
function journal(): string {
  return spies.flatMap(s => s.mock.calls).map(args =>
    args.map(a => typeof a === "string" ? a : JSON.stringify(a)).join(" ")).join("\n")
}

function expectAucunLien() {
  const j = journal()
  expect(j).not.toContain(JETON)
  expect(j).not.toContain("123456")       // email_otp
  expect(j).not.toMatch(/token_hash=/)
  expect(j).not.toMatch(/action_link/)
}

const requete = (url: string, body: any) => createMockRequest(url, {
  method: "POST",
  body,
  headers: { "x-forwarded-for": `10.0.0.${++ip}` }, // rate limit : une IP par test
})

describe("send-magic-link : aucun lien dans les logs", () => {
  it("envoie le lien PAR MAIL et jamais dans la console", async () => {
    const { POST } = await import("@/app/api/send-magic-link/route")
    const res = await POST(requete("https://fydelys.fr/api/send-magic-link",
      { email: "adh@test.fr", tenantSlug: "studiotest" }))
    expect(res.status).toBe(200)
    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect(sendEmail.mock.calls[0][0].html).toContain(JETON) // le circuit a bien ete parcouru
    expectAucunLien()
  })

  it("sans fournisseur : erreur explicite, repli Supabase, aucun lien", async () => {
    emailProviderConfigured.mockReturnValue(false)
    const { POST } = await import("@/app/api/send-magic-link/route")
    const res = await POST(requete("https://fydelys.fr/api/send-magic-link",
      { email: "adh@test.fr", tenantSlug: "studiotest" }))
    expect((await res.json()).fallback).toBe(true)
    expect(signInWithOtp).toHaveBeenCalledTimes(1)
    expect(sendEmail).not.toHaveBeenCalled()
    expect(journal()).toMatch(/Aucun fournisseur d'e-mail configuré/)
    expectAucunLien()
  })
})

describe("invite-coach : aucun lien dans les logs", () => {
  it("envoie le lien PAR MAIL et jamais dans la console", async () => {
    const { POST } = await import("@/app/api/invite-coach/route")
    const res = await POST(requete("https://fydelys.fr/api/invite-coach",
      { email: "coach@test.fr", firstName: "Coach", studioId: "studio-123" }))
    expect(res.status).toBe(200)
    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect(sendEmail.mock.calls[0][0].html).toContain(JETON)
    expectAucunLien()
  })

  it("sans fournisseur : erreur explicite, AUCUN lien genere, repli Supabase", async () => {
    emailProviderConfigured.mockReturnValue(false)
    const { POST } = await import("@/app/api/invite-coach/route")
    const res = await POST(requete("https://fydelys.fr/api/invite-coach",
      { email: "coach@test.fr", firstName: "Coach", studioId: "studio-123" }))
    expect((await res.json()).fallback).toBe(true)
    expect(generateLink).not.toHaveBeenCalled()
    expect(signInWithOtp).toHaveBeenCalledTimes(1)
    expect(journal()).toMatch(/Aucun fournisseur d'e-mail configuré/)
    expectAucunLien()
  })
})
