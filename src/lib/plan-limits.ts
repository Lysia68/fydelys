import { createServiceSupabase } from "./supabase-server"

export type PlanLimits = {
  maxMembers: number | null
  maxCoaches: number | null
  maxDisciplines: number | null
  features: string[]
  planName: string
  planSlug: string
}

const PLAN_DISCIPLINES: Record<string, number> = {
  essentiel: 1,
  standard: 3,
  pro: 999,
}

/** Charge les limites du plan d'un studio */
export async function getPlanLimits(studioId: string): Promise<PlanLimits | null> {
  const db = createServiceSupabase()
  const { data: studio } = await db.from("studios")
    .select("plan_slug").eq("id", studioId).single()
  if (!studio?.plan_slug) return null

  const { data: plan } = await db.from("plans")
    .select("name, slug, max_members, max_coaches, features")
    .eq("slug", studio.plan_slug).single()
  if (!plan) return null

  return {
    maxMembers: plan.max_members ?? null,
    maxCoaches: plan.max_coaches ?? null,
    maxDisciplines: PLAN_DISCIPLINES[plan.slug] ?? null,
    features: plan.features || [],
    planName: plan.name,
    planSlug: plan.slug,
  }
}

/** Compte les ressources actuelles d'un studio */
export async function getStudioCounts(studioId: string) {
  const db = createServiceSupabase()
  const [members, coaches, disciplines] = await Promise.all([
    db.from("members").select("id", { count: "exact", head: true }).eq("studio_id", studioId),
    db.from("profiles").select("id", { count: "exact", head: true }).eq("studio_id", studioId).in("role", ["coach", "admin"]).eq("is_coach", true),
    db.from("disciplines").select("id", { count: "exact", head: true }).eq("studio_id", studioId),
  ])
  return {
    members: members.count || 0,
    coaches: coaches.count || 0,
    disciplines: disciplines.count || 0,
  }
}

/** Vérifie si une action est autorisée et retourne l'erreur si non */
export async function checkPlanLimit(
  studioId: string,
  action: "add_member" | "add_coach" | "add_discipline" | "use_feature",
  featureName?: string
): Promise<{ ok: true } | { ok: false; error: string; limit: number | null; current: number }> {
  const limits = await getPlanLimits(studioId)
  if (!limits) return { ok: false, error: "Plan introuvable", limit: null, current: 0 }

  const counts = await getStudioCounts(studioId)

  switch (action) {
    case "add_member":
      if (limits.maxMembers !== null && counts.members >= limits.maxMembers) {
        return { ok: false, error: `Limite atteinte : ${limits.maxMembers} adhérents max (plan ${limits.planName}). Passez au plan supérieur.`, limit: limits.maxMembers, current: counts.members }
      }
      break
    case "add_coach":
      if (limits.maxCoaches !== null && counts.coaches >= limits.maxCoaches) {
        return { ok: false, error: `Limite atteinte : ${limits.maxCoaches} coach${limits.maxCoaches > 1 ? "s" : ""} max (plan ${limits.planName}). Passez au plan supérieur.`, limit: limits.maxCoaches, current: counts.coaches }
      }
      break
    case "add_discipline":
      if (limits.maxDisciplines !== null && counts.disciplines >= limits.maxDisciplines) {
        return { ok: false, error: `Limite atteinte : ${limits.maxDisciplines} discipline${limits.maxDisciplines > 1 ? "s" : ""} max (plan ${limits.planName}). Passez au plan supérieur.`, limit: limits.maxDisciplines, current: counts.disciplines }
      }
      break
    case "use_feature":
      if (featureName && !limits.features.includes(featureName)) {
        return { ok: false, error: `Fonctionnalité "${featureName}" non disponible dans le plan ${limits.planName}. Passez au plan supérieur.`, limit: null, current: 0 }
      }
      break
  }

  return { ok: true }
}
