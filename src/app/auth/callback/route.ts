import { createServerSupabase } from "@/lib/supabase-server"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code       = searchParams.get("code")
  const next       = searchParams.get("next") ?? "/dashboard"
  const isRegister = searchParams.get("register") === "1"
  const hostname   = request.headers.get("host") || ""

  const isApp       = hostname === "fydelys.fr" || hostname.includes("localhost")
  const tenantMatch = hostname.match(/^([a-z0-9-]+)\.fydelys\.fr/)
  const tenantSlug  = tenantMatch ? tenantMatch[1] : null
  const isTenant    = !!tenantSlug && !isApp

  if (!code) return NextResponse.redirect(new URL("/", request.url))

  const supabase = await createServerSupabase()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.user) return NextResponse.redirect(new URL("/?error=auth", request.url))

  const userId    = data.user.id
  const userEmail = data.user.email || ""

  // ── Profil existant → rediriger selon rôle ───────────────────────────────
  const { data: existing } = await supabase
    .from("profiles").select("id,role,studio_id").eq("id", userId).single()

  if (existing) {
    // SuperAdmin → toujours fydelys.fr
    if (existing.role === "superadmin") {
      return NextResponse.redirect(new URL("https://fydelys.fr/dashboard"))
    }
    // Admin → toujours slug.fydelys.fr (jamais app)
    if (existing.role === "admin") {
      let slugToUse: string | null = null
      if (existing.studio_id) {
        const { data: studio } = await supabase
          .from("studios").select("slug").eq("id", existing.studio_id).single()
        slugToUse = studio?.slug ?? null
      }
      // Fallback : chercher le studio par email admin
      if (!slugToUse) {
        const { data: studio } = await supabase
          .from("studios").select("id,slug").eq("email", userEmail).single()
        if (studio) {
          await supabase.from("profiles").update({ studio_id: studio.id }).eq("id", userId)
          slugToUse = studio.slug
        }
      }
      if (slugToUse) {
        return NextResponse.redirect(new URL(`https://${slugToUse}.fydelys.fr/dashboard`))
      }
    }
    // Coach / adhérent sur sous-domaine
    return NextResponse.redirect(new URL(next, request.url))
  }

  // ── SuperAdmin (première connexion) ──────────────────────────────────────
  if (userEmail === "info@lysia.fr") {
    await supabase.from("profiles").insert({ id:userId, role:"superadmin", first_name:"Super", last_name:"Admin" })
    return NextResponse.redirect(new URL("https://fydelys.fr/dashboard"))
  }

  // ── Nouveau tenant (inscription depuis fydelys.fr) ───────────────────
  if (isRegister) {
    const { data: pending } = await supabase
      .from("pending_registrations").select("data").eq("email", userEmail).single()

    if (pending?.data) {
      const r = pending.data as any

      // Vérifier que le slug n'est pas déjà pris (race condition)
      const { data: exists } = await supabase
        .from("studios").select("slug").eq("slug", r.slug).single()
      if (exists) {
        return NextResponse.redirect(new URL("https://fydelys.fr/?error=slug_taken"))
      }

      const { data: studio, error: studioErr } = await supabase.from("studios").insert({
        name:        r.studioName,
        slug:        r.slug,
        city:        r.city,
        postal_code: r.zip || null,
        address:     r.address || null,
        email:       userEmail,
        phone:       r.phone || null,
        status:      "actif",
      }).select().single()

      if (studioErr) console.error("Studio insert error:", JSON.stringify(studioErr))

      if (studio) {
        await supabase.from("profiles").insert({
          id:         userId,
          role:       "admin",
          studio_id:  studio.id,
          first_name: r.firstName || "",
          last_name:  r.lastName  || "",
          is_coach:   r.isCoach   || false,
        })
        // seed_new_tenant peut échouer silencieusement — on log mais on continue
        const { error: seedErr } = await supabase.rpc("seed_new_tenant", {
          p_studio_id: studio.id,
          p_type:      r.type || "Multi",
        })
        if (seedErr) console.error("Seed error:", JSON.stringify(seedErr))

        await supabase.from("pending_registrations").delete().eq("email", userEmail)
        return NextResponse.redirect(new URL(`https://${studio.slug}.fydelys.fr/dashboard`))
      }
    }

    // Fallback si pas de pending (ne devrait pas arriver)
    console.error("No pending registration found for:", userEmail)
    return NextResponse.redirect(new URL("https://fydelys.fr/?error=no_pending"))
  }

  // ── Adhérent ou Coach sur sous-domaine ───────────────────────────────────
  if (isTenant) {
    const { data: studio } = await supabase
      .from("studios").select("id").eq("slug", tenantSlug).single()

    if (studio) {
      const { data: invite } = await supabase.from("invitations")
        .select("role").eq("email", userEmail).eq("studio_id", studio.id)
        .eq("used", false).gt("expires_at", new Date().toISOString()).single()

      const role = invite ? (invite.role as string) : "adherent"

      await supabase.from("profiles").insert({
        id:         userId,
        role,
        studio_id:  studio.id,
        first_name: data.user.user_metadata?.first_name || "",
        last_name:  data.user.user_metadata?.last_name  || "",
      })

      if (invite) {
        await supabase.from("invitations").update({ used:true })
          .eq("email", userEmail).eq("studio_id", studio.id)
      }

      if (role === "adherent") {
        const { data: existingM } = await supabase.from("members")
          .select("id").eq("studio_id", studio.id).eq("email", userEmail).single()
        if (!existingM) {
          await supabase.from("members").insert({
            studio_id:    studio.id,
            auth_user_id: userId,
            first_name:   data.user.user_metadata?.first_name || "Nouveau",
            last_name:    data.user.user_metadata?.last_name  || "Membre",
            email:        userEmail,
            status:       "nouveau",
            credits:      0,
            credits_total: 0,
          })
        } else {
          await supabase.from("members").update({ auth_user_id: userId })
            .eq("studio_id", studio.id).eq("email", userEmail)
        }
      }
    }
  }

  return NextResponse.redirect(new URL(next, request.url))
}
