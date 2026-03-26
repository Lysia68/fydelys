import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockRequest } from "../helpers"

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe("PATCH /api/sa/update-tenant", () => {
  it("rejects missing studioId", async () => {
    const { PATCH } = await import("@/app/api/sa/update-tenant/route")
    const req = createMockRequest("https://fydelys.fr/api/sa/update-tenant", {
      method: "PATCH",
      body: {},
    })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
  })
})

describe("DELETE /api/sa/update-tenant", () => {
  it("rejects missing studioId", async () => {
    const { DELETE } = await import("@/app/api/sa/update-tenant/route")
    const req = createMockRequest("https://fydelys.fr/api/sa/update-tenant", {
      method: "DELETE",
      body: {},
    })
    const res = await DELETE(req)
    expect(res.status).toBe(400)
  })
})