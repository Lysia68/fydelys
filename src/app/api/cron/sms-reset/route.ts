import { NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

// GET /api/cron/sms-reset — Reset mensuel des crédits SMS selon le plan
// Cron Vercel : 0 0 1 * * (1er de chaque mois à minuit UTC)
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const db = createServiceSupabase()

  // Charger les quotas par plan
  const { data: plans } = await db.from("plans").select("slug, sms_monthly_quota")
  const quotaBySlug: Record<string, number> = {}
  ;(plans || []).forEach((p: any) => { if (p.slug) quotaBySlug[p.slug] = p.sms_monthly_quota || 0 })

  // Charger tous les studios actifs avec SMS activé
  const { data: studios } = await db.from("studios")
    .select("id, name, plan_slug, sms_credits_balance, billing_status, sms_enabled")
    .eq("sms_enabled", true)
    .in("billing_status", ["active", "trialing"])

  let updated = 0
  for (const studio of studios || []) {
    const quota = quotaBySlug[studio.plan_slug] || 0
    if (quota <= 0) continue

    // Reset : quota du plan + crédits achetés restants (on ne retire pas les crédits payés)
    // Simplification : on remet au quota du plan (les achats supplémentaires sont un bonus ponctuel)
    const newBalance = Math.max(studio.sms_credits_balance || 0, quota)

    const { error } = await db.from("studios").update({
      sms_credits_balance: newBalance,
      sms_credits_reset_at: new Date().toISOString(),
    }).eq("id", studio.id)

    if (!error) {
      updated++
      console.log(`[sms-reset] ${studio.name}: ${studio.sms_credits_balance} → ${newBalance} (plan ${studio.plan_slug}, quota ${quota})`)
    }
  }

  return NextResponse.json({ ok: true, updated, total: studios?.length || 0 })
}
