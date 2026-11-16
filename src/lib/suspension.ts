import type { SupabaseClient } from "@supabase/supabase-js"

// ── Compte d'equipe suspendu ? (profiles.suspended_at) ─────────────────────
//
// La colonne vient de supabase/migrations/20261115_profiles_suspended_at.sql,
// appliquee A LA MAIN. Tant qu'elle ne l'est pas, la lecture echoue : on
// repond « non suspendu » plutot que de faire tomber le middleware ou toutes
// les routes /api. C'est pour la meme raison qu'elle est lue par une requete
// A PART, et pas ajoutee au `select` du profil existant.
export async function compteSuspendu(db: Pick<SupabaseClient, "from">, userId: string): Promise<boolean> {
  try {
    const { data, error } = await db.from("profiles").select("suspended_at").eq("id", userId).maybeSingle()
    if (error) return false
    return !!(data as any)?.suspended_at
  } catch {
    return false
  }
}
