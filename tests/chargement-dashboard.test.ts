import { describe, it, expect, vi } from "vitest"
import { chargerDonneesDashboard, toutesLesPages, PAGE } from "@/lib/chargement-dashboard"

// Tableau de bord : plus de 1 000 lignes par table → toutes lues (PostgREST
// tronque a 1 000 SANS erreur). Base simulee : chaque table repond page par
// page selon range(de, a), comme PostgREST.

function base(tailles: Record<string, number>) {
  const appels: Record<string, { eq: any[]; order: any[]; in: any[] }> = {}
  const sb = {
    from: (table: string) => {
      const trace = (appels[table] ||= { eq: [], order: [], in: [] })
      const total = tailles[table] ?? 0
      const c: any = {}
      c.select = () => c
      c.eq = (...a: any[]) => { trace.eq.push(a); return c }
      c.is = () => c
      c.in = (...a: any[]) => { trace.in.push(a); return c }
      c.order = (...a: any[]) => { trace.order.push(a); return c }
      c.range = async (de: number, a: number) => {
        const n = Math.max(0, Math.min(total, a + 1) - de)
        return { data: Array.from({ length: n }, (_, i) => ({ id: `${table}-${de + i}`, session_id: `s-${de + i}` })), error: null }
      }
      return c
    },
  }
  return { sb, appels }
}

describe("chargement du tableau de bord, pagine", () => {
  it("plus de 1 000 lignes par table : TOUT est charge", async () => {
    const { sb } = base({ sessions: 2500, bookings: 3001, members: 1000, member_payments: 1001 })
    const d = await chargerDonneesDashboard(sb, "studio-123")
    expect(d.sessions).toHaveLength(2500)
    expect(d.bookings).toHaveLength(3001)
    expect(d.members).toHaveLength(1000)   // exactement une page pleine : une page vide de plus, rien de perdu
    expect(d.payments).toHaveLength(1001)
    expect(new Set(d.bookings.map((b: any) => b.id)).size).toBe(3001) // pas de doublon entre pages
  })

  it("tri sur cle unique (id) et filtre studio ; reservations par jointure, jamais par .in(ids)", async () => {
    const { sb, appels } = base({ sessions: 10, bookings: 10, members: 10, member_payments: 10 })
    await chargerDonneesDashboard(sb, "studio-123")
    for (const t of ["sessions", "bookings", "members", "member_payments"]) expect(appels[t].order[0]).toEqual(["id"])
    expect(appels.bookings.eq).toContainEqual(["sessions.studio_id", "studio-123"])
    expect(appels.bookings.in).toEqual([])
  })

  it("une page en erreur : erreur levee, rien de partiel", async () => {
    let n = 0
    const lire = vi.fn(async () => (++n === 2 ? { data: null, error: { message: "timeout" } } : { data: Array(PAGE).fill({}), error: null }))
    await expect(toutesLesPages(lire)).rejects.toThrow("timeout")
  })
})
