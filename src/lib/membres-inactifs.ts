// ── Membres AVEC DU CREDIT qui ne sont pas venus depuis plus d'un an ───────
//
// Definition (arbitree le 15/11/2026) :
//   - « venir » = une PRESENCE POINTEE (`bookings.attended = true`, sur une
//     reservation confirmee). Une reservation jamais pointee ne compte pas ;
//   - seuls les membres ACTIFS qui ont du credit (`credits > 0`) ;
//   - derniere presence il y a PLUS D'UN AN (plus de 365 jours) ;
//   - jamais venu : inclus seulement s'il est inscrit depuis plus d'un an
//     (`joined_at`) ; date d'inscription inconnue : exclu (rien ne prouve
//     l'anciennete).
// Jours = date du jour (Paris) − date de la seance de la derniere presence.
//
// Avant le 15/11/2026, la liste prenait la derniere RESERVATION, a partir de
// 30 jours, sans condition de credit.

export const SEUIL_JOURS = 365
export const STATUTS_ACTIFS = ["actif", "Actif", "active"]

export type MembreLu = {
  id: string; first_name: string | null; last_name: string | null
  email: string | null; joined_at: string | null; credits: number | null
}
/** Une presence POINTEE (attended = true). */
export type PresenceLue = { member_id: string; session_date: string }

export type MembreInactif = {
  id: string; prenom: string; nom: string; email: string; credits: number
  dernierePresence: string | null // AAAA-MM-JJ, null = jamais venu
  jours: number | null            // jours depuis la derniere presence
  inscritDepuis: number | null    // jours depuis joined_at
}

const JOUR = 86_400_000
function ecartJours(du: string, au: string): number {
  const d = (s: string) => { const [a, m, j] = s.slice(0, 10).split("-").map(Number); return Date.UTC(a, m - 1, j) }
  return Math.round((d(au) - d(du)) / JOUR)
}

export function membresInactifs(membres: MembreLu[], presences: PresenceLue[], aujourdhui: string): MembreInactif[] {
  const derniere = new Map<string, string>()
  for (const p of presences) {
    const d = derniere.get(p.member_id)
    if (!d || p.session_date > d) derniere.set(p.member_id, p.session_date)
  }

  const inactifs: MembreInactif[] = []
  for (const m of membres) {
    if (!((m.credits ?? 0) > 0)) continue                       // sans credit : hors liste
    const der = derniere.get(m.id) ?? null
    const jours = der ? ecartJours(der, aujourdhui) : null
    const inscritDepuis = m.joined_at ? ecartJours(m.joined_at, aujourdhui) : null
    if (jours !== null && jours <= SEUIL_JOURS) continue          // venu dans l'annee
    if (jours === null && !(inscritDepuis !== null && inscritDepuis > SEUIL_JOURS)) continue // jamais venu, pas (prouve) inscrit depuis plus d'un an
    inactifs.push({
      id: m.id, prenom: m.first_name || "", nom: m.last_name || "", email: m.email || "",
      credits: m.credits ?? 0, dernierePresence: der, jours, inscritDepuis,
    })
  }
  // Les plus anciens d'abord ; « jamais venu » classe par anciennete.
  return inactifs.sort((a, b) => ((b.jours ?? b.inscritDepuis ?? 0) - (a.jours ?? a.inscritDepuis ?? 0)))
}
