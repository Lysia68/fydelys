import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createMockRequest } from "./helpers"
import { mockDb } from "./setup"
import { cronAutorise } from "@/lib/cron-auth"

// ── Crons : secret absent = REFUS ─────────────────────────────────────────
// Avant le 15/11/2026, sans CRON_SECRET, « Authorization: Bearer undefined »
// ouvrait birthdays, cleanup et sms-reset, et reminders ne verifiait rien.

const avec = (h?: string) => createMockRequest("https://fydelys.fr/api/cron/x", { headers: h ? { authorization: h } : {} })
let secretAvant: string | undefined
beforeEach(() => { secretAvant = process.env.CRON_SECRET; vi.clearAllMocks(); vi.spyOn(console, "error").mockImplementation(() => {}) })
afterEach(() => {
  if (secretAvant === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = secretAvant
  vi.restoreAllMocks()
})

describe("cronAutorise", () => {
  it("secret ABSENT : refuse tout, y compris « Bearer undefined » et sans en-tete", () => {
    delete process.env.CRON_SECRET
    expect(cronAutorise(avec("Bearer undefined"))).toBe(false)
    expect(cronAutorise(avec())).toBe(false)
    expect(cronAutorise(avec("Bearer "))).toBe(false)
  })
  it("secret pose : seul le bon en-tete passe", () => {
    process.env.CRON_SECRET = "s3cr3t"
    expect(cronAutorise(avec("Bearer s3cr3t"))).toBe(true)
    expect(cronAutorise(avec("Bearer s3cr3x"))).toBe(false)
    expect(cronAutorise(avec("Bearer s3cr3t-plus-long"))).toBe(false)
    expect(cronAutorise(avec())).toBe(false)
  })
})

describe("routes /api/cron/* sans CRON_SECRET : 401, aucune lecture", () => {
  for (const r of ["birthdays", "cleanup", "reminders", "sms-reset"]) {
    it(`/api/cron/${r}`, async () => {
      delete process.env.CRON_SECRET
      const { GET } = await import(`@/app/api/cron/${r}/route`)
      const res = await GET(avec("Bearer undefined"))
      expect(res.status).toBe(401)
      expect(mockDb.from).not.toHaveBeenCalled()
    })
  }
})
