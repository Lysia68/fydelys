import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockRequest } from "./helpers"
import { mockDb } from "./setup"

beforeEach(() => {
  vi.clearAllMocks()
  mockDb.from.mockReturnValue(mockDb._chain)
  mockDb._chain.single.mockResolvedValue({ data: null, error: null })
  mockDb.auth.getUser.mockResolvedValue({ data: { user: null } })
})

describe("Middleware", () => {
  it("redirects unauthenticated users on protected routes", async () => {
    mockDb.auth.getUser.mockResolvedValueOnce({ data: { user: null } })

    const { middleware } = await import("@/middleware")
    const req = createMockRequest("https://yogaplus.fydelys.fr/planning", {
      headers: { host: "yogaplus.fydelys.fr" },
    })
    const res = await middleware(req)
    const location = res.headers.get("location") || ""
    expect(location).toContain("/")
  })

  it("intercepts code param on root and redirects to callback with slug", async () => {
    const { middleware } = await import("@/middleware")
    const req = createMockRequest("https://fydelys.fr/?code=test-code&register=1&slug=newstudio", {
      headers: { host: "fydelys.fr" },
    })
    const res = await middleware(req)
    const location = res.headers.get("location") || ""
    expect(location).toContain("/auth/callback")
    expect(location).toContain("code=test-code")
    expect(location).toContain("register=1")
    expect(location).toContain("slug=newstudio")
  })

  it("allows public pages without auth", async () => {
    const { middleware } = await import("@/middleware")
    const req = createMockRequest("https://fydelys.fr/login", {
      headers: { host: "fydelys.fr" },
    })
    const res = await middleware(req)
    expect(res.status).toBe(200)
  })
})
