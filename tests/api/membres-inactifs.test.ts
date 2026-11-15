import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createMockRequest } from "../helpers"
import { mockDb } from "../setup"
import { checkAuth } from "@/lib/auth-check"
import { createServiceSupabase } from "@/lib/supabase-server"

// GET /api/dashboard/membres-inactifs — calcul serveur, pagine, sous RLS.

const appeler = async (q = "studioId=studio-123") => {
  const { GET } = await import("@/app/api/dashboard/membres-inactifs/route")
  const res = await GET(createMockRequest(`https://studio.fydelys.fr/api/dashboard/membres-inactifs?${q}`))
  return { res, json: await res.json() }
}

// Reponses par table, page apres page. Les deux lectures tournent en parallele :
// chaque table a sa propre chaine pour ne pas melanger les pages.
let pages: Record<string, any[][]>
const chaines: Record<string, any> = {}
function chaine(table: string) {
  const c: any = {}
  ;["select", "eq", "is", "in", "not", "order", "gt"].forEach(k => { c[k] = vi.fn(() => c) })
  c.range = vi.fn(() => Promise.resolve({ data: pages[table]?.shift() || [], error: null }))
  return c
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] })
  vi.setSystemTime(new Date("2026-11-15T10:00:00Z"))
  vi.clearAllMocks()
  pages = {}
  mockDb.from.mockImplementation((t: string) => (chaines[t] = chaine(t)))
})
afterEach(() => vi.useRealTimers())

const membre = (id: string, joined_at = "2024-01-01") => ({ id, first_name: id, last_name: "X", email: `${id}@t.fr`, joined_at, credits: 3 })
const resa = (member_id: string, session_date: string) =>
  ({ id: Math.random().toString(36), member_id, sessions: { session_date, studio_id: "studio-123" } })

describe("GET /api/dashboard/membres-inactifs", () => {
  it("liste complete, nombre exact de jours, total reel : seulement plus d'un an", async () => {
    const ids = ["a", "b", "c", "d", "e", "f", "g"]
    pages.members = [ids.map(i => membre(i))]
    // "a" et "b" venus dans l'annee ; les 5 autres il y a plus d'un an
    pages.bookings = [[resa("a", "2026-11-10"), resa("b", "2026-01-15"), ...ids.slice(2).map((i, k) => resa(i, `2024-0${k + 1}-15`))]]
    const { res, json } = await appeler()
    expect(res.status).toBe(200)
    expect(json.total).toBe(5)
    expect(json.membres).toHaveLength(5)
    expect(json.membres[0]).toMatchObject({ id: "c", dernierePresence: "2024-01-15", jours: 1035, credits: 3 })
  })

  it("filtre par studio, membres actifs non supprimes AVEC CREDIT, presences POINTEES", async () => {
    await appeler()
    expect(chaines.members.eq).toHaveBeenCalledWith("studio_id", "studio-123")
    expect(chaines.members.is).toHaveBeenCalledWith("deleted_at", null)
    expect(chaines.members.in).toHaveBeenCalledWith("status", ["actif", "Actif", "active"])
    expect(chaines.bookings.eq).toHaveBeenCalledWith("sessions.studio_id", "studio-123")
    expect(chaines.bookings.eq).toHaveBeenCalledWith("status", "confirmed")
    expect(chaines.members.gt).toHaveBeenCalledWith("credits", 0)
    expect(chaines.bookings.eq).toHaveBeenCalledWith("attended", true)
  })

  it("pagine les presences au-dela de 1 000 lignes : la derniere peut etre en page 2", async () => {
    pages.members = [[membre("a")]]
    pages.bookings = [Array.from({ length: 1000 }, () => resa("a", "2024-01-01")), [resa("a", "2026-11-01")]]
    const { json } = await appeler()
    expect(json.total).toBe(0) // la presence du 01/11 (page 2) sort "a" de la liste
  })

  it("lit avec le client de l'utilisateur (RLS), jamais avec la cle de service", async () => {
    await appeler()
    expect(createServiceSupabase).not.toHaveBeenCalled()
  })

  it("adherent : 403 ; autre studio : refus de checkAuth relaye ; erreur : 500 sans detail", async () => {
    vi.mocked(checkAuth).mockResolvedValueOnce({ user: { id: "a" }, profile: { studio_id: "studio-123", role: "adherent" }, studioId: "studio-123" } as any)
    expect((await appeler()).res.status).toBe(403)
    vi.mocked(checkAuth).mockResolvedValueOnce({ error: "Accès refusé — studio non autorisé", status: 403 } as any)
    expect((await appeler("studioId=autre")).res.status).toBe(403)
    mockDb.from.mockImplementation((t: string) => {
      const c = chaine(t); c.range = vi.fn(() => Promise.resolve({ data: null, error: { message: "permission denied" } })); return c
    })
    const { res, json } = await appeler()
    expect(res.status).toBe(500)
    expect(json.error).toBe("Impossible de charger les membres absents depuis plus d'un an")
  })
})
