import { describe, it, expect } from "vitest"
import { membresInactifs } from "@/lib/membres-inactifs"

const AUJ = "2026-11-15"
const m = (id: string, joined_at: string | null = "2024-01-01") =>
  ({ id, first_name: id.toUpperCase(), last_name: "X", email: `${id}@t.fr`, joined_at })

describe("membres sans reservation depuis plus de 30 jours", () => {
  it("nombre EXACT de jours depuis la DERNIERE reservation", () => {
    const r = membresInactifs([m("a")], [
      { member_id: "a", session_date: "2026-01-10" },
      { member_id: "a", session_date: "2026-03-02" }, // la plus recente
      { member_id: "a", session_date: "2025-12-01" },
    ], AUJ)
    expect(r[0]).toMatchObject({ derniereReservation: "2026-03-02", jours: 258, niveau: "orange" })
  })

  it("30 jours ou moins : actif ; une reservation a venir : actif", () => {
    const r = membresInactifs([m("a"), m("b"), m("c")], [
      { member_id: "a", session_date: "2026-10-16" }, // 30 j
      { member_id: "b", session_date: "2026-10-15" }, // 31 j
      { member_id: "c", session_date: "2026-12-01" }, // a venir
    ], AUJ)
    expect(r.map(x => x.id)).toEqual(["b"])
    expect(r[0].jours).toBe(31)
  })

  it("orange jusqu'a 365 jours, rouge au-dela", () => {
    const r = membresInactifs([m("a"), m("b")], [
      { member_id: "a", session_date: "2025-11-15" }, // 365 j
      { member_id: "b", session_date: "2025-11-14" }, // 366 j
    ], AUJ)
    expect(r.find(x => x.id === "a")).toMatchObject({ jours: 365, niveau: "orange" })
    expect(r.find(x => x.id === "b")).toMatchObject({ jours: 366, niveau: "rouge" })
  })

  it("jamais reserve : couleur selon l'anciennete ; inscrit depuis <= 30 j : pas inactif", () => {
    const r = membresInactifs([m("vieux", "2024-06-01"), m("recent", "2026-05-01"), m("nouveau", "2026-11-01"), m("inconnu", null)], [], AUJ)
    expect(r.find(x => x.id === "vieux")).toMatchObject({ jours: null, niveau: "rouge" })
    expect(r.find(x => x.id === "recent")).toMatchObject({ jours: null, niveau: "orange" })
    expect(r.find(x => x.id === "nouveau")).toBeUndefined()
    expect(r.find(x => x.id === "inconnu")).toMatchObject({ jours: null, inscritDepuis: null, niveau: "orange" })
  })

  it("tri : les plus anciens d'abord", () => {
    const r = membresInactifs([m("a"), m("b"), m("c")], [
      { member_id: "a", session_date: "2026-09-01" },
      { member_id: "b", session_date: "2024-09-01" },
      { member_id: "c", session_date: "2025-09-01" },
    ], AUJ)
    expect(r.map(x => x.id)).toEqual(["b", "c", "a"])
  })
})
