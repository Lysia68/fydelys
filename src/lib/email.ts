/**
 * Helper centralisé pour l'envoi d'emails via SendGrid.
 * - Adresse from unifiée : noreply@fydelys.fr
 * - Toujours text/plain + text/html (anti-spam)
 * - Header List-Unsubscribe (requis Outlook/Gmail)
 * - Stripping emojis du sujet et du body (anti-spam)
 */

const SENDGRID_URL = "https://api.sendgrid.com/v3/mail/send"
const FROM_EMAIL = "noreply@fydelys.fr"

type SendEmailOptions = {
  to: string | { email: string; name?: string }
  subject: string
  html: string
  fromName?: string
  replyTo?: { email: string; name?: string }
}

/** Supprime les emojis d'une chaîne */
function stripEmojis(str: string): string {
  return str
    .replace(/[\u{1F600}-\u{1F64F}]/gu, "")  // emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, "")  // symbols & pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, "")  // transport & map
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, "")  // supplemental
    .replace(/[\u{2600}-\u{26FF}]/gu, "")    // misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, "")    // dingbats
    .replace(/[\u{FE00}-\u{FE0F}]/gu, "")    // variation selectors
    .replace(/[\u{200D}]/gu, "")              // zero width joiner
    .replace(/[\u{20E3}]/gu, "")              // combining enclosing keycap
    .replace(/[\u{E0020}-\u{E007F}]/gu, "")  // tags
}

/** Extrait le texte brut d'un HTML email */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/td>/gi, " ")
    .replace(/<hr[^>]*>/gi, "---\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&rarr;/gi, "→")
    .replace(/&#?\w+;/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export async function sendEmail({ to, subject, html, fromName, replyTo }: SendEmailOptions): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey) return { ok: false, error: "SENDGRID_API_KEY manquante" }

  const toObj = typeof to === "string" ? { email: to } : to

  // Nettoyer emojis du sujet et du HTML
  const cleanSubject = stripEmojis(subject).replace(/\s{2,}/g, " ").trim()
  const cleanHtml = stripEmojis(html)
  const plainText = stripEmojis(htmlToPlainText(html))

  const body: any = {
    personalizations: [{ to: [toObj], subject: cleanSubject }],
    from: { email: FROM_EMAIL, name: fromName || "Fydelys" },
    content: [
      { type: "text/plain", value: plainText },
      { type: "text/html", value: cleanHtml },
    ],
    headers: {
      "List-Unsubscribe": `<mailto:${FROM_EMAIL}?subject=unsubscribe>`,
    },
  }

  if (replyTo) body.reply_to = replyTo

  const res = await fetch(SENDGRID_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error("SendGrid error:", err)
    return { ok: false, error: err }
  }

  return { ok: true }
}
