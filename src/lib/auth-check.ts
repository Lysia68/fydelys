import { createServerClient } from "@supabase/ssr"
import { createServiceSupabase } from "./supabase-server"
import { NextRequest } from "next/server"

/**
 * Vérifie que l'utilisateur est authentifié et retourne son studio_id.
 * Pour les routes admin, vérifie aussi que le studioId demandé correspond.
 */
export async function checkAuth(req: NextRequest, requiredStudioId?: string) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié", status: 401 }

  const db = createServiceSupabase()
  const { data: profile } = await db.from("profiles")
    .select("studio_id, role").eq("id", user.id).single()

  if (!profile) return { error: "Profil introuvable", status: 403 }

  // SuperAdmin a accès à tout
  if (profile.role === "superadmin") {
    return { user, profile, studioId: requiredStudioId || profile.studio_id }
  }

  // Vérifier que le studioId demandé correspond au studio du user
  if (requiredStudioId && profile.studio_id !== requiredStudioId) {
    return { error: "Accès refusé — studio non autorisé", status: 403 }
  }

  return { user, profile, studioId: profile.studio_id }
}
