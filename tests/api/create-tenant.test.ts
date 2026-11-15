import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createMockRequest } from "../helpers"
import { mockDb } from "../setup"
import { invitationAdminHtml } from "@/lib/emails/invitation-admin"

// ── Creation d'un studio par le super-admin : l'invitation de l'admin ─────
//
// Jusqu'au 15/11/2026, create-tenant generait le lien, le JETAIT, et le toast
// annoncait « Magic link envoyé ». Ces tests verifient que le lien part
// vraiment, a la bonne adresse, sans passer par les logs ; et qu'un e-mail
// deja utilise ne cree RIEN.

const JETON = "HASHED-TOKEN-0123456789"

const sendEmail = vi.fn()
const emailProviderConfigured = vi.fn()
vi.mock("@/lib/email", () => ({
  sendEmail: (...a: any[]) => sendEmail(...a),
  emailProviderConfigured: () => emailProviderConfigured(),
}))

const generateLink = vi.fn()
let spies: ReturnType<typeof vi.spyOn>[] = []

const CORPS = {
  studioName: "Mon Studio", slug: "monstudio", email: "gerant@test.fr",
  firstName: "Ana", lastName: "Lopez", type: "Yoga", plan: "Essentiel",
}

beforeEach(() => {
  vi.clearAllMocks()
  const c = mockDb._chain
  mockDb.from.mockReturnValue(c)
  ;["select", "insert", "update", "delete", "upsert", "eq", "order", "limit"].forEach(m => c[m].mockReturnValue(c))
  c.maybeSingle.mockResolvedValue({ data: null, error: null })      // slug libre
  // `clearAllMocks` ne vide PAS la file des `mockResolvedValueOnce` : un test
  // qui s'arrete tot (409) laisserait sa 2e reponse au test suivant.
  c.single.mockReset()
  mockDb.auth.admin.listUsers.mockReset()
  c.single
    .mockResolvedValueOnce({ data: { role: "superadmin" }, error: null })               // appelant
    .mockResolvedValueOnce({ data: { id: "st-1", slug: "monstudio" }, error: null })    // studio cree
  mockDb.rpc.mockResolvedValue({ error: null })
  mockDb.auth.getUser.mockResolvedValue({ data: { user: { id: "sa-1" } } })
  mockDb.auth.admin.listUsers.mockResolvedValue({ data: { users: [] }, error: null })
  mockDb.auth.admin.createUser.mockResolvedValue({ data: { user: { id: "u-new" } }, error: null })
  ;(mockDb.auth.admin as any).generateLink = generateLink
  generateLink.mockResolvedValue({
    data: { properties: { action_link: `https://x.supabase.co/auth/v1/verify?token=${JETON}`, hashed_token: JETON } },
    error: null,
  })
  sendEmail.mockResolvedValue({ ok: true, provider: "brevo" })
  emailProviderConfigured.mockReturnValue(true)
  spies = (["log", "info", "warn", "error", "debug"] as const).map(m =>
    vi.spyOn(console, m).mockImplementation(() => {}))
})
afterEach(() => spies.forEach(s => s.mockRestore()))

const journal = () => spies.flatMap(s => s.mock.calls).map(a => a.map(x => typeof x === "string" ? x : JSON.stringify(x)).join(" ")).join("\n")
const creer = async (body: any = CORPS) => {
  const { POST } = await import("@/app/api/sa/create-tenant/route")
  const res = await POST(createMockRequest("https://fydelys.fr/api/sa/create-tenant", { method: "POST", body }))
  return { res, json: await res.json() }
}
const studioInsere = () => mockDb.from.mock.calls.some(([t]: any[]) => t === "studios") && mockDb._chain.insert.mock.calls.length > 0

