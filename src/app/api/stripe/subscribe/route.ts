import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerSupabase as createClient } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { planSlug, studioId } = await req.json()

    // Vérifier admin du studio
    const { data: profile } = await supabase
      .from("profiles").select("role, studio_id").eq("id", user.id).single()
    if (!profile || profile.role !== "admin" || profile.studio_id !== studioId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Récupérer plan (prix hardcodés si pas de table plans configurée)
    const PLAN_PRICES: Record<string, { name: string; price: number }> = {
      essentiel: { name: "Essentiel",  price: 9  },
      standard:  { name: "Standard",   price: 29 },
      pro:       { name: "Pro",        price: 69 },
    }
    const { data: planRow } = await supabase
      .from("plans").select("stripe_price_id, name").eq("slug", planSlug).maybeSingle()

    let priceId = planRow?.stripe_price_id || null
    const planInfo = PLAN_PRICES[planSlug]
    if (!planInfo) return NextResponse.json({ error: "Plan inconnu" }, { status: 400 })

    // Créer le price Stripe à la volée si pas encore configuré
    if (!priceId) {
      const stripeProduct = await stripe.products.create({ name: `Fydelys ${planInfo.name}` })
      const stripePrice = await stripe.prices.create({
        unit_amount: planInfo.price * 100,
        currency: "eur",
        recurring: { interval: "month" },
        product: stripeProduct.id,
      })
      priceId = stripePrice.id
      // Sauvegarder pour la prochaine fois
      await supabase.from("plans").upsert({ slug: planSlug, name: planInfo.name, price_monthly: planInfo.price, stripe_price_id: priceId }, { onConflict: "slug" })
    }

    const { data: studio } = await supabase
      .from("studios").select("name, stripe_customer_id, billing_status, trial_ends_at")
      .eq("id", studioId).single()
    if (!studio) return NextResponse.json({ error: "Studio introuvable" }, { status: 404 })

    // Créer ou récupérer le customer Stripe
    let customerId = studio.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: studio.name,
        metadata: { studioId, userId: user.id },
      })
      customerId = customer.id
      await supabase.from("studios").update({ stripe_customer_id: customerId }).eq("id", studioId)
    }

    // Calcul trial restant
    const trialEnd = studio.billing_status === "trialing" && studio.trial_ends_at
      ? Math.floor(new Date(studio.trial_ends_at).getTime() / 1000)
      : undefined
    const hasTrialLeft = trialEnd && trialEnd > Math.floor(Date.now() / 1000)

    // Récupérer le slug du studio pour les URLs de retour
    const { data: studioSlugData } = await supabase.from("studios").select("slug").eq("id", studioId).single()
    const slug = studioSlugData?.slug || "app"
    const baseUrl = `https://${slug}.fydelys.fr`

    // Toujours utiliser Stripe Checkout (évite les problèmes de domaine avec Elements)
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/billing?success=1&plan=${planSlug}`,
      cancel_url: `${baseUrl}/billing`,
      payment_method_collection: "always",
      metadata: { studioId, planSlug },
    }

    if (hasTrialLeft) {
      sessionParams.subscription_data = { trial_end: trialEnd, metadata: { studioId, planSlug } }
    } else {
      sessionParams.subscription_data = { metadata: { studioId, planSlug } }
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return NextResponse.json({ url: session.url, type: "checkout" })
  } catch (err: any) {
    console.error("Subscribe error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}