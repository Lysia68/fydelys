import { describe, it, expect } from "vitest"

// ── Plan feature validation ───────────────────────────────────────────
const PLANS = {
  essentiel: { maxMembers: 50, maxCoaches: 1, maxDisciplines: 1, payments: false },
  standard:  { maxMembers: 100, maxCoaches: 3, maxDisciplines: 3, payments: true },
  pro:       { maxMembers: null, maxCoaches: null, maxDisciplines: null, payments: true },
}

function canUsePayments(planSlug: string): boolean {
  const plan = PLANS[planSlug as keyof typeof PLANS]
  return plan?.payments ?? false
}

function isWithinLimits(planSlug: string, counts: { members: number; coaches: number; disciplines: number }): { ok: boolean; errors: string[] } {
  const plan = PLANS[planSlug as keyof typeof PLANS]
  if (!plan) return { ok: false, errors: ["Plan inconnu"] }
  const errors: string[] = []
  if (plan.maxMembers !== null && counts.members > plan.maxMembers) errors.push(`Max ${plan.maxMembers} adhérents`)
  if (plan.maxCoaches !== null && counts.coaches > plan.maxCoaches) errors.push(`Max ${plan.maxCoaches} coachs`)
  if (plan.maxDisciplines !== null && counts.disciplines > plan.maxDisciplines) errors.push(`Max ${plan.maxDisciplines} disciplines`)
  return { ok: errors.length === 0, errors }
}

describe("Plan restrictions", () => {
  it("Essentiel cannot use payments", () => {
    expect(canUsePayments("essentiel")).toBe(false)
  })

  it("Standard can use payments", () => {
    expect(canUsePayments("standard")).toBe(true)
  })

  it("Pro can use payments", () => {
    expect(canUsePayments("pro")).toBe(true)
  })

  it("Essentiel respects member limits", () => {
    expect(isWithinLimits("essentiel", { members: 50, coaches: 1, disciplines: 1 }).ok).toBe(true)
    expect(isWithinLimits("essentiel", { members: 51, coaches: 1, disciplines: 1 }).ok).toBe(false)
  })

  it("Essentiel respects discipline limits", () => {
    expect(isWithinLimits("essentiel", { members: 10, coaches: 1, disciplines: 1 }).ok).toBe(true)
    expect(isWithinLimits("essentiel", { members: 10, coaches: 1, disciplines: 2 }).ok).toBe(false)
  })

  it("Pro has no limits", () => {
    expect(isWithinLimits("pro", { members: 9999, coaches: 100, disciplines: 50 }).ok).toBe(true)
  })
})

// ── Payment mode validation ──────────────────────────────────────────
const VALID_PAYMENT_MODES = ["none", "connect", "direct"]

function isValidPaymentMode(mode: string): boolean {
  return VALID_PAYMENT_MODES.includes(mode)
}

describe("Payment mode", () => {
  it("accepts valid modes", () => {
    expect(isValidPaymentMode("none")).toBe(true)
    expect(isValidPaymentMode("connect")).toBe(true)
    expect(isValidPaymentMode("direct")).toBe(true)
  })

  it("rejects invalid modes", () => {
    expect(isValidPaymentMode("stripe")).toBe(false)
    expect(isValidPaymentMode("")).toBe(false)
    expect(isValidPaymentMode("disabled")).toBe(false)
  })
})

// ── Slug validation ─────────────────────────────────────────────────
function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+$/.test(slug)
}

describe("Slug validation", () => {
  it("accepts valid slugs", () => {
    expect(isValidSlug("yogaplus")).toBe(true)
    expect(isValidSlug("studio123")).toBe(true)
    expect(isValidSlug("flow")).toBe(true)
  })

  it("rejects invalid slugs", () => {
    expect(isValidSlug("Yoga-Plus")).toBe(false)
    expect(isValidSlug("yoga plus")).toBe(false)
    expect(isValidSlug("yoga_plus")).toBe(false)
    expect(isValidSlug("")).toBe(false)
  })
})

// ── Discipline selection validation (onboarding) ────────────────────
function validateDisciplineSelection(selected: string[]): { ok: boolean; error?: string } {
  if (selected.length === 0) return { ok: false, error: "Min 1 discipline" }
  if (selected.length > 2) return { ok: false, error: "Max 2 disciplines" }
  return { ok: true }
}

describe("Discipline selection (onboarding)", () => {
  it("accepts 1 discipline", () => {
    expect(validateDisciplineSelection(["Yoga Vinyasa"]).ok).toBe(true)
  })

  it("accepts 2 disciplines", () => {
    expect(validateDisciplineSelection(["Yoga Vinyasa", "Pilates Mat"]).ok).toBe(true)
  })

  it("rejects 0 disciplines", () => {
    expect(validateDisciplineSelection([]).ok).toBe(false)
  })

  it("rejects 3+ disciplines", () => {
    expect(validateDisciplineSelection(["A", "B", "C"]).ok).toBe(false)
  })
})
