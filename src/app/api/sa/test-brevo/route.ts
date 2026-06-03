import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase-server"
import { sendEmail } from "@/lib/email"

export const dynamic = "force-dynamic"

// GET /api/sa/test-brevo?email=test@free.fr
// Envoie un email de test et indique quel provider (Brevo/SendGrid) a réellement servi.
// Réservé superadmin.
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    const db = createServiceSupabase()
    const { data: profile } = await db.from("profiles").select("role").eq("id", user.id).single()
    if (profile?.role !== "superadmin")
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

    const email = req.nextUrl.searchParams.get("email")
    if (!email) return NextResponse.json({ error: "Paramètre ?email= requis" }, { status: 400 })

    const domain = email.slice(email.lastIndexOf("@") + 1).toLowerCase()
    const brevoKeyPresent = !!process.env.BREVO_API_KEY

    const result = await sendEmail({
      to: email,
      subject: `Test routage email Fydelys — ${domain}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:40px auto;padding:32px;background:#F8F2EA;border-radius:12px;">
          <h2 style="color:#2A1F14;margin:0 0 12px;">Email de test Fydelys</h2>
          <p style="color:#5C4A38;">Si vous recevez ce message sur <strong>${domain}</strong>, le routage de délivrabilité fonctionne.</p>
          <p style="color:#5C4A38;">Le provider utilisé est indiqué dans les en-têtes (DKIM signature).</p>
          <hr style="border:none;border-top:1px solid #DDD5C8;margin:20px 0;">
          <p style="font-size:12px;color:#B0A090;">Envoyé depuis <a href="https://fydelys.fr" style="color:#A06838;">Fydelys</a> — test Super Admin</p>
        </div>
      `,
    })

    return NextResponse.json({
      ok: result.ok,
      email,
      domain,
      providerUtilise: result.provider,        // "brevo" ou "sendgrid"
      brevoKeyPresent,
      error: result.error || null,
      hint: !brevoKeyPresent
        ? "BREVO_API_KEY absente → tout passe par SendGrid. Pose la variable dans Vercel et redéploie."
        : result.provider === "brevo"
          ? "OK : ce domaine a bien été routé vers Brevo."
          : "Ce domaine n'est pas dans FRENCH_ISP_DOMAINS (ou repli depuis Brevo) → SendGrid.",
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
