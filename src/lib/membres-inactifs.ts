// ── Membres sans réservation depuis plus de 30 jours ─────────────────────
//
// « Réservation » = reservation CONFIRMEE (`bookings.status = 'confirmed'`),
// quelle que soit la date de la seance : une reservation a venir rend le
// membre actif. C'est la definition qu'utilisait deja la carte du tableau de
// bord ; seul le calcul a change de place (serveur, pagine).
//
// Jours = date du jour (Paris) − date de la seance de la DERNIERE reservation.
// Membre qui n'a jamais reserve : `jours = null`, et c'est son anciennete
// (`joined_at`) qui donne la couleur ; un membre inscrit depuis 30 jours ou
// moins n'est pas « inactif », il est nouveau.
//
// Couleur : orange jusqu'a un an (365 jours), rouge au-dela.

export const SEUIL_JOURS = 30
export const UN_AN = 365
export const STATUTS_ACTIFS = ["actif", "Actif", "active"]

export type MembreLu = {
  id: string; first_name: string | null; last_name: string | null
  email: string | null; joined_at: string | null
}
export type ReservationLue = { member_id: string; session_date: string }

export type MembreInactif = {
  id: string; prenom: string; nom: string; email: string
  derniereReservation: string | null // AAAA-MM-JJ, null = jamais reserve
  jours: number | null               // jours depuis la derniere reservation
  inscritDepuis: number | null       // jours depuis joined_at
  niveau: "orange" | "rouge"
}

const JOUR = 86_400_000
function ecartJours(du: string, au: string): number {
  const d = (s: string) => { const [a, m, j] = s.slice(0, 10).split("-").map(Number); return Date.UTC(a, m - 1, j) }
  return Math.round((d(au) - d(du)) / JOUR)
}

export function membresInactifs(membres: MembreLu[], reservations: ReservationLue[], aujourdhui: string): MembreInactif[] {
  const derniere = new Map<string, string>()
  for (const r of reservations) {
    const d = derniere.get(r.member_id)
    if (!d || r.session_date > d) derniere.set(r.member_id, r.session_date)
  }

  const inactifs: MembreInactif[] = []
  for (const m of membres) {
    const der = derniere.get(m.id) ?? null
    const jours = der ? ecartJours(der, aujourdhui) : null
    const inscritDepuis = m.joined_at ? ecartJours(m.joined_at, aujourdhui) : null
    if (jours !== null && jours <= SEUIL_JOURS) continue                    // actif
    if (jours === null && inscritDepuis !== null && inscritDepuis <= SEUIL_JOURS) continue // nouveau
    const reference = jours ?? inscritDepuis
    inactifs.push({
      id: m.id,
      prenom: m.first_name || "", nom: m.last_name || "", email: m.email || "",
      derniereReservation: der, jours, inscritDepuis,
      niveau: reference !== null && reference > UN_AN ? "rouge" : "orange",
    })
  }
  // Les plus anciens d'abord ; « jamais reserve » classe par anciennete.
  return inactifs.sort((a, b) => ((b.jours ?? b.inscritDepuis ?? 0) - (a.jours ?? a.inscritDepuis ?? 0)))
}
