import { vi } from "vitest"

// ── Mock env vars ──────────────────────────────────────────────────
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co"
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key"
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key"
process.env.STRIPE_SECRET_KEY = "sk_test_xxx"
process.env.SENDGRID_API_KEY = ""

// ── Supabase mock builder ──────────────────────────────────────────
export function createMockSupabaseClient(overrides: Record<string, any> = {}) {
  const chain: any = {}
  const methods = ["select", "insert", "update", "delete", "upsert", "eq", "neq", "or", "not", "gte", "lte", "order", "limit", "single", "maybeSingle", "is"]

  methods.forEach(m => {
    chain[m] = vi.fn().mockReturnValue(chain)
  })

  // Default returns
  chain.single.mockResolvedValue({ data: null, error: null })
  chain.maybeSingle.mockResolvedValue({ data: null, error: null })
  chain.select.mockReturnValue(chain)
  chain.insert.mockReturnValue(chain)
  chain.update.mockReturnValue(chain)
  chain.delete.mockReturnValue(chain)
  chain.upsert.mockReturnValue(chain)

  const client = {
    from: vi.fn().mockReturnValue(chain),
    rpc: vi.fn().mockResolvedValue({ error: null }),
    auth: {
      admin: {
        getUserById: vi.fn().mockResolvedValue({ data: { user: null } }),
        deleteUser: vi.fn().mockResolvedValue({ error: null }),
        listUsers: vi.fn().mockResolvedValue({ data: { users: [] } }),
        createUser: vi.fn().mockResolvedValue({ data: { user: { id: "test-uid" } } }),
      },
      verifyOtp: vi.fn().mockResolvedValue({ data: { user: { id: "test-uid", email: "test@test.com" } }, error: null }),
      setSession: vi.fn().mockResolvedValue({ data: { user: { id: "test-uid", email: "test@test.com" } }, error: null }),
      exchangeCodeForSession: vi.fn().mockResolvedValue({ data: { user: { id: "test-uid", email: "test@test.com" }, session: {} }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "test-uid", email: "test@test.com" } } }),
    },
    _chain: chain,
    ...overrides,
  }

  return client
}

// ── Mock @/lib/supabase-server ─────────────────────────────────────
const mockDb = createMockSupabaseClient()

vi.mock("@/lib/supabase-server", () => ({
  createServiceSupabase: vi.fn(() => mockDb),
  createServerSupabase: vi.fn(() => mockDb),
  createClient: vi.fn(() => mockDb),
}))

// ── Mock @supabase/ssr ────────────────────────────────────────────
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => mockDb),
}))

// ── Mock next/headers ─────────────────────────────────────────────
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    getAll: () => [],
    set: vi.fn(),
  })),
}))

// ── Export for test access ─────────────────────────────────────────
export { mockDb }
