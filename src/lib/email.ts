/**
 * Helper centralisé pour l'envoi d'emails — routage hybride SendGrid / Brevo.
 *
 * Pourquoi : les FAI grand public français (Free, Orange, SFR, La Poste…)
 * blacklistent les IP mutualisées SendGrid → mails bloqués. On route donc
 * ces destinataires vers Brevo (ESP français mieux peeré avec ces FAI),
 * et tout le reste (Gmail, Outlook, domaines pro…) reste sur SendGrid.
 *
 * - Adresse from unifiée : noreply@fydelys.fr
 * - Toujours text/plain + text/html (anti-spam)
 * - Header List-Unsubscribe (requis Outlook/Gmail)
 * - Stripping emojis du sujet et du body (anti-spam)
 *
 * Config requise : SENDGRID_API_KEY + BREVO_API_KEY.
 * Si BREVO_API_KEY est absente, tout repart sur SendGrid (dégradation propre).
 */

const SENDGRID_URL = "https://api.sendgrid.com/v3/mail/send"
const BREVO_URL = "https://api.brevo.com/v3/smtp/email"
const FROM_EMAIL = "noreply@fydelys.fr"
const FROM_NAME_DEFAULT = "Fydelys"
const UNSUBSCRIBE_HEADER = `<mailto:${FROM_EMAIL}?subject=unsubscribe>`

/**
 * Domaines de FAI grand public français qui blacklistent les IP mutualisées
 * SendGrid → on les route vers Brevo. (Gmail/Outlook/domaines pro restent SendGrid.)
 */
const FRENCH_ISP_DOMAINS = new Set([
  // Free
  "free.fr", "freebox.fr", "aliceadsl.fr", "alice.fr",
  // Orange
  "orange.fr", "wanadoo.fr",
  // SFR
  "sfr.fr", "neuf.fr", "cegetel.net", "club-internet.fr", "numericable.fr", "noos.fr",
  // Bouygues
  "bbox.fr", "bouyguetelecom.fr",
  // La Poste
  "laposte.net",
])

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

/** Domaine (minuscule) extrait d'une adresse email */
function domainOf(email: string): string {
  const at = email.lastIndexOf("@")
  return at === -1 ? "" : email.slice(at + 1).toLowerCase().trim()
}

type Prepared = {
  toObj: { email: string; name?: string }
  subject: string
  html: string
  text: string
  fromName: string
  replyTo?: { email: string; name?: string }
}

type SendResult = { ok: boolean; error?: string; provider?: "sendgrid" | "brevo" }

/** Envoi via SendGrid (HTTP API v3) */
async function sendViaSendGrid(p: Prepared): Promise<SendResult> {
  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey) return { ok: false, error: "SENDGRID_API_KEY manquante", provider: "sendgrid" }

  const body: any = {
    personalizations: [{ to: [p.toObj], subject: p.subject }],
    from: { email: FROM_EMAIL, name: p.fromName },
    content: [
      { type: "text/plain", value: p.text },
      { type: "text/html", value: p.html },
    ],
    headers: { "List-Unsubscribe": UNSUBSCRIBE_HEADER },
  }
  if (p.replyTo) body.reply_to = p.replyTo

  const res = await fetch(SENDGRID_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error("SendGrid error:", err)
    return { ok: false, error: err, provider: "sendgrid" }
  }
  return { ok: true, provider: "sendgrid" }
}

/** Envoi via Brevo (Transactional Email API v3) */
async function sendViaBrevo(p: Prepared): Promise<SendResult> {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) return { ok: false, error: "BREVO_API_KEY manquante", provider: "brevo" }

  const body: any = {
    sender: { email: FROM_EMAIL, name: p.fromName },
    to: [p.toObj],
    subject: p.subject,
    htmlContent: p.html,
    textContent: p.text,
    headers: { "List-Unsubscribe": UNSUBSCRIBE_HEADER },
  }
  if (p.replyTo) body.replyTo = p.replyTo

  const res = await fetch(BREVO_URL, {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error("Brevo error:", err)
    return { ok: false, error: err, provider: "brevo" }
  }
  return { ok: true, provider: "brevo" }
}

export async function sendEmail({ to, subject, html, fromName, replyTo }: SendEmailOptions): Promise<SendResult> {
  const toObj = typeof to === "string" ? { email: to } : to

  // Nettoyage anti-spam (mutualisé entre les deux providers)
  const prepared: Prepared = {
    toObj,
    subject: stripEmojis(subject).replace(/\s{2,}/g, " ").trim(),
    html: stripEmojis(html),
    text: stripEmojis(htmlToPlainText(html)),
    fromName: fromName || FROM_NAME_DEFAULT,
    replyTo,
  }

  // Routage : FAI grand public français → Brevo (si configuré), sinon SendGrid.
  const isFrenchISP = FRENCH_ISP_DOMAINS.has(domainOf(toObj.email))
  const useBrevo = isFrenchISP && !!process.env.BREVO_API_KEY

  if (useBrevo) {
    const r = await sendViaBrevo(prepared)
    // Si Brevo échoue (clé invalide, quota…), repli sur SendGrid pour ne pas perdre le mail.
    if (r.ok) return r
    console.warn("[email] Brevo a échoué, repli SendGrid:", r.error)
  }
  return sendViaSendGrid(prepared)
}
