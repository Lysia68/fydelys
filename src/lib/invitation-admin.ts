import type { SupabaseClient } from "@supabase/supabase-js"
import { sendEmail, emailProviderConfigured } from "@/lib/email"
import { invitationAdminHtml, sujetInvitationAdmin } from "@/lib/emails/invitation-admin"

// ── Invitation de l'admin d'un studio ────────────────────────────────────
//
// Utilisee par la creation d'un studio (api/sa/create-tenant) et par
// « Renvoyer l'invitation » (api/sa/resend-admin-invite).
//
// `generateLink` GENERE le lien sans l'envoyer : c'est `sendEmail()` (Brevo,
// SendGrid en secours) qui l'expedie. Jusqu'au 15/11/2026, create-tenant
// generait le lien, le jetait, et loguait « Magic link envoyé ».
//
// ⚠ PRE-REQUIS : le profil admin doit EXISTER, rattache a CE studio, avant
// l'envoi. Sur un sous-domaine, /api/verify-token ne cree jamais de profil
// admin : sans profil il cree un ADHERENT, et un profil admin rattache a un
// autre studio (ou a aucun) est RETROGRADE en adherent.
//
// ⚠ Jamais de lien, de jeton ni de hashed_token dans les logs.

export type ResultatInvitation =
  | { envoyee: true }
  | { envoyee: false; raison: string }

export function lienInvitation(hashedToken: string, slug: string): string {
  return `https://fydelys.fr/auth/confirm?token_hash=${encodeURIComponent(hashedToken)}`
    + `&type=magiclink&tenant=${encodeURIComponent(slug)}`
}

export async function envoyerInvitationAdmin(
  db: SupabaseClient,
  { email, prenom, studioName, slug }: { email: string; prenom: string; studioName: string; slug: string },
): Promise<ResultatInvitation> {
  if (!emailProviderConfigured()) {
    console.error("[invitation-admin] Aucun fournisseur d'e-mail configuré (BREVO_API_KEY et SENDGRID_API_KEY absentes) — invitation non envoyée")
    return { envoyee: false, raison: "Aucun fournisseur d'e-mail configuré (Brevo / SendGrid)." }
  }

  const { data, error } = await db.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `https://fydelys.fr/auth/confirm?tenant=${slug}` },
  })
  const hashedToken = data?.properties?.hashed_token
  if (error || !hashedToken) {
    console.error("[invitation-admin] Lien non généré :", error?.message || "hashed_token absent")
    return { envoyee: false, raison: `Lien non généré : ${error?.message || "réponse inattendue de Supabase"}` }
  }

  const envoi = await sendEmail({
    to: { email, name: prenom || email },
    subject: sujetInvitationAdmin(studioName),
    html: invitationAdminHtml({ prenom, studioName, slug, lien: lienInvitation(hashedToken, slug) }),
    fromName: "Fydelys",
  })
  if (!envoi.ok) {
    // `envoi.error` est la reponse du fournisseur, qui ne contient pas le corps du mail.
    console.error("[invitation-admin] Envoi échoué :", envoi.provider, envoi.error)
    return { envoyee: false, raison: `Envoi échoué (${envoi.provider || "fournisseur inconnu"}).` }
  }

  console.log("[invitation-admin] Invitation envoyée à", email, "via", envoi.provider)
  return { envoyee: true }
}

/**
 * Cherche un compte de connexion par e-mail, sur TOUTES les pages de
 * `listUsers` (1 000 par page). Un `find` sur la seule premiere page
 * renverrait « absent » des que la base depasse 1 000 comptes.
 */
export async function trouverCompteParEmail(db: SupabaseClient, email: string) {
  const cible = email.trim().toLowerCase()
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error(`listUsers : ${error.message}`)
    const users = data?.users || []
    const trouve = users.find(u => u.email?.toLowerCase() === cible)
    if (trouve) return trouve
    if (users.length < 1000) return null
  }
}
