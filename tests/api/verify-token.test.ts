import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockRequest } from "../helpers"
import { mockDb } from "../setup"

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  mockDb.from.mockReturnValue(mockDb._chain)
  mockDb._chain.single.mockResolvedValue({ data: null, error: null })
  mockDb._chain.maybeSingle.mockResolvedValue({ data: null, error: null })
  mockDb._chain.eq.mockReturnValue(mockDb._chain)
  mockDb._chain.select.mockReturnValue(mockDb._chain)
  mockDb._chain.insert.mockReturnValue(mockDb._chain)
  mockDb._chain.upsert.mockReturnValue(mockDb._chain)
  mockDb._chain.delete.mockReturnValue(mockDb._chain)
  mockDb._chain.not.mockReturnValue(mockDb._chain)
  // Make insert().then() work
  mockDb._chain.insert.mockReturnValue({
    ...mockDb._chain,
    then: (fn: any) => Promise.resolve({ error: null }).then(fn),
    select: vi.fn().mockReturnValue(mockDb._chain),
  })

  mockDb.auth.verifyOtp.mockResolvedValue({
    data: { user: { id: "user-1", email: "test@studio.com", user_metadata: {} } },
    error: null,
  })
})

describe("POST /api/verify-token", () => {
  it("rejects missing token", async () => {
    const { POST } = await import("@/app/api/verify-token/route")
    const req = createMockRequest("https://fydelys.fr/api/verify-token", {
      method: "POST",
      body: {},
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("does not treat tenant login as registration", async () => {
    mockDb._chain.maybeSingle.mockResolvedValue({ data: null, error: null })
    mockDb._chain.single.mockResolvedValueOnce({
      data: { id: "existing-studio", slug: "existingstudio" },
      error: null,
    })

    const { POST } = await import("@/app/api/verify-token/route")
    const req = createMockRequest("https://fydelys.fr/api/verify-token", {
      method: "POST",
      body: {
        tokenHash: "test-hash",
        type: "magiclink",
        tenantSlug: "existingstudio",
        isRegister: false,
      },
    })
    const res = await POST(req)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })
})
