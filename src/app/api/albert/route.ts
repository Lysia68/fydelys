import { NextRequest, NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"
import { checkAuth } from "@/lib/auth-check"
import { exigerRole, EQUIPE } from "@/lib/roles"
import { createServiceSupabase } from "@/lib/supabase-server"
import { consommerQuota } from "@/lib/quota"

export const dynamic = "force-dynamic"

const SYSTEM_PROMPT = `Tu es Albert, l'assistant IA de Fydelys, une plateforme SaaS de gestion de studios de yoga, pilates et bien-être.

Tu es un vieux monsieur sympathique, patient et bienveillant. Tu parles en français avec un ton chaleureux et professionnel.

Tu aides les administrateurs de studios à utiliser Fydelys :
- Planning : créer/annuler des séances, récurrences, fermetures
- Membres : ajouter, modifier, suspendre, packs, crédits
- Paiements : Stripe, paiements manuels, export
- Paramètres : salles, équipe, SMS, site vitrine
- Réservations : inscrire des membres, liste d'attente, présences

Règles :
- Réponds de manière concise (3-5 phrases max)
- Si tu ne connais pas la réponse exacte, guide l'utilisateur vers la bonne section de l'app
- Ne parle JAMAIS de code, de base de données, d'API ou de technique
- Si la question n'est pas liée à Fydelys, dis gentiment que tu ne peux aider que sur Fydelys
- Termine par une phrase encourageante quand c'est pertinent`

// ── Acces et limites (16/11/2026) ─────────────────────────────────────────
// Albert n'est affiche que dans l'Aide de la console EQUIPE. Avant : ouvert
// sans compte, avec une limite en memoire (par instance serverless) — n'importe
// qui pouvait consommer la cle Anthropic.
//   - equipe du studio uniquement (checkAuth + exigerRole EQUIPE) ;
//   - quota PAR STUDIO, partage entre instances (fonction SQL consommer_quota) :
//     QUOTA_COURT questions par 10 min, QUOTA_JOUR par jour ; si le compteur
//     est indisponible (migration non appliquee), repli sur la limite en
//     memoire par compte ;
//   - question et historique plafonnes ; nom du studio lu en BASE (il etait
//     lu dans la requete et injecte dans le prompt systeme).
const QUOTA_COURT = { fenetreSec: 600, max: 20 }
const QUOTA_JOUR = { fenetreSec: 86_400, max: 100 }
const MAX_QUESTION = 2000      // caracteres
const MAX_HISTORIQUE = 10      // messages
const MAX_MESSAGE = 2000       // caracteres par message d'historique
const LIMITE_ATTEINTE = "Doucement, je suis un vieux monsieur ! Votre studio m'a posé beaucoup de questions : reposez-moi la vôtre un peu plus tard, ou consultez les sections d'aide ci-dessous."

export async function POST(req: NextRequest) {
  const auth = await checkAuth(req)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const refus = exigerRole(auth, EQUIPE)
  if (refus) return refus
  const studioId: string | null = (auth as any).studioId || null
  if (!studioId) return NextResponse.json({ error: "Studio introuvable" }, { status: 403 })

  try {
    const { question, history } = await req.json()
    if (!question || typeof question !== "string") return NextResponse.json({ error: "Question requise" }, { status: 400 })
    if (question.length > MAX_QUESTION)
      return NextResponse.json({ answer: `Votre question est un peu longue pour moi : pouvez-vous la résumer en moins de ${MAX_QUESTION} caractères ?` }, { status: 400 })

    const db = createServiceSupabase()

    // Quota par studio, partage entre instances ; repli en memoire si le compteur manque.
    for (const [nom, q] of [["10min", QUOTA_COURT], ["jour", QUOTA_JOUR]] as const) {
      const r = await consommerQuota(db, `albert:${studioId}:${nom}`, q.fenetreSec, q.max)
      if (r === "depasse") return NextResponse.json({ answer: LIMITE_ATTEINTE }, { status: 429 })
      if (r === "indisponible") {
        const rl = rateLimit(`albert:${(auth as any).user?.id}`, { max: 10, windowSec: 60 })
        if (!rl.ok) return NextResponse.json({ answer: LIMITE_ATTEINTE }, { status: 429 })
        break
      }
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ answer: "Je suis en cours de configuration. En attendant, consultez les sections ci-dessous ou contactez le support via le formulaire." })
    }

    const { data: studio } = await db.from("studios").select("name").eq("id", studioId).maybeSingle()
    const studioName: string = (studio as any)?.name || ""

    // Construire les messages avec l'historique (plafonne : nombre et longueur)
    const messages: any[] = []
    if (Array.isArray(history)) {
      history.slice(-MAX_HISTORIQUE).forEach((m: any) => {
        if (typeof m?.text !== "string" || !m.text) return
        messages.push({ role: m.role === "user" ? "user" : "assistant", content: m.text.slice(0, MAX_MESSAGE) })
      })
    }
    // L'API exige un premier message « user » : on retire les reponses d'Albert en tete.
    while (messages.length && messages[0].role !== "user") messages.shift()
    messages.push({ role: "user", content: question })

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        system: SYSTEM_PROMPT + (studioName ? `\n\nLe studio actuel s'appelle "${studioName}".` : ""),
        messages,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error("[albert] Claude API error:", res.status, err)
      return NextResponse.json({ answer: "Je rencontre un petit souci technique. Réessayez dans quelques instants ou consultez les sections d'aide ci-dessous." })
    }

    const data = await res.json()
    const answer = data.content?.[0]?.text || "Je n'ai pas pu formuler une réponse. Essayez de reformuler votre question."

    return NextResponse.json({ answer })
  } catch (err: any) {
    console.error("[albert] error:", err.message)
    return NextResponse.json({ answer: "Oups, une erreur s'est produite. Réessayez dans quelques instants." })
  }
}
