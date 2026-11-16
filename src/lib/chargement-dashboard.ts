// ── Donnees du tableau de bord, PAGINEES (16/11/2026) ──────────────────────
//
// PostgREST plafonne une reponse a 1 000 lignes SANS erreur : au-dela, les
// chiffres du tableau de bord (taux de remplissage, CA du mois, membres
// actifs…) etaient calcules sur une liste tronquee. Chaque lecture passe
// donc par `toutesLesPages`, avec un tri sur une cle unique (`id`) pour que
// les pages ne se chevauchent pas.
//
// Les reservations ne sont plus lues par `.in("session_id", <tous les ids>)` —
// une URL qui grossit avec le nombre de seances — mais par jointure sur le
// studio (`sessions!inner`), comme lib/stats-presences.ts.

export const PAGE = 1000

/** Lit toutes les pages ; leve une erreur si une page echoue (rien de partiel). */
export async function toutesLesPages<T = any>(
  lire: (de: number, a: number) => PromiseLike<{ data: any[] | null; error: any }>,
): Promise<T[]> {
  const lignes: T[] = []
  for (let de = 0; ; de += PAGE) {
    const { data, error } = await lire(de, de + PAGE - 1)
    if (error) throw new Error(error.message || String(error))
    lignes.push(...((data || []) as T[]))
    if (!data || data.length < PAGE) return lignes
  }
}

export async function chargerDonneesDashboard(sb: any, studioId: string) {
  const [sessions, bookings, members, payments] = await Promise.all([
    toutesLesPages((de, a) => sb.from("sessions")
      .select("id,discipline_id,teacher,room,duration_min,spots,session_date,session_time,status")
      .eq("studio_id", studioId).order("id").range(de, a)),
    toutesLesPages((de, a) => sb.from("bookings")
      .select("id, session_id, status, attended, member_id, guest_name, host_member_id, members!bookings_member_id_fkey(first_name, last_name, email, phone), sessions!inner(studio_id)")
      .eq("sessions.studio_id", studioId).order("id").range(de, a)),
    toutesLesPages((de, a) => sb.from("members")
      .select("id,first_name,last_name,email,phone,status,joined_at,credits,credits_total,subscription_id,subscriptions(name)")
      .eq("studio_id", studioId).is("deleted_at", null).order("id").range(de, a)),
    toutesLesPages((de, a) => sb.from("member_payments")
      .select("id,amount,status,payment_date,payment_type,notes,members(first_name,last_name)")
      .eq("studio_id", studioId).order("id").range(de, a)),
  ])
  return { sessions, bookings, members, payments }
}
