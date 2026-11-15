import { describe, it, expect } from "vitest"
import { membresInactifs } from "@/lib/membres-inactifs"

// Definition (15/11/2026) : membres AVEC DU CREDIT, sans PRESENCE POINTEE
// depuis plus d'un an ; jamais venus : inclus s'ils sont inscrits depuis plus
// d'un an. Les presences passees ici sont deja filtrees (attended = true).

const AUJ = "2026-11-15"
const m = (id: string, credits = 3, joined_at: string | null = "2024-01-01") =>
  ({ id, first_name: id.toUpperCase(), last_name: "X", email: `${id}@t.fr`, joined_at, credits })

describe("membres avec credit, pas venus depuis plus d'un an", () => {
  it("nombre EXACT de jours depuis la DERNIERE presence, credits affiches", () => {
    const r = membresInactifs([m("a", 4)], [
      { member_id: "a", session_date: "2024-01-10" },
      { member_id: "a", session_date: "2025-03-02" }, // la plus recente
      { member_id: "a", session_date: "2023-12-01" },
    ], AUJ)
    expect(r[0]).toMatchObject({ dernierePresence: "2025-03-02", jours: 623, credits: 4 })
  })

  it("sans credit (0 ou null) : jamais dans la liste, meme absent depuis des annees", () => {
    const r = membresInactifs([{ ...m("a"), credits: 0 }, { ...m("b"), credits: null }], [
      { member_id: "a", session_date: "2020-01-01" },
    ], AUJ)
    expect(r).toEqual([])
  })

  it("seuil : 365 jours exclu, 366 jours inclus", () => {
    const r = membresInactifs([m("a"), m("b")], [
      { member_id: "a", session_date: "2025-11-15" }, // 365 j
      { member_id: "b", session_date: "2025-11-14" }, // 366 j
    ], AUJ)
    expect(r.map(x => x.id)).toEqual(["b"])
    expect(r[0].jours).toBe(366)
  })

  it("jamais venu : inclus si inscrit depuis plus d'un an ; recent ou date inconnue : exclu", () => {
    const r = membresInactifs([m("vieux", 2, "2024-06-01"), m("recent", 2, "2026-05-01"), m("inconnu", 2, null)], [], AUJ)
    expect(r.map(x => x.id)).toEqual(["vieux"])
    expect(r[0]).toMatchObject({ jours: null, dernierePresence: null })
  })

  it("tri : les plus anciens d'abord", () => {
    const r = membresInactifs([m("a"), m("b"), m("c")], [
      { member_id: "a", session_date: "2025-09-01" },
      { member_id: "b", session_date: "2022-09-01" },
      { member_id: "c", session_date: "2024-09-01" },
    ], AUJ)
    expect(r.map(x => x.id)).toEqual(["b", "c", "a"])
  })
})
