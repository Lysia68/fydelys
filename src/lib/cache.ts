import { NextResponse } from "next/server"

/**
 * Ajoute des headers de cache à une réponse API
 * - s-maxage : durée du cache CDN Vercel (en secondes)
 * - stale-while-revalidate : sert le cache périmé pendant le refresh en arrière-plan
 * - private pour les données utilisateur, public pour les données studio
 */
export function withCache(data: any, opts: { maxAge?: number; swr?: number; isPrivate?: boolean; status?: number } = {}) {
  const { maxAge = 30, swr = 60, isPrivate = false, status = 200 } = opts
  const res = NextResponse.json(data, { status })
  const scope = isPrivate ? "private" : "public"
  res.headers.set("Cache-Control", `${scope}, s-maxage=${maxAge}, stale-while-revalidate=${swr}`)
  return res
}

/**
 * Cache en mémoire simple pour les API routes (par instance serverless)
 * TTL en millisecondes
 */
const memCache = new Map<string, { data: any; expires: number }>()

export function getMemCache<T>(key: string): T | null {
  const entry = memCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expires) { memCache.delete(key); return null }
  return entry.data as T
}

export function setMemCache(key: string, data: any, ttlMs: number = 30000) {
  memCache.set(key, { data, expires: Date.now() + ttlMs })
  // Limiter la taille du cache (éviter les fuites mémoire)
  if (memCache.size > 500) {
    const oldest = memCache.keys().next().value
    if (oldest) memCache.delete(oldest)
  }
}
