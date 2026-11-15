import { timingSafeEqual } from "crypto"

// ── Appel de cron autorise ? (Vercel Cron : `Authorization: Bearer <CRON_SECRET>`)
//
// Jusqu'au 15/11/2026, chaque cron comparait l'en-tete a
// `Bearer ${process.env.CRON_SECRET}` :
//   - variable ABSENTE → l'en-tete attendu devenait « Bearer undefined » :
//     n'importe qui passait en l'envoyant ;
//   - /api/cron/reminders sautait meme la verification (`if (cronSecret && …)`).
// Desormais : secret absent = REFUS (et erreur journalisee), et comparaison en
// temps constant.
export function cronAutorise(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error("[cron] CRON_SECRET absente — appel refusé")
    return false
  }
  const recu = Buffer.from(req.headers.get("authorization") || "")
  const attendu = Buffer.from(`Bearer ${secret}`)
  return recu.length === attendu.length && timingSafeEqual(recu, attendu)
}
