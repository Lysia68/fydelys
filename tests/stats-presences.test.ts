import { describe, it, expect } from "vitest"
import {
  aujourdhuiParis, semaineIso, semainePrecedente, semainesDuMois, semainesTerminees, agreger,
  libelleSemaine, infobulleSemaine,
} from "@/lib/stats-presences"

describe("semaines ISO", () => {
  it("numero ISO, y compris autour du 1er janvier", () => {
    expect(semaineIso("2026-11-09")).toEqual({ numero: 46, anneeIso: 2026 })
    expect(semaineIso("2026-11-15")).toEqual({ numero: 46, anneeIso: 2026 }) // dimanche
    expect(semaineIso("2027-01-01")).toEqual({ numero: 53, anneeIso: 2026 }) // vendredi : semaine 53 de 2026
    expect(semaineIso("2027-01-04")).toEqual({ numero: 1, anneeIso: 2027 })
    expect(semaineIso("2026-01-01")).toEqual({ numero: 1, anneeIso: 2026 })  // jeudi
  })

  it("semaine precedente = lundi → dimanche entiers", () => {
    // dimanche 15/11/2026 (S46) → S45, du 02 au 08/11
    expect(semainePrecedente("2026-11-15")).toMatchObject({ numero: 45, lundi: "2026-11-02", dimanche: "2026-11-08", debut: "2026-11-02", fin: "2026-11-08", tronquee: false })
    // lundi 16/11 (S47) → S46
    expect(semainePrecedente("2026-11-16")).toMatchObject({ numero: 46, lundi: "2026-11-09", dimanche: "2026-11-15" })
    // a cheval sur l'annee : lundi 04/01/2027 → S53 de 2026
    expect(semainePrecedente("2027-01-04")).toMatchObject({ numero: 53, anneeIso: 2026, lundi: "2026-12-28", dimanche: "2027-01-03" })
  })

  it("la date du jour est celle de PARIS, pas celle du serveur (UTC)", () => {
    // 15/11/2026 23:30 UTC = lundi 16/11 00:30 a Paris
    expect(aujourdhuiParis(new Date("2026-11-15T23:30:00Z"))).toBe("2026-11-16")
    // 29/03/2026 00:30 UTC (passage a l'heure d'ete) = 01:30 a Paris, meme jour
    expect(aujourdhuiParis(new Date("2026-03-29T00:30:00Z"))).toBe("2026-03-29")
  })
})

describe("semaines du mois", () => {
  it("novembre 2026 : 6 semaines, les deux extremes bornees au mois", () => {
    const s = semainesDuMois(2026, 11)
    expect(s.map(x => x.numero)).toEqual([44, 45, 46, 47, 48, 49])
    expect(s[0]).toMatchObject({ lundi: "2026-10-26", debut: "2026-11-01", fin: "2026-11-01", tronquee: true })
    expect(s[2]).toMatchObject({ debut: "2026-11-09", fin: "2026-11-15", tronquee: false })
    expect(s[5]).toMatchObject({ lundi: "2026-11-30", debut: "2026-11-30", fin: "2026-11-30", tronquee: true })
  })

  it("fevrier 2027 (commence un lundi, 28 jours) : 4 semaines pleines", () => {
    const s = semainesDuMois(2027, 2)
    expect(s).toHaveLength(4)
    expect(s.every(x => !x.tronquee)).toBe(true)
  })

  it("libelles et infobulles", () => {
    const s = semainesDuMois(2026, 11)
    expect(libelleSemaine(s[2])).toBe("S46 · 09–15/11")
    expect(libelleSemaine(s[0])).toBe("S44 · 01/11")
    expect(infobulleSemaine(s[2])).toBe("Semaine 46 : du 09/11 au 15/11")
    expect(infobulleSemaine(s[0])).toMatch(/seuls les jours du mois choisi sont comptés \(le 01\/11\)/)
  })
})

describe("semaines terminees", () => {
  it("garde les semaines jusqu'a la semaine precedente incluse", () => {
    const nov = semainesDuMois(2026, 11)
    expect(semainesTerminees(nov, semainePrecedente("2026-11-15")).map(s => s.numero)).toEqual([44, 45])
    expect(semainesTerminees(nov, semainePrecedente("2026-12-16"))).toHaveLength(6) // mois passe : tout
    expect(semainesTerminees(semainesDuMois(2026, 12), semainePrecedente("2026-11-15"))).toEqual([]) // mois futur
  })
})

describe("agregation", () => {
  it("ne compte que les presences validees (attended === true), une seule serie", () => {
    const s = agreger(semainesDuMois(2026, 11), [
      { session_date: "2026-11-10", attended: true },
      { session_date: "2026-11-11", attended: false },
      { session_date: "2026-11-12", attended: null },
      { session_date: "2026-11-01", attended: true },
      { session_date: "2026-10-31", attended: true }, // hors mois : ignoree
    ])
    expect(s[2].valides).toBe(1)
    expect(s[0].valides).toBe(1)
    expect(s.reduce((a, x) => a + x.valides, 0)).toBe(2)
    expect(s[2]).not.toHaveProperty("presences")
  })
})
