// ── Codes d'erreur de connexion → message affiche sur /login ──────────────
//
// Le parcours : /auth/confirm appelle /api/verify-token ; en cas d'echec il
// redirige vers /login?error=<code>, et la page de connexion traduit le code.
// Jusqu'au 15/11/2026, /auth/confirm envoyait TOUJOURS « lien_expire » : un
// compte refuse parce qu'il appartient a l'equipe d'un autre studio lisait
// « Ce lien de connexion a expiré », ce qui l'envoyait redemander un lien
// qui serait refuse de la meme facon.

export const MESSAGES_CONNEXION: Record<string, string> = {
  lien_expire: "Ce lien de connexion a expiré ou a déjà été utilisé. Entrez votre email pour recevoir un nouveau lien.",
  compte_suspendu: "Votre compte a été suspendu. Contactez votre studio pour plus d'informations.",
  compte_supprime: "Ce compte n'existe plus. Contactez votre studio pour plus d'informations.",
  autre_studio: "Ce compte fait partie de l'équipe d'un autre studio. Connectez-vous depuis l'adresse de votre studio, ou utilisez une autre adresse e-mail pour celui-ci.",
}

/** Message a afficher pour un code recu dans `?error=` ; null si aucun code. */
export function messageErreurConnexion(code: string | null): string | null {
  if (!code) return null
  return MESSAGES_CONNEXION[code] ?? "Erreur de connexion. Veuillez réessayer."
}

/** Code a transmettre a /login apres un echec de /api/verify-token. */
export function codeApresEchecVerification(reponse: { code?: string } | null | undefined): string {
  return reponse?.code === "autre_studio" ? "autre_studio" : "lien_expire"
}
