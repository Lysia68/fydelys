import { NextRequest, NextResponse } from "next/server"
import { rateLimit, getIP } from "@/lib/rate-limit"

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

export async function POST(req: NextRequest) {
  // Rate limit : max 10 questions/min par IP (protège le coût API Claude)
  const rl = rateLimit(getIP(req), { max: 10, windowSec: 60 })
  if (!rl.ok) return NextResponse.json({ answer: "Doucement, je suis un vieux monsieur ! Attendez quelques instants avant de me reposer une question." })

  try {
    const { question, studioName, history } = await req.json()
    if (!question) return NextResponse.json({ error: "Question requise" }, { status: 400 })

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ answer: "Je suis en cours de configuration. En attendant, consultez les sections ci-dessous ou contactez le support via le formulaire." })
    }

    // Construire les messages avec l'historique
    const messages: any[] = []
    if (history?.length) {
      history.forEach((m: any) => {
        messages.push({ role: m.role === "user" ? "user" : "assistant", content: m.text })
      })
    }
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
