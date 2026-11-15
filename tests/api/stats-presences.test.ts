import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockRequest } from "../helpers"
import { mockDb } from "../setup"
import { checkAuth } from "@/lib/auth-check"
import { createServiceSupabase } from "@/lib/supabase-server"
import { aujourdhuiParis, semainePrecedente } from "@/lib/stats-presences"

// GET /api/dashboard/stats-presences — agregats serveur du tableau de bord.
// Les lectures passent par le client de l'UTILISATEUR (RLS), jamais par la
// cle de service ; et le filtre studio_id est pose explicitement.

const url = (q: string) => `https://studio.fydelys.fr/api/dashboard/stats-presences?${q}`
const appeler = async (q: string) => {
  const { GET } = await import("@/app/api/dashboard/stats-presences/route")
  const res = await GET(createMockRequest(url(q)))
  return { res, json: await res.json() }
}
const ligne = (session_date: string, attended: boolean | null, status = "scheduled") =>
  ({ id: Math.random().toString(36), attended, sessions: { session_date, studio_id: "studio-123", status } })

// Reponses par requete, cle = date de debut (`.gte()`). Le mois et la semaine
// precedente sont lus EN PARALLELE : leurs pages s'entrelacent, une file
// unique les melangerait.
let reponsesReservations: Record<string, any[][]>

beforeEach(() => {
  vi.clearAllMocks()
  const c = mockDb._chain
  ;["select", "eq", "gte", "lte", "order", "or", "neq"].forEach(m => c[m].mockReturnValue(c))
  reponsesReservations = {}
  // La chaine est construite de facon synchrone : au moment de `.range()`, le
  // dernier `.gte()` est celui de CETTE requete.
  c.range = vi.fn(() => {
    const du = c.gte.mock.calls.at(-1)?.[1]
    return Promise.resolve({ data: reponsesReservations[du]?.shift() || [], error: null })
  })
  // comptage des seances : la chaine est attendue directement apres `.lte()`
  c.then = undefined
  mockDb.from.mockImplementation((table: string) => {
    if (table === "sessions") {
      const s: any = {}
      ;["select", "eq", "or", "gte"].forEach(m => { s[m] = vi.fn(() => s) })
      s.lte = vi.fn(() => Promise.resolve({ count: nbSeances, error: null }))
      return s
    }
    return c
  })
  nbSeances = 3
})
let nbSeances = 3

describe("GET /api/dashboard/stats-presences", () => {
  it("studio avec donnees : presences validees par semaine du mois", async () => {
    reponsesReservations = {
      "2026-11-01": [[ligne("2026-11-10", true), ligne("2026-11-11", false), ligne("2026-11-12", null), ligne("2026-11-01", true),
        ligne("2026-11-13", true, "cancelled")]], // seance annulee : ne compte pas
      // semaine precedente : calculee depuis la date du jour reelle
      [semainePrecedente(aujourdhuiParis()).lundi]: [[ligne("2026-11-03", true), ligne("2026-11-04", true), ligne("2026-11-05", null)]],
    }
    const { res, json } = await appeler("studioId=studio-123&annee=2026&mois=11")
    expect(res.status).toBe(200)
    expect(json.nbSeances).toBe(3)
    expect(json.semaines).toHaveLength(6)
    expect(json.semaines[2]).toMatchObject({ numero: 46, valides: 1 })
    expect(json.semaines[0]).toMatchObject({ numero: 44, valides: 1 })
    expect(json.semaines[2]).not.toHaveProperty("presences")
    expect(json.semainePrecedente.valides).toBe(2)
  })

  it("studio vide : nbSeances = 0 et zeros partout (le widget affiche l'etat vide)", async () => {
    nbSeances = 0
    const { res, json } = await appeler("studioId=studio-123&annee=2026&mois=11")
    expect(res.status).toBe(200)
    expect(json.nbSeances).toBe(0)
    expect(json.semaines.every((s: any) => s.valides === 0)).toBe(true)
    expect(json.semainePrecedente.valides).toBe(0)
  })

  it("filtre explicitement par studio, ne lit que les reservations confirmees ET pointees", async () => {
    await appeler("studioId=studio-123&annee=2026&mois=11")
    const c = mockDb._chain
    expect(c.eq).toHaveBeenCalledWith("sessions.studio_id", "studio-123")
    expect(c.eq).toHaveBeenCalledWith("status", "confirmed")
    expect(c.eq).toHaveBeenCalledWith("attended", true)
    expect(c.gte).toHaveBeenCalledWith("sessions.session_date", "2026-11-01")
    expect(c.lte).toHaveBeenCalledWith("sessions.session_date", "2026-11-30")
  })

  it("lit avec le client de l'utilisateur (RLS), jamais avec la cle de service", async () => {
    await appeler("studioId=studio-123&annee=2026&mois=11")
    // createServiceSupabase n'est appele que par checkAuth — ici mocke, donc jamais.
    expect(createServiceSupabase).not.toHaveBeenCalled()
  })

  it("pagine au-dela de 1 000 lignes (plafond PostgREST)", async () => {
    const plein = Array.from({ length: 1000 }, () => ligne("2026-11-10", true))
    reponsesReservations = { "2026-11-01": [plein, [ligne("2026-11-10", true)]] }
    const { json } = await appeler("studioId=studio-123&annee=2026&mois=11")
    expect(json.semaines[2].valides).toBe(1001)
  })

  it("adherent : 403", async () => {
    vi.mocked(checkAuth).mockResolvedValueOnce({ user: { id: "a" }, profile: { studio_id: "studio-123", role: "adherent" }, studioId: "studio-123" } as any)
    const { res } = await appeler("studioId=studio-123")
    expect(res.status).toBe(403)
  })

  it("studio d'un autre : le refus de checkAuth est relaye", async () => {
    vi.mocked(checkAuth).mockResolvedValueOnce({ error: "Accès refusé — studio non autorisé", status: 403 } as any)
    const { res } = await appeler("studioId=autre-studio")
    expect(res.status).toBe(403)
  })

  it("mois invalide : 400 ; erreur de lecture : 500 sans detail technique", async () => {
    expect((await appeler("studioId=studio-123&annee=2026&mois=13")).res.status).toBe(400)
    mockDb._chain.range = vi.fn(() => Promise.resolve({ data: null, error: { message: "permission denied" } }))
    const { res, json } = await appeler("studioId=studio-123&annee=2026&mois=11")
    expect(res.status).toBe(500)
    expect(json.error).toBe("Impossible de calculer les statistiques")
  })
})
