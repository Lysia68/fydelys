import type { SupabaseClient } from "@supabase/supabase-js"

// ── Quota partage entre instances (fonction SQL consommer_quota) ───────────
//   "ok"          : sous la limite ;
//   "depasse"     : limite atteinte pour la fenetre en cours ;
//   "indisponible": fonction absente (migration 20261116_api_quota.sql non
//                   appliquee) ou erreur — a l'appelant de choisir son repli.
export async function consommerQuota(
  db: SupabaseClient, cle: string, fenetreSec: number, max: number,
): Promise<"ok" | "depasse" | "indisponible"> {
  try {
    const { data, error } = await db.rpc("consommer_quota", { p_cle: cle, p_fenetre_sec: fenetreSec, p_max: max })
    if (error) {
      console.error("[quota] compteur indisponible (migration api_quota ?) :", error.message)
      return "indisponible"
    }
    return data === true ? "ok" : "depasse"
  } catch (e: any) {
    console.error("[quota] compteur indisponible :", e?.message)
    return "indisponible"
  }
}
