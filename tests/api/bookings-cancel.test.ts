import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockRequest } from "../helpers"
import { mockDb } from "../setup"
import { checkAuth } from "@/lib/auth-check"

// ── POST /api/bookings/cancel : qui peut annuler quoi ──────────────────────
// Avant le 15/11/2026 : tout compte connecte annulait n'importe quelle
// reservation, de n'importe quel studio, par son id.

vi.mock("@/lib/activity", () => ({ logActivity: vi.fn() }))
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn(), emailProviderConfigured: () => false }))

// Reservation d'Alice (fiche membre m-alice), seance du studio-123.
const RESA = { id: "bk1", session_id: "sess1", member_id: "m-alice", status: "confirmed", attended: null,
  host_member_id: null, guest_name: null, sessions: { studio_id: "studio-123" } }

let resa: any          // ce que renvoie la lecture de la reservation
let moi: any           // fiche membre liee au compte adherent
let majBookings: any[] // updates sur bookings

function compte(role: string, studio_id: string, id = "u1") {
  vi.mocked(checkAuth).mockResolvedValueOnce({ user: { id }, profile: { role, studio_id }, studioId: studio_id } as any)
}

beforeEach(() => {
  vi.clearAllMocks()
  resa = { ...RESA }
  moi = null
  majBookings = []
  mockDb.from.mockImplementation((table: string) => {
    const c: any = {}
    ;["select", "eq", "neq", "is", "order", "limit", "in"].forEach(k => { c[k] = vi.fn(() => c) })
    // La reservation est servie par .single() ET .maybeSingle() : l'ancienne
    // route lisait par .single() — sans cela, rejouer les tests contre elle
    // echouerait sur un 404 du bouchon, pas sur l'annulation fautive.
    c.single = vi.fn(() => Promise.resolve({ data: table === "bookings" ? resa : null, error: null }))
    c.maybeSingle = vi.fn(() => Promise.resolve({
      data: table === "bookings" ? resa : table === "members" ? moi : null, error: null,
    }))
    c.update = vi.fn((v: any) => { if (table === "bookings") majBookings.push(v); return c })
    return c
  })
})

const annuler = async (body: any) => {
  const { POST } = await import("@/app/api/bookings/cancel/route")
  const res = await POST(createMockRequest("https://studio.fydelys.fr/api/bookings/cancel", { method: "POST", body }))
  return { res, json: await res.json() }
}
const annulee = () => majBookings.some(v => v.status === "cancelled")

describe("refus — 403, rien n'est annule", () => {
  it("adherent d'un AUTRE studio", async () => {
    compte("adherent", "autre-studio"); moi = { id: "m-alice" }
    const { res } = await annuler({ sessionId: "sess1", memberId: "m-alice" })
    expect(res.status).toBe(403)
    expect(annulee()).toBe(false)
  })

  it("admin d'un AUTRE studio (par bookingId)", async () => {
    compte("admin", "autre-studio")
    const { res } = await annuler({ bookingId: "bk1" })
    expect(res.status).toBe(403)
    expect(annulee()).toBe(false)
  })

  it("adherent du MEME studio qui vise la reservation d'un autre adherent", async () => {
    compte("adherent", "studio-123"); moi = { id: "m-bob" }
    const { res } = await annuler({ sessionId: "sess1", memberId: "m-alice" })
    expect(res.status).toBe(403)
    expect(annulee()).toBe(false)
  })

  it("adherent sans fiche membre dans son studio", async () => {
    compte("adherent", "studio-123"); moi = null
    expect((await annuler({ sessionId: "sess1", memberId: "m-alice" })).res.status).toBe(403)
    expect(annulee()).toBe(false)
  })

  it("reservation inexistante : 403 et MEME message qu'un refus (on ne revele pas l'existence)", async () => {
    compte("admin", "autre-studio")
    const refus = (await annuler({ bookingId: "bk1" })).json.error
    compte("admin", "studio-123"); resa = null
    const { res, json } = await annuler({ bookingId: "inexistant" })
    expect(res.status).toBe(403)
    expect(json.error).toBe(refus)
  })
})

describe("cas legitimes", () => {
  it("l'adherent annule SA reservation", async () => {
    compte("adherent", "studio-123"); moi = { id: "m-alice" }
    const { res } = await annuler({ sessionId: "sess1", memberId: "m-alice" })
    expect(res.status).toBe(200)
    expect(majBookings).toContainEqual({ status: "cancelled", cancelled_by: "membre" })
  })

  it("l'admin du studio annule une reservation de son studio", async () => {
    compte("admin", "studio-123")
    const { res } = await annuler({ bookingId: "bk1" })
    expect(res.status).toBe(200)
    expect(majBookings).toContainEqual({ status: "cancelled", cancelled_by: "admin" })
  })

  it("le coach du studio aussi", async () => {
    compte("coach", "studio-123")
    expect((await annuler({ bookingId: "bk1" })).res.status).toBe(200)
    expect(annulee()).toBe(true)
  })

  it("le super-admin, quel que soit le studio", async () => {
    compte("superadmin", "autre-studio")
    expect((await annuler({ bookingId: "bk1" })).res.status).toBe(200)
    expect(annulee()).toBe(true)
  })

  it("deja annulee : ok sans nouvelle ecriture (apres controle d'acces)", async () => {
    compte("admin", "studio-123"); resa = { ...RESA, status: "cancelled" }
    const { json } = await annuler({ bookingId: "bk1" })
    expect(json.already).toBe(true)
    expect(annulee()).toBe(false)
  })
})
