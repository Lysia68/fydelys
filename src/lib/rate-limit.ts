/**
 * Rate limiter simple en mémoire (par instance serverless Vercel)
 * Suffisant pour bloquer les abus basiques. Pour une protection complète,
 * utiliser Vercel WAF ou un Redis externe.
 */

const hits = new Map<string, { count: number; resetAt: number }>()

// Nettoyer les entrées expirées périodiquement
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of hits) {
    if (now > val.resetAt) hits.delete(key)
  }
}, 60000)

interface RateLimitOpts {
  /** Nombre max de requêtes par fenêtre */
  max?: number
  /** Fenêtre en secondes */
  windowSec?: number
}

interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfterSec: number
}

/**
 * Vérifie si une IP/clé a dépassé le rate limit
 * @param key - identifiant unique (IP, userId, studioId...)
 * @param opts - configuration
 */
export function rateLimit(key: string, opts: RateLimitOpts = {}): RateLimitResult {
  const { max = 60, windowSec = 60 } = opts
  const now = Date.now()
  const windowMs = windowSec * 1000

  let entry = hits.get(key)
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs }
    hits.set(key, entry)
  }

  entry.count++

  if (entry.count > max) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000)
    return { ok: false, remaining: 0, retryAfterSec }
  }

  return { ok: true, remaining: max - entry.count, retryAfterSec: 0 }
}

/**
 * Extraire l'IP d'une requête Next.js
 */
export function getIP(req: Request): string {
  const forwarded = (req.headers as any).get?.("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  const real = (req.headers as any).get?.("x-real-ip")
  return real || "unknown"
}
