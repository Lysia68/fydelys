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
    // Existing booking found
    mockDb._chain.maybeSingle.mockResolvedValueOnce({
      data: { id: "existing-booking" },
      error: null,
    })

    const { POST } = await import("@/app/api/bookings/route")
    const req = createMockRequest("https://fydelys.fr/api/bookings", {
      method: "POST",
      body: { sessionId: "sess-1", memberId: "m-1", studioId: "s-1" },
    })
    const res = await POST(req)
    const json = await res.json()
    expect(json.already).toBe(true)
  })
})