describe("POST /api/sa/create-tenant — invitation de l'admin", () => {
  it("envoie l'invitation par mail, au bon lien, avec la consigne d'expiration", async () => {
    const { res, json } = await creer()
    expect(res.status).toBe(200)
    expect(json.invitationEnvoyee).toBe(true)
    expect(json.warning).toBeUndefined()

    expect(sendEmail).toHaveBeenCalledTimes(1)
    const mail = sendEmail.mock.calls[0][0]
    expect(mail.fromName).toBe("Fydelys")
    expect(mail.to.email).toBe("gerant@test.fr")
    expect(mail.html).toContain(`https://fydelys.fr/auth/confirm?token_hash=${JETON}&amp;type=magiclink&amp;tenant=monstudio`)
    expect(mail.html).toContain("Ce lien est valable 1 heure. Passé ce délai, demandez un nouveau lien sur")
    expect(mail.html).toContain("https://monstudio.fydelys.fr/login")
    expect(mail.html).not.toContain("/dashboard")
  })

  it("le profil admin est enregistre (upsert sur id, rattache au studio) AVANT l'envoi", async () => {
    await creer()
    const c = mockDb._chain
    expect(c.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: "u-new", role: "admin", studio_id: "st-1" }),
      { onConflict: "id" })
    expect(c.upsert.mock.invocationCallOrder[0]).toBeLessThan(generateLink.mock.invocationCallOrder[0])
  })

  it("aucun lien ni jeton dans les logs", async () => {
    await creer()
    expect(sendEmail.mock.calls[0][0].html).toContain(JETON) // le circuit a bien ete parcouru
    expect(journal()).not.toContain(JETON)
    expect(journal()).not.toMatch(/token_hash=/)
  })

  it("envoi en echec : studio cree quand meme, avertissement explicite", async () => {
    sendEmail.mockResolvedValue({ ok: false, provider: "brevo", error: "401" })
    const { res, json } = await creer()
    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(json.studioId).toBe("st-1")
    expect(json.invitationEnvoyee).toBe(false)
    expect(json.warning).toMatch(/invitation n'est pas partie/)
    expect(json.warning).toMatch(/Renvoyer l'invitation/)
  })

  it("aucun fournisseur d'e-mail : pas de lien genere, avertissement", async () => {
    emailProviderConfigured.mockReturnValue(false)
    const { json } = await creer()
    expect(generateLink).not.toHaveBeenCalled()
    expect(json.invitationEnvoyee).toBe(false)
    expect(journal()).toMatch(/Aucun fournisseur d'e-mail configuré/)
  })

  it("profil en echec : PAS d'invitation (le lien ouvrirait un compte adherent)", async () => {
    mockDb._chain.upsert.mockReturnValueOnce(Promise.resolve({ error: { message: "violation" } }))
    const { json } = await creer()
    expect(generateLink).not.toHaveBeenCalled()
    expect(sendEmail).not.toHaveBeenCalled()
    expect(json.invitationEnvoyee).toBe(false)
    expect(json.warning).toMatch(/profil admin/)
  })
})

describe("POST /api/sa/create-tenant — e-mail deja utilise", () => {
  it("409 clair, et RIEN n'est cree (ni studio, ni compte, ni profil)", async () => {
    mockDb.auth.admin.listUsers.mockResolvedValue({ data: { users: [{ id: "u-old", email: "Gerant@Test.fr" }] }, error: null })
    const { res, json } = await creer()
    expect(res.status).toBe(409)
    expect(json.error).toMatch(/déjà associée à un compte/)
    expect(studioInsere()).toBe(false)
    expect(mockDb.auth.admin.createUser).not.toHaveBeenCalled()
    expect(mockDb._chain.upsert).not.toHaveBeenCalled()
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it("trouve aussi un compte au-dela de la premiere page de 1 000", async () => {
    const page1 = Array.from({ length: 1000 }, (_, i) => ({ id: `u${i}`, email: `x${i}@test.fr` }))
    mockDb.auth.admin.listUsers
      .mockResolvedValueOnce({ data: { users: page1 }, error: null })
      .mockResolvedValueOnce({ data: { users: [{ id: "u-old", email: "gerant@test.fr" }] }, error: null })
    const { res } = await creer()
    expect(res.status).toBe(409)
    expect(mockDb.auth.admin.listUsers).toHaveBeenCalledTimes(2)
  })
})

describe("POST /api/sa/resend-admin-invite", () => {
  const renvoyer = async () => {
    const { POST } = await import("@/app/api/sa/resend-admin-invite/route")
    const res = await POST(createMockRequest("https://fydelys.fr/api/sa/resend-admin-invite", { method: "POST", body: { studioId: "st-1" } }))
    return { res, json: await res.json() }
  }
  beforeEach(() => {
    const c = mockDb._chain
    c.single.mockReset()
    c.single
      .mockResolvedValueOnce({ data: { role: "superadmin" }, error: null })
      .mockResolvedValueOnce({ data: { id: "st-1", name: "Mon Studio", slug: "monstudio" }, error: null })
    ;(mockDb.auth.admin.getUserById as any).mockResolvedValue({ data: { user: { email: "gerant@test.fr" } } })
  })

  it("renvoie l'invitation a l'admin du studio", async () => {
    mockDb._chain.limit.mockResolvedValueOnce({ data: [{ id: "u-adm", first_name: "Ana" }], error: null })
    const { res, json } = await renvoyer()
    expect(res.status).toBe(200)
    expect(json.email).toBe("gerant@test.fr")
    expect(sendEmail.mock.calls[0][0].html).toContain("tenant=monstudio")
    expect(journal()).not.toContain(JETON)
  })

  it("studio sans profil admin : 409, rien n'est envoye", async () => {
    mockDb._chain.limit.mockResolvedValueOnce({ data: [], error: null })
    const { res } = await renvoyer()
    expect(res.status).toBe(409)
    expect(generateLink).not.toHaveBeenCalled()
  })

  it("envoi en echec : erreur remontee au super-admin", async () => {
    mockDb._chain.limit.mockResolvedValueOnce({ data: [{ id: "u-adm", first_name: "Ana" }], error: null })
    sendEmail.mockResolvedValue({ ok: false, provider: "brevo", error: "x" })
    const { res, json } = await renvoyer()
    expect(res.status).toBe(502)
    expect(json.error).toMatch(/Invitation non envoyée/)
  })
})

describe("modele du mail d'invitation", () => {
  it("echappe les valeurs saisies", () => {
    const html = invitationAdminHtml({ prenom: "<b>A</b>", studioName: "<script>x</script>", slug: "s", lien: "https://l?a=1&b=2" })
    expect(html).not.toContain("<script>x</script>")
    expect(html).toContain("&lt;script&gt;")
    expect(html).not.toContain("<b>A</b>")
  })
})
