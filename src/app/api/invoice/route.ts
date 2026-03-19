import { NextRequest, NextResponse } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"
import Stripe from "stripe"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get("paymentId")
  if (!paymentId) return NextResponse.json({ error: "paymentId requis" }, { status: 400 })

  const db = createServiceSupabase()

  // Récupérer le paiement + studio
  const { data: pay } = await db.from("member_payments")
    .select("id, amount, payment_date, payment_type, notes, status, source, studio_id, member_id, stripe_payment_id, members(first_name, last_name, email)")
    .eq("id", paymentId).single()

  if (!pay) return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 })

  const { data: studio } = await db.from("studios")
    .select("name, address, city, postal_code, email, phone, slug, stripe_sk, payment_mode, stripe_connect_id")
    .eq("id", pay.studio_id).single()

  // ── Tenter de récupérer la facture/reçu Stripe ─────────────────────────────
  const stripePaymentId = (pay as any).stripe_payment_id
  if (stripePaymentId) {
    try {
      // Choisir la bonne instance Stripe selon payment_mode
      let stripeInstance = stripe
      let connectAccount: string | undefined

      if (studio?.payment_mode === "direct" && studio?.stripe_sk) {
        stripeInstance = new Stripe(studio.stripe_sk, { apiVersion: "2024-06-20" })
      } else if (studio?.payment_mode === "connect" && studio?.stripe_connect_id) {
        connectAccount = studio.stripe_connect_id
      }

      const options = connectAccount ? { stripeAccount: connectAccount } : {}

      // Cas 1 : stripe_payment_id commence par "in_" → c'est une Invoice Stripe
      if (stripePaymentId.startsWith("in_")) {
        const invoice = await stripeInstance.invoices.retrieve(stripePaymentId, options)
        if (invoice.invoice_pdf) {
          return NextResponse.redirect(invoice.invoice_pdf)
        }
      }

      // Cas 2 : "pi_" → PaymentIntent → récupérer le charge → receipt_url
      if (stripePaymentId.startsWith("pi_")) {
        const pi = await stripeInstance.paymentIntents.retrieve(
          stripePaymentId,
          { expand: ["latest_charge"] },
          options
        )
        const charge = pi.latest_charge as Stripe.Charge
        if (charge?.receipt_url) {
          return NextResponse.redirect(charge.receipt_url)
        }
      }

      // Cas 3 : "ch_" → charge directe
      if (stripePaymentId.startsWith("ch_")) {
        const charge = await stripeInstance.charges.retrieve(stripePaymentId, options)
        if (charge.receipt_url) {
          return NextResponse.redirect(charge.receipt_url)
        }
      }
    } catch (err: any) {
      console.warn("[invoice] Stripe lookup failed, fallback to HTML receipt:", err.message)
    }
  }

  // ── Fallback : reçu HTML maison ────────────────────────────────────────────
  const member = (pay as any).members as any
  const memberName = member ? `${member.first_name} ${member.last_name}` : "Adhérent"
  const dateStr = new Date(pay.payment_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
  const invoiceNum = `FAC-${pay.id.slice(0,8).toUpperCase()}`
  const studioName = studio?.name || "Studio"
  const now = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<title>Reçu ${invoiceNum}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #2A1F14; background: #fff; padding: 48px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #F0E8DC; }
  .brand { font-size: 28px; font-weight: 800; color: #A06838; letter-spacing: -0.5px; }
  .brand-sub { font-size: 12px; color: #8C7B6C; margin-top: 3px; }
  .invoice-title { text-align: right; }
  .invoice-title h1 { font-size: 22px; font-weight: 800; color: #2A1F14; }
  .invoice-title .num { font-size: 13px; color: #8C7B6C; margin-top: 4px; }
  .invoice-title .date { font-size: 13px; color: #8C7B6C; margin-top: 2px; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 36px; }
  .party-block h3 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #A06838; margin-bottom: 10px; }
  .party-block p { font-size: 14px; color: #2A1F14; line-height: 1.7; }
  .party-block .name { font-weight: 700; font-size: 15px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
  thead { background: #F5EBE0; }
  th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: #A06838; }
  td { padding: 13px 14px; border-bottom: 1px solid #F0E8DC; font-size: 14px; }
  .amount { text-align: right; font-weight: 700; }
  .total-row td { font-weight: 800; font-size: 16px; border-bottom: none; border-top: 2px solid #F0E8DC; background: #FDFAF7; }
  .status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; background: #E6F2E8; color: #4E8A58; }
  .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #F0E8DC; display: flex; justify-content: space-between; align-items: center; }
  .footer-note { font-size: 11px; color: #B0A090; }
  .footer-powered { font-size: 11px; color: #C4922A; font-weight: 600; }
  @media print { body { padding: 32px; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">${studioName}</div>
      <div class="brand-sub">${studio?.address || ""}${studio?.city ? ` · ${studio.city}` : ""}${studio?.postal_code ? ` ${studio.postal_code}` : ""}</div>
      ${studio?.email ? `<div class="brand-sub">${studio.email}</div>` : ""}
    </div>
    <div class="invoice-title">
      <h1>Reçu de paiement</h1>
      <div class="num">N° ${invoiceNum}</div>
      <div class="date">Émis le ${now}</div>
    </div>
  </div>
  <div class="parties">
    <div class="party-block">
      <h3>Émetteur</h3>
      <p>
        <span class="name">${studioName}</span><br/>
        ${studio?.address || ""}${studio?.city ? `<br/>${studio.postal_code || ""} ${studio.city}` : ""}
        ${studio?.email ? `<br/>${studio.email}` : ""}
        ${studio?.phone ? `<br/>${studio.phone}` : ""}
      </p>
    </div>
    <div class="party-block">
      <h3>Adhérent</h3>
      <p>
        <span class="name">${memberName}</span><br/>
        ${member?.email || ""}
      </p>
    </div>
  </div>
  <table>
    <thead><tr><th>Description</th><th>Date</th><th>Mode</th><th style="text-align:right">Montant</th></tr></thead>
    <tbody>
      <tr>
        <td>${pay.notes || "Achat"}</td>
        <td>${dateStr}</td>
        <td>${pay.payment_type || "Carte bancaire"}</td>
        <td class="amount">${Number(pay.amount).toFixed(2)} €</td>
      </tr>
    </tbody>
    <tfoot>
      <tr class="total-row"><td colspan="3">Total TTC</td><td class="amount">${Number(pay.amount).toFixed(2)} €</td></tr>
    </tfoot>
  </table>
  <div>Statut : <span class="status-badge">${pay.status || "payé"}</span></div>
  <div class="footer">
    <div class="footer-note">Ce document tient lieu de reçu · TVA non applicable</div>
    <div class="footer-powered">Propulsé par Fydelys</div>
  </div>
  <script>window.onload = () => window.print()</script>
</body>
</html>`

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}