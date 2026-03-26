import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockRequest } from "../helpers"
import { mockDb } from "../setup"

beforeEach(() => {
  vi.clearAllMocks()
  mockDb._chain.single.mockResolvedValue({ data: null, error: null })
  mockDb._chain.maybeSingle.mockResolvedValue({ data: null, error: null })
  mockDb.from.mockReturnValue(mockDb._chain)

  // Mock global fetch for magic link call
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })
})

describe("GET /api/members", () => {
  it("rejects missing studioId", async () => {
    const { GET } = await import("@/app/api/members/route")
    const req = createMockRequest("https://fydelys.fr/api/members")
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it("returns members for valid studioId", async () => {
    const members = [
      { id: "m1", first_name: "Marie", last_name: "Test", email: "m@test.com" },
    ]
    mockDb._chain.order.mockResolvedValueOnce({ data: members, error: null })

    const { GET } = await import("@/app/api/members/route")
    const req = createMockRequest("https://fydelys.fr/api/members?studioId=studio-123")
    const res = await GET(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.members).toBeDefined()
  })

  it("supports search parameter", async () => {
    mockDb._chain.limit.mockResolvedValueOnce({ data: [], error: null })

    const { GET } = await import("@/app/api/members/route")
    const req = createMockRequest("https://fydelys.fr/api/members?studioId=studio-123&search=Marie")
    const res = await GET(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.members).toBeDefined()
  })
})

describe("POST /api/members", () => {
  it("rejects missing studioId", async () => {
    const { POST } = await import("@/app/api/members/route")
    const req = createMockRequest("https://fydelys.fr/api/members", {
      method: "POST",
      body: { first_name: "Test", last_name: "User", email: "t@t.com" },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("rejects duplicate email in same studio", async () => {
    mockDb._chain.single.mockResolvedValueOnce({ data: { id: "existing" }, error: null })

    const { POST } = await import("@/app/api/members/route")
    const req = createMockRequest("https://fydelys.fr/api/members", {
      method: "POST",
      body: { studioId: "s1", first_name: "Test", last_name: "User", email: "existing@test.com" },
    })
    const res = await POST(req)
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error).toBe("EMAIL_EXISTS")
  })

  it("creates member and sends invitation", async () => {
    // No existing member
    mockDb._chain.single.mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } })
    // Insert succeeds
    mockDb._chain.single.mockResolvedValueOnce({ data: { id: "new-member-id" }, error: null })
    // Studio lookup for magic link
    mockDb._chain.single.mockResolvedValueOnce({ data: { slug: "teststudio", name: "Test Studio" }, error: null })

    const { POST } = await import("@/app/api/members/route")
    const req = createMockRequest("https://teststudio.fydelys.fr/api/members", {
      method: "POST",
      body: { studioId: "s1", first_name: "New", last_name: "Member", email: "new@member.com" },
    })
    const res = await POST(req)
    const json = await res.json()
    expect(json.id).toBe("new-member-id")
  })
})

describe("PATCH /api/members", () => {
  it("rejects missing id", async () => {
    const { PATCH } = await import("@/app/api/members/route")
    const req = createMockRequest("https://fydelys.fr/api/members", {
      method: "PATCH",
      body: { first_name: "Updated" },
    })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
  })

  it("creates member_payments when subscription is assigned", async () => {
    // Current member (no subscription) — 1st .single()
    mockDb._chain.single.mockResolvedValueOnce({
      data: { subscription_id: null, studio_id: "s1", first_name: "Test", last_name: "User" },
      error: null,
    })
    // Subscription lookup — 2nd .single()
    mockDb._chain.single.mockResolvedValueOnce({
      data: { name: "Mensuel illimité", price: 89, period: "mois", credits: null },
      error: null,
    })
    // .eq() calls: 1st (member select) → chain, 2nd (update) → resolves, 3rd (sub select) → chain
    mockDb._chain.eq
      .mockReturnValueOnce(mockDb._chain)
      .mockResolvedValueOnce({ error: null })
      .mockReturnValueOnce(mockDb._chain)
    // Insert payment
    mockDb._chain.insert.mockReturnValueOnce({ error: null })

    const { PATCH } = await import("@/app/api/members/route")
    const req = createMockRequest("https://fydelys.fr/api/members", {
      method: "PATCH",
      body: { id: "member-123", subscription_id: "sub-456" },
    })
    const res = await PATCH(req)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })
})
