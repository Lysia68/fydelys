import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createMockRequest } from "../helpers"
import { mockDb } from "../setup"

// ── Webhooks Stripe (connect/webhook ET stripe/webhook), 15/11/2026 ─────────
//   - idempotence sur event.id : un evenement rejoue ne credite pas deux fois ;
//   - garde-fou secondaire si la table d'idempotence manque : paiement deja
//     enregistre (member_payments.stripe_payment_id) ;
//   - le membre credite doit etre du studio des metadonnees ;
//   - si le traitement echoue, la reservation est liberee (Stripe re-tentera).
// La signature est simulee : constructEvent renvoie le corps tel quel.

let renouvellement: any
vi.mock("stripe", () => ({
  default: class {
    webhooks = { constructEvent: (body: string) => JSON.parse(body) }
    subscriptions = { retrieve: async () => renouvellement }
  },
}))

// Base en memoire, avec ETAT : un rejeu doit voir le premier passage.
let tables: Record<string, any[]>
let tableIdempotenceAbsente = false
let membresEnPanne = false
function base() {
  mockDb.from.mockImplementation((t: string) => {
    const filtres: [string, any][] = []
    const c: any = {}
    const rows = () => (tables[t] ||= [])
    const match = () => rows().filter(r => filtres.every(([k, v]) => r[k] === v))
    ;["select", "order", "limit", "neq", "in", "not", "is"].forEach(k => { c[k] = vi.fn(() => c) })
    c.eq = vi.fn((k: string, v: any) => { filtres.push([k, v]); return c })
    c.single = vi.fn(async () => {
      if (t === "members" && membresEnPanne) throw new Error("panne base")
      return { data: match()[0] ?? null, error: null }
    })
    c.maybeSingle = c.single
    c.insert = vi.fn(async (v: any) => {
      if (t === "stripe_webhook_events") {
        if (tableIdempotenceAbsente) return { error: { code: "42P01", message: 'relation "stripe_webhook_events" does not exist' } }
        if (rows().some(r => r.event_id === v.event_id)) return { error: { code: "23505", message: "duplicate key" } }
      }
      rows().push(v); return { error: null }
    })
    c.update = vi.fn((v: any) => ({ eq: async (k: string, id: any) => { rows().filter(r => r[k] === id).forEach(r => Object.assign(r, v)); return { error: null } } }))
    c.delete = vi.fn(() => ({ eq: async (k: string, id: any) => { tables[t] = rows().filter(r => r[k] !== id); return { error: null } } }))
    return c
  })
}

const evtCredits = (id = "evt_1", memberId = "m-alice") => ({
  id, type: "checkout.session.completed",
  data: { object: { payment_status: "paid", payment_intent: "pi_1", id: "cs_1", amount_total: 9000,
    metadata: { studioId: "studio-123", memberId, type: "credits", credits: "10", creditsPackId: "pk-1" } } },
})
const credits = () => tables.members.find(m => m.id === "m-alice").credits

let secretAvant: string | undefined
beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, "log").mockImplementation(() => {}); vi.spyOn(console, "warn").mockImplementation(() => {}); vi.spyOn(console, "error").mockImplementation(() => {})
  secretAvant = process.env.STRIPE_CONNECT_WEBHOOK_SECRET
  process.env.STRIPE_CONNECT_WEBHOOK_SECRET = "whsec_test"
  tableIdempotenceAbsente = false; membresEnPanne = false
  tables = {
    members: [{ id: "m-alice", studio_id: "studio-123", credits: 3, credits_total: 3 }, { id: "m-x", studio_id: "autre", credits: 0, credits_total: 0 }],
    credits_packs: [{ id: "pk-1", name: "Pack 10" }],
    stripe_webhook_events: [], member_payments: [], member_activity: [],
  }
  base()
})
afterEach(() => { process.env.STRIPE_CONNECT_WEBHOOK_SECRET = secretAvant; vi.restoreAllMocks() })

for (const nom of ["connect", "stripe"]) {
  const envoyer = async (evt: any) => {
    const { POST } = await import(`@/app/api/${nom}/webhook/route`)
    const res = await POST(createMockRequest(`https://fydelys.fr/api/${nom}/webhook`, {
      method: "POST", body: evt, headers: { "stripe-signature": "t=1,v1=x" },
    }))
    return { res, json: await res.json().catch(() => ({})) }
  }

  describe(`/api/${nom}/webhook`, () => {
    it("premier passage : credite une fois, evenement enregistre", async () => {
      const { res } = await envoyer(evtCredits())
      expect(res.status).toBe(200)
      expect(credits()).toBe(13)
      expect(tables.stripe_webhook_events.map(e => e.event_id)).toEqual(["evt_1"])
    })

    it("meme evenement rejoue : PAS de second credit", async () => {
      await envoyer(evtCredits())
      const { json } = await envoyer(evtCredits())
      expect(json.duplicate).toBe(true)
      expect(credits()).toBe(13)
      expect(tables.member_payments).toHaveLength(1)
    })

    it("sans table d'idempotence : le paiement deja enregistre empeche le double credit", async () => {
      tableIdempotenceAbsente = true
      await envoyer(evtCredits("evt_1"))
      await envoyer(evtCredits("evt_2")) // autre evenement, meme paiement pi_1
      expect(credits()).toBe(13)
    })

    it("membre d'un AUTRE studio que celui du paiement : rien n'est credite", async () => {
      await envoyer(evtCredits("evt_1", "m-x"))
      expect(tables.members.find(m => m.id === "m-x").credits).toBe(0)
      expect(tables.member_payments).toEqual([])
    })

    it("echec du traitement : reservation liberee, la tentative suivante credite", async () => {
      membresEnPanne = true
      const { res } = await envoyer(evtCredits())
      expect(res.status).toBe(500)
      expect(tables.stripe_webhook_events).toEqual([])
      membresEnPanne = false
      await envoyer(evtCredits())
      expect(credits()).toBe(13)
    })

    it("renouvellement d'abonnement pour un membre d'un AUTRE studio : rien n'est modifie", async () => {
      renouvellement = { metadata: { studioId: "studio-123", memberId: "m-x", subscriptionId: "sub_1" }, current_period_end: 1767225600 }
      const avant = JSON.stringify(tables.members)
      await envoyer({ id: "evt_inv", type: "invoice.payment_succeeded",
        data: { object: { id: "in_1", subscription: "sub_stripe_1", amount_paid: 5900, payment_intent: "pi_inv" } } })
      expect(JSON.stringify(tables.members)).toBe(avant)
      expect(tables.member_payments).toEqual([])
    })
  })
}
