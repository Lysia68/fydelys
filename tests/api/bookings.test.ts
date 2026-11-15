import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockRequest } from "../helpers"
import { mockDb } from "../setup"

beforeEach(() => {
  vi.clearAllMocks()
  mockDb.from.mockReturnValue(mockDb._chain)
  mockDb._chain.single.mockResolvedValue({ data: null, error: null })
  mockDb._chain.maybeSingle.mockResolvedValue({ data: null, error: null })
  mockDb._chain.eq.mockReturnValue(mockDb._chain)
  mockDb._chain.neq.mockReturnValue(mockDb._chain)
})

describe("POST /api/bookings", () => {
  it("rejects missing fields", async () => {
    const { POST } = await import("@/app/api/bookings/route")
    const req = createMockRequest("https://fydelys.fr/api/bookings", {
      method: "POST",
      body: {},
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("detects already booked member", async () => {
    // Depuis la garde d'acces (15/11/2026) : la seance et le membre doivent
    // appartenir au studio de l'admin simule (studio-123, tests/setup.ts).
    mockDb._chain.maybeSingle
      .mockResolvedValueOnce({ data: { studio_id: "studio-123" }, error: null }) // seance
      .mockResolvedValueOnce({ data: { studio_id: "studio-123" }, error: null }) // membre
      .mockResolvedValueOnce({ data: { id: "existing-booking" }, error: null })  // reservation existante

    const { POST } = await import("@/app/api/bookings/route")
    const req = createMockRequest("https://fydelys.fr/api/bookings", {
      method: "POST",
      body: { sessionId: "sess-1", memberId: "m-1", studioId: "studio-123" },
    })
    const res = await POST(req)
    const json = await res.json()
    expect(json.already).toBe(true)
  })
})
