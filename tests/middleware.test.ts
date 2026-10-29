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

/**
 * Les cookies rafraichis doivent traverser une redirection SANS PERDRE leurs
 * attributs.
 *
 * `setAll` (middleware.ts) pose le domaine `.fydelys.fr` et les attributs
 * fournis par supabase-ssr (duree de vie, httpOnly, sameSite...). Mais
 * `safeRedirect` ne recopiait que `name` et `value` : a chaque redirection, le
 * cookie de session ressortait
 *   - SANS `domain`  -> host-only, donc plus partage entre sous-domaines
 *     (ce que le commentaire de `setAll` reclame explicitement) ;
 *   - SANS expiration -> cookie de SESSION, qui meurt a la fermeture du
 *     navigateur.
 *
 * Et ca mordait sur le chemin QUOTIDIEN d'une adherente : aller sur
 * `<studio>.fydelys.fr/` en etant connectee declenche la redirection vers
 * `/dashboard` a travers `safeRedirect`. Si un rafraichissement de jeton
 * tombait pendant cette requete, la session devenait non persistante.
 *
 * Symptome vu le 29/10/2026 : des adherentes deconnectees sans raison, qui
 * retombaient sur la landing commerciale au lieu de leur espace.
 */
describe("Middleware — cookies et redirections", () => {
  it("une redirection PRESERVE le domaine et la duree de vie des cookies", async () => {
    const { createServerClient } = await import("@supabase/ssr")

    // Simule un rafraichissement de jeton : supabase-ssr appelle `setAll` avec
    // les attributs du cookie. C'est le cas que safeRedirect dépouillait.
    vi.mocked(createServerClient).mockImplementationOnce(((_url: any, _key: any, config: any) => {
      config.cookies.setAll([
        {
          name: "sb-test-auth-token",
          value: "jeton-rafraichi",
          options: { maxAge: 3600, httpOnly: true, sameSite: "lax", path: "/", secure: true },
        },
      ])
      return mockDb
    }) as any)

    const { middleware } = await import("@/middleware")
    const req = createMockRequest("https://yogaplus.fydelys.fr/planning", {
      headers: { host: "yogaplus.fydelys.fr" },
    })
    const res = await middleware(req)

    // On est bien sur le chemin de redirection (session absente, page protegee).
    expect(res.headers.get("location")).toBeTruthy()

    const c = res.cookies.get("sb-test-auth-token")
    expect(c?.value).toBe("jeton-rafraichi")
    expect(c?.domain).toBe(".fydelys.fr")
    expect(c?.maxAge).toBe(3600)
  })
})
