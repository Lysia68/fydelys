import type { SupabaseClient } from "@supabase/supabase-js"
import { aujourdhuiParis } from "@/lib/stats-presences"

// ── Seances d'un coach ─────────────────────────────────────────────────────
//
// Une seance ne reference PAS son coach par un id : `sessions.teacher` est
// le NOM saisi en texte libre (c'est aussi ce que comparent les reglages).
// On compte donc les seances du studio dont `teacher` vaut l'un des noms
// connus du compte (profil, et fiche membre s'il en a une), a la casse et aux
// espaces pres. Conservateur : en cas de doute, une concordance bloque une
// suppression. Limite : une seance saisie avec un autre libelle (prenom seul…)
// n'est pas vue.

const echapperLike = (s: string) => s.replace(/[\\%_]/g, m => "\\" + m)

export async function nomsDuCoach(db: SupabaseClient, profileId: string): Promise<string[]> {
  const [{ data: p }, { data: m }] = await Promise.all([
    db.from("profiles").select("first_name, last_name").eq("id", profileId).maybeSingle(),
    db.from("members").select("first_name, last_name").eq("auth_user_id", profileId).limit(1).maybeSingle(),
  ])
  const noms = [p, m]
    .map((x: any) => `${x?.first_name || ""} ${x?.last_name || ""}`.replace(/\s+/g, " ").trim())
    .filter(Boolean)
  return [...new Set(noms.map(n => n.toLowerCase()))]
}

/** Nombre de seances (non annulees) du coach dans le studio ; `futures` : a partir d'aujourd'hui (Paris). */
export async function compterSeancesDuCoach(
  db: SupabaseClient, studioId: string, profileId: string, opts: { futures?: boolean } = {},
): Promise<number> {
  const noms = await nomsDuCoach(db, profileId)
  let total = 0
  for (const nom of noms) {
    let q = db.from("sessions").select("id", { count: "exact", head: true })
      .eq("studio_id", studioId)
      .ilike("teacher", echapperLike(nom)) // egalite insensible a la casse (jokers echappes)
    if (opts.futures) q = q.gte("session_date", aujourdhuiParis()).neq("status", "cancelled")
    const { count, error } = await q
    if (error) throw new Error(error.message)
    total += count || 0
  }
  return total
}
