// ── Modele du mail d'invitation de l'admin d'un nouveau studio ───────────
//
// Envoye au nom de FYDELYS (pas du studio) : le destinataire est notre
// client, le gerant qui vient d'ouvrir son espace. Meme charte que les mails
// d'invite-coach et de send-magic-link.
//
// Toutes les valeurs saisies (prenom, nom du studio) sont echappees : elles
// viennent d'un formulaire et finissent dans du HTML.

export type InvitationAdmin = {
  prenom: string
  studioName: string
  slug: string
  lien: string
}

function echapper(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function sujetInvitationAdmin(studioName: string): string {
  return `Votre espace ${studioName} est prêt — Fydelys`
}

export function invitationAdminHtml({ prenom, studioName, slug, lien }: InvitationAdmin): string {
  const p = echapper(prenom || "")
  const studio = echapper(studioName)
  const lienHtml = echapper(lien)
  const pageLogin = `https://${echapper(slug)}.fydelys.fr/login`

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F4EFE8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4EFE8;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #DDD5C8;box-shadow:0 4px 24px rgba(42,31,20,.08);">
        <tr>
          <td style="background:#2A1F14;padding:28px 32px;text-align:center;">
            <div style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Fydelys</div>
            <div style="font-size:11px;color:rgba(255,255,255,.45);margin-top:6px;text-transform:uppercase;letter-spacing:1.5px;">Bienvenue</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px 24px;">
            <p style="font-size:16px;color:#2A1F14;font-weight:700;margin:0 0 12px;">Bonjour${p ? ` ${p}` : ""},</p>
            <p style="font-size:14px;color:#5C4A38;line-height:1.7;margin:0 0 20px;">
              L'espace de gestion de <strong>${studio}</strong> est prêt.
              Cliquez sur le bouton ci-dessous pour vous connecter — aucun mot de passe n'est nécessaire.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
              <tr>
                <td align="center" bgcolor="#9A6030" style="border-radius:12px;">
                  <a href="${lienHtml}"
                    style="display:inline-block;padding:14px 32px;background-color:#9A6030;color:#ffffff;text-decoration:none;border-radius:12px;font-size:15px;font-weight:700;letter-spacing:-0.2px;font-family:Arial,sans-serif;">
                    Accéder à mon espace &rarr;
                  </a>
                </td>
              </tr>
            </table>
            <p style="font-size:12px;color:#8C7B6C;line-height:1.6;margin:0;">
              Ce lien est valable 1 heure. Passé ce délai, demandez un nouveau lien sur
              <a href="${pageLogin}" style="color:#A06838;">${pageLogin}</a>.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 24px;">
            <div style="background:#F8F3EE;border-radius:8px;padding:12px 14px;border:1px solid #EDE4D8;">
              <p style="font-size:11px;color:#8C7B6C;margin:0 0 4px;">Lien si le bouton ne fonctionne pas :</p>
              <p style="font-size:11px;color:#A06838;margin:0;word-break:break-all;">${lienHtml}</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #EDE4D8;text-align:center;">
            <p style="font-size:11px;color:#B0A090;margin:0;line-height:1.6;">
              Si vous n'attendiez pas ce message, vous pouvez l'ignorer.<br>
              <a href="https://fydelys.fr" style="color:#A06838;text-decoration:none;">Fydelys</a> — gestion de studios
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
