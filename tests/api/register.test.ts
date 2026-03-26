import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockRequest } from "../helpers"
import { mockDb } from "../setup"

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  mockDb._chain.maybeSingle.mockResolvedValue({ data: null, error: null })
  mockDb._chain.single.mockResolvedValue({ data: null, error: null })
  mockDb.from.mockReturnValue(mockDb._chain)
  mockDb._chain.upsert.mockResolvedValue({ error: null })
})

describe("POST /api/register", () => {
  it("rejects missing required fields", async () => {
    const { POST } = await import("@/app/api/register/route")
    const req = createMockRequest("https://fydelys.fr/api/register", {
      method: "POST",
      body: { email: "", slug: "", studioName: "" },
    })
    const res = await POST(req)
    const json = await res.json()
    expect(res.status).toBe(400)
    expect(json.error).toBe("Champs obligatoires manquants")
  })

  it("rejects duplicate slug", async () => {
    mockDb._chain.maybeSingle.mockResolvedValueOnce({ data: { id: "existing-id" }, error: null })

    const { POST } = await import("@/app/api/register/route")
    const req = createMockRequest("https://fydelys.fr/api/register", {
      method: "POST",
      body: { email: "test@test.com", slug: "taken-slug", studioName: "Test Studio" },
    })
    const res = await POST(req)
    expect(res.status).toBe(409)
  })

  it("stores disciplines in pending_registrations data", async () => {
    const { POST } = await import("@/app/api/register/route")
    const disciplines = [
      { name: "Yoga Vinyasa", icon: "🧘" },
      { name: "Pilates Mat", icon: "⚡" },
    ]
    const req = createMockRequest("https://fydelys.fr/api/register", {
      method: "POST",
      body: {
        email: "new@studio.com", slug: "newstudio", studioName: "New Studio",
        city: "Paris", type: "Yoga", firstName: "Marie", lastName: "Laurent",
        phone: "0600000000", disciplines,
      },
    })
    const res = await POST(req)
    const json = await res.json()
    expect(json.ok).toBe(true)
    const upsertCall = mockDb._chain.upsert.mock.calls[0]
    expect(upsertCall).toBeDefined()
    if (upsertCall) {
      expect(upsertCall[0].data.disciplines).toEqual(disciplines)
    }
  })
})
