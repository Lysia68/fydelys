import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockRequest } from "../helpers"

// Mock @supabase/supabase-js createClient directly since this route creates its own
const mockChain: any = {}
const methods = ["select", "eq", "maybeSingle", "rpc", "from"]
methods.forEach(m => { mockChain[m] = vi.fn().mockReturnValue(mockChain) })
mockChain.maybeSingle.mockResolvedValue({ data: null, error: null })
mockChain.rpc.mockResolvedValue({ data: false })

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ from: vi.fn().mockReturnValue(mockChain), rpc: mockChain.rpc })),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockChain.maybeSingle.mockResolvedValue({ data: null, error: null })
  mockChain.rpc.mockResolvedValue({ data: false })
  methods.forEach(m => { if (m !== "maybeSingle" && m !== "rpc") mockChain[m] = vi.fn().mockReturnValue(mockChain) })
})

describe("GET /api/check-availability", () => {
  it("returns both available when nothing exists", async () => {
    const { GET } = await import("@/app/api/check-availability/route")
    const req = createMockRequest("https://fydelys.fr/api/check-availability?slug=newslug&email=new@test.com")
    const res = await GET(req)
    const json = await res.json()
    expect(json.slugTaken).toBe(false)
    expect(json.emailTaken).toBe(false)
  })
})
