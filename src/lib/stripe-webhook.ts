import type { SupabaseClient } from "@supabase/supabase-js"

// ── Webhooks Stripe : idempotence et controle du membre (15/11/2026) ───────

/**
 * Reserve l'evenement AVANT traitement (table stripe_webhook_events, cle
 * primaire event_id) :
 *   - "nouveau"   : premiere reception, a traiter ;
 *   - "deja"      : deja recu (rejeu, nouvelle tentative) → ne rien refaire ;
 *   - "sans-table": table absente (migration 20261115_stripe_webhook_events
 *     non appliquee) ou autre erreur — on traite quand meme, le garde-fou
 *     secondaire (paiement deja enregistre) reste en place.
 */
export async function reserverEvenement(db: SupabaseClient, eventId: string, type: string): Promise<"nouveau" | "deja" | "sans-table"> {
  const { error } = await db.from("stripe_webhook_events").insert({ event_id: eventId, type })
  if (!error) return "nouveau"
  if ((error as any).code === "23505") return "deja"
  console.error("[stripe-webhook] idempotence indisponible (migration stripe_webhook_events ?) :", error.message)
  return "sans-table"
}

/** Libere la reservation si le traitement a echoue : la tentative suivante de Stripe repassera. */
export async function libererEvenement(db: SupabaseClient, eventId: string): Promise<void> {
  await db.from("stripe_webhook_events").delete().eq("event_id", eventId)
}

/**
 * Vrai si le membre appartient au studio indique dans les metadonnees du
 * paiement. Avant : le webhook creditait `memberId` par son seul id.
 */
export async function membreDuStudio(db: SupabaseClient, memberId: string, studioId: string): Promise<boolean> {
  const { data } = await db.from("members").select("studio_id").eq("id", memberId).maybeSingle()
  return !!data && (data as any).studio_id === studioId
}
