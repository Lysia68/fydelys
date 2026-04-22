import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

const YOGALATESTUDIO_SLUG = "yogalatestudio"

// POST /api/yogalatestudio-vo-subs { emails: string[] }
// Retourne les abonnements VideosOnline pour les emails fournis.
// Accès : admin/superadmin. Pour admin, doit appartenir au studio yogalatestudio.
export async function POST(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll() {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  // Vérifier le rôle + studio
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, studio_id")
    .eq("id", user.id)
    .maybeSingle()
  if (!profile) return NextResponse.json({ error: "Profil manquant" }, { status: 403 })

  let authorized = false
  if (profile.role === "superadmin") {
    authorized = true
  } else if (profile.role === "admin" && profile.studio_id) {
    const { data: studio } = await supabase
      .from("studios")
      .select("slug")
      .eq("id", profile.studio_id)
      .maybeSingle()
    if (studio?.slug === YOGALATESTUDIO_SLUG) authorized = true
  }
  if (!authorized) return NextResponse.json({ error: "Accès refusé" }, { status: 403 })

  const { emails } = await req.json()
  if (!Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json({ subs: [] })
  }
  const cleaned = emails.map(e => String(e).toLowerCase()).filter(Boolean).slice(0, 500)

  // Query via service role pour bypass la RLS self-only
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { data } = await admin
    .from("vo_members")
    .select("email, subscription_plan, subscription_status")
    .in("email", cleaned)

  return NextResponse.json({ subs: data || [] })
}
