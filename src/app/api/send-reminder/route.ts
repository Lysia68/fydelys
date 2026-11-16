import { NextResponse, type NextRequest } from "next/server"
import { createServiceSupabase } from "@/lib/supabase-server"
import { sendEmail, emailProviderConfigured } from "@/lib/email"
import { checkAuth } from "@/lib/auth-check"
import { exigerRole, EQUIPE } from "@/lib/roles"

export const dynamic = "force-dynamic"

// ── Rappel manuel d'une seance, depuis le planning (garde du 15/11/2026) ────
// Avant : aucune authentification, et destinataires + contenu LUS DANS LA
// REQUETE — un inconnu envoyait des mails a n'importe quelle adresse, au nom
// d'un studio, par notre fournisseur (relais de phishing).
// Appelant legitime : le PLANNING (equipe du studio) — et lui seul. Les rappels
// automatiques passent par /api/cron/reminders (CRON_SECRET), pas par ici.
// Destinataires : les inscrits CONFIRMES de la seance, relus en base. Les
// champs `members` et `sess` encore envoyes par le planning sont IGNORES.
export async function POST(request: NextRequest) {
  const { sessId, studioId } = await request.json()

  if (!sessId || !studioId) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
  }

  const auth = await checkAuth(request, studioId)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const refus = exigerRole(auth, EQUIPE)
  if (refus) return refus

  const db = createServiceSupabase()

  const { data: seance } = await db.from("sessions")
    .select("studio_id, session_date, session_time, duration_min, teacher, room")
    .eq("id", sessId).maybeSingle()
  if (!seance || seance.studio_id !== studioId)
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

  const { data: inscrits } = await db.from("bookings")
    .select("members!bookings_member_id_fkey(first_name, last_name, email, studio_id)")
    .eq("session_id", sessId).eq("status", "confirmed").not("member_id", "is", null)
  const members: { email: string; name: string }[] = (inscrits || [])
    .map((b: any) => Array.isArray(b.members) ? b.members[0] : b.members)
    .filter((m: any) => m?.email && m.studio_id === studioId)
    .map((m: any) => ({ email: m.email, name: `${m.first_name || ""} ${m.last_name || ""}`.trim() }))
  if (!members.length) return NextResponse.json({ ok: true, sent: 0, failed: 0 })

  const sess = {
    date: seance.session_date, time: seance.session_time,
    duration: seance.duration_min, teacher: seance.teacher, room: seance.room,
  }

  if (!emailProviderConfigured()) {
    console.error("[send-reminder] Aucun fournisseur d'e-mail configuré (BREVO_API_KEY et SENDGRID_API_KEY absentes) — rappel non envoyé")
    return NextResponse.json({ ok: true, simulated: true, count: members.length })
  }

  // Récupérer le nom du studio
  const { data: studio } = await db
    .from("studios")
    .select("name, slug")
    .eq("id", studioId)
    .single()

  const studioName = studio?.name || "Votre studio"
  const studioSlug = studio?.slug || ""

  // Formater la date/heure de la séance
  const sessDate = sess?.date
    ? new Date(sess.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
    : "prochainement"
  const sessTime = sess?.time?.slice(0, 5) || ""
  const sessDuration = sess?.duration ? `${sess.duration} min` : ""
  const sessTeacher = sess?.teacher ? `avec ${sess.teacher}` : ""
  const sessRoom = sess?.room || ""

  // Envoyer un email par membre
  const results = await Promise.allSettled(
    members.map(async (member: { email: string; name: string }) => {
      if (!member.email) return

      const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F4EFE8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4EFE8;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #DDD5C8;box-shadow:0 4px 24px rgba(42,31,20,.08);">
        <tr>
          <td style="background:#2A1F14;padding:28px 32px;text-align:center;">
            <div style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">${studioName}</div>
            <div style="font-size:11px;color:rgba(255,255,255,.45);margin-top:6px;text-transform:uppercase;letter-spacing:1.5px;">Rappel de séance</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px 8px;">
            <p style="font-size:16px;color:#2A1F14;font-weight:700;margin:0 0 12px;">
              Bonjour ${member.name ? member.name.split(" ")[0] : ""},
            </p>
            <p style="font-size:14px;color:#5C4A38;line-height:1.7;margin:0 0 24px;">
              Nous vous rappelons votre séance prévue chez <strong>${studioName}</strong>.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#F8F2EA;border-radius:12px;border:1px solid #DDD5C8;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <div style="font-size:13px;color:#8C7B6C;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:14px;">Détails de la séance</div>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:5px 0;font-size:13px;color:#8C7B6C;width:40%;">Date</td>
                      <td style="padding:5px 0;font-size:14px;color:#2A1F14;font-weight:700;">${sessDate}</td>
                    </tr>
                    ${sessTime ? `<tr>
                      <td style="padding:5px 0;font-size:13px;color:#8C7B6C;">Heure</td>
                      <td style="padding:5px 0;font-size:14px;color:#2A1F14;font-weight:700;">${sessTime}${sessDuration ? ` · ${sessDuration}` : ""}</td>
                    </tr>` : ""}
                    ${sessTeacher ? `<tr>
                      <td style="padding:5px 0;font-size:13px;color:#8C7B6C;">Intervenant</td>
                      <td style="padding:5px 0;font-size:14px;color:#2A1F14;font-weight:700;">${sess.teacher}</td>
                    </tr>` : ""}
                    ${sessRoom ? `<tr>
                      <td style="padding:5px 0;font-size:13px;color:#8C7B6C;">Salle</td>
                      <td style="padding:5px 0;font-size:14px;color:#2A1F14;font-weight:700;">${sessRoom}</td>
                    </tr>` : ""}
                  </table>
                </td>
              </tr>
            </table>
            <p style="font-size:13px;color:#8C7B6C;line-height:1.7;margin:0 0 24px;">
              À très bientôt sur votre tapis !
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #EDE4D8;text-align:center;">
            <p style="font-size:11px;color:#B0A090;margin:0;line-height:1.6;">
              ${studioName} · Géré avec <a href="https://fydelys.fr" style="color:#A06838;text-decoration:none;">Fydelys</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

      const result = await sendEmail({
        to: member.email,
        subject: `Rappel de séance — ${studioName}`,
        html,
        fromName: studioName,
      })
      if (!result.ok) throw new Error(result.error || "SendGrid error")
    })
  )

  const sent    = results.filter(r => r.status === "fulfilled").length
  const failed  = results.filter(r => r.status === "rejected").length

  return NextResponse.json({ ok: true, sent, failed })
}