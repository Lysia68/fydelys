import { createBrowserClient } from "@supabase/ssr"

// Placeholder pour le prerender Next.js (env vars absentes au build time)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key"

export function createClient() {
  const isProduction = typeof window !== "undefined" && window.location.hostname.includes("fydelys.fr")
  return createBrowserClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookieOptions: {
        domain: isProduction ? ".fydelys.fr" : undefined,
        sameSite: "lax",
        secure: isProduction,
        path: "/",
      },
    }
  )
}