// ── Statistiques de presences du tableau de bord ─────────────────────────
//
// DEFINITION (arbitree le 15/11/2026) — seule serie affichee depuis :
//   - VALIDES = reservations CONFIRMEES (`bookings.status = 'confirmed'`)
//     dont la presence a ete pointee (`bookings.attended = true` — le
//     pointage qui debite un credit).
//   La serie « presences » (tous les inscrits) a ete retiree le meme jour, a
//   la demande : le graphique ne montre que les presences validees.
//   Les seances annulees (`sessions.status = 'cancelled'`) ne comptent pas.
//   Il n'existe PAS de « seance validee » : `sessions.status` ne vaut que
//   scheduled ou cancelled (`completed` est dans le schema, rien ne l'ecrit).
//
// SEMAINES : semaines ISO (lundi → dimanche), en heure de Paris. Les dates
// manipulees ici sont des dates calendaires `AAAA-MM-JJ` (comme
// `sessions.session_date`) : l'arithmetique se fait en UTC pur, sans fuseau,
// donc sans piege de changement d'heure.
//
// Pas de vue `studio_kpis` : elle est cassee (42P17, recursion).

export type Semaine = {
  numero: number      // numero de semaine ISO
  anneeIso: number    // annee ISO (differente de l'annee civile autour du 1er janvier)
  lundi: string       // AAAA-MM-JJ
  dimanche: string    // AAAA-MM-JJ
  debut: string       // premier jour COMPTE (borne au mois pour les semaines a cheval)
  fin: string         // dernier jour COMPTE
  tronquee: boolean   // vrai si une partie de la semaine sort du mois
}

export type SemaineStats = Semaine & { valides: number }

const JOUR = 86_400_000

function versDate(iso: string): Date {
  const [a, m, j] = iso.split("-").map(Number)
  return new Date(Date.UTC(a, m - 1, j))
}
function versIso(d: Date): string {
  return d.toISOString().slice(0, 10)
}
function ajouterJours(iso: string, n: number): string {
  return versIso(new Date(versDate(iso).getTime() + n * JOUR))
}

/** Date du jour a Paris, `AAAA-MM-JJ`. */
export function aujourdhuiParis(maintenant: Date = new Date()): string {
  // en-CA formate en AAAA-MM-JJ
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(maintenant)
}

/** Lundi de la semaine ISO contenant `iso`. */
export function lundiDe(iso: string): string {
  const jour = versDate(iso).getUTCDay() // 0 = dimanche
  return ajouterJours(iso, -((jour + 6) % 7))
}

/** Numero et annee ISO de la semaine contenant `iso` (le jeudi decide). */
export function semaineIso(iso: string): { numero: number; anneeIso: number } {
  const jeudi = versDate(ajouterJours(lundiDe(iso), 3))
  const anneeIso = jeudi.getUTCFullYear()
  const premierJanvier = Date.UTC(anneeIso, 0, 1)
  const numero = Math.floor((jeudi.getTime() - premierJanvier) / JOUR / 7) + 1
  return { numero, anneeIso }
}

function semaine(lundi: string, debut: string, fin: string): Semaine {
  const dimanche = ajouterJours(lundi, 6)
  return { ...semaineIso(lundi), lundi, dimanche, debut, fin, tronquee: debut !== lundi || fin !== dimanche }
}

/** Semaine ISO precedant celle de `aujourdhui` : lundi → dimanche entiers. */
export function semainePrecedente(aujourdhui: string): Semaine {
  const lundi = ajouterJours(lundiDe(aujourdhui), -7)
  return semaine(lundi, lundi, ajouterJours(lundi, 6))
}

/** Dernier jour du mois (`mois` de 1 a 12). */
export function finDuMois(annee: number, mois: number): string {
  return versIso(new Date(Date.UTC(annee, mois, 0)))
}

/**
 * Semaines ISO qui chevauchent le mois, chacune BORNEE aux jours du mois :
 * une semaine a cheval ne compte que ses jours compris dans le mois.
 */
export function semainesDuMois(annee: number, mois: number): Semaine[] {
  const premier = `${annee}-${String(mois).padStart(2, "0")}-01`
  const dernier = finDuMois(annee, mois)
  const semaines: Semaine[] = []
  for (let lundi = lundiDe(premier); lundi <= dernier; lundi = ajouterJours(lundi, 7)) {
    const dimanche = ajouterJours(lundi, 6)
    semaines.push(semaine(lundi, lundi < premier ? premier : lundi, dimanche > dernier ? dernier : dimanche))
  }
  return semaines
}

/** Une reservation, telle que lue en base. */
export type LigneReservation = { session_date: string; attended: boolean | null }

/**
 * Compte, semaine par semaine, les presences VALIDEES. La route ne lit deja
 * que `attended = true` ; le test est refait ici pour que la definition ne
 * depende pas du filtre de la requete.
 */
export function agreger(semaines: Semaine[], lignes: LigneReservation[]): SemaineStats[] {
  const stats = semaines.map(s => ({ ...s, valides: 0 }))
  for (const l of lignes) {
    if (l.attended !== true) continue
    const s = stats.find(x => l.session_date >= x.debut && l.session_date <= x.fin)
    if (s) s.valides++
  }
  return stats
}

function jjmm(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
}

/** « S46 · 09–15/11 » (jours comptes uniquement). */
export function libelleSemaine(s: Semaine): string {
  const jours = s.debut === s.fin ? jjmm(s.debut) : `${s.debut.slice(8, 10)}–${jjmm(s.fin)}`
  return `S${s.numero} · ${jours}`
}

/** Infobulle : la semaine ISO complete, et ce qui est compte quand elle est tronquee. */
export function infobulleSemaine(s: Semaine): string {
  const complete = `Semaine ${s.numero} : du ${jjmm(s.lundi)} au ${jjmm(s.dimanche)}`
  if (!s.tronquee) return complete
  const comptes = s.debut === s.fin ? `le ${jjmm(s.debut)}` : `du ${jjmm(s.debut)} au ${jjmm(s.fin)}`
  return `${complete}. Semaine à cheval sur deux mois : seuls les jours du mois choisi sont comptés (${comptes}).`
}
