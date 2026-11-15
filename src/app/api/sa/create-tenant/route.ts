import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase-server"
import { envoyerInvitationAdmin, trouverCompteParEmail } from "@/lib/invitation-admin"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    // Vérifier que l'appelant est superadmin
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const db = createServiceSupabase()
    const { data: profile } = await db
      .from("profiles").select("role").eq("id", user.id).single()
    if (profile?.role !== "superadmin")
      return NextResponse.json({ error: "Accès refusé — superadmin uniquement" }, { status: 403 })

    const body = await req.json()
    console.log("[create-tenant] Body reçu:", JSON.stringify(body))
    const {
      studioName, slug, city, zip, address, type, email, phone,
      firstName, lastName, isCoach, plan,
      payment_mode, stripe_connect_enabled,
    } = body

    if (!studioName || !slug || !email)
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 })

    if (!firstName?.trim() || !lastName?.trim())
      return NextResponse.json({ error: "Prénom et nom de l'admin sont obligatoires" }, { status: 400 })

    // Vérifier que le slug est libre
    const { data: existing } = await db.from("studios").select("id").eq("slug", slug).maybeSingle()
    if (existing) return NextResponse.json({ error: "Ce sous-domaine est déjà pris" }, { status: 409 })

    // ── L'e-mail de l'admin ne doit appartenir a AUCUN compte existant ──
    // Verifie AVANT de creer quoi que ce soit. Un compte = un profil
    // (`profiles.id` = id du compte) = un seul studio : rattacher un compte
    // existant a ce nouveau studio lui ferait perdre l'autre, ou le ferait
    // retrograder en adherent par /api/verify-token. Jusqu'au 15/11/2026, le
    // studio etait cree d'abord, et l'echec de `createUser` ne laissait qu'un
    // avertissement — un studio sans admin.
    const compteExistant = await trouverCompteParEmail(db, email)
    if (compteExistant) {
      return NextResponse.json({
        error: `L'adresse ${email} est déjà associée à un compte Fydelys. Un compte ne peut administrer qu'un seul studio : utilisez une autre adresse pour l'admin de ce studio.`,
      }, { status: 409 })
    }

    // Période de trial : 30 jours
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 30)

    // Créer le studio
    const { data: studio, error: studioErr } = await db.from("studios").insert({
      name:            studioName,
      slug,
      city:            city || null,
      postal_code:     zip || null,
      address:         address || null,
      email,
      phone:           phone || null,
      status:          "actif",
      plan_slug:       plan?.toLowerCase() || "essentiel",
      billing_status:  "trialing",
      trial_ends_at:   trialEndsAt.toISOString().slice(0, 10),
      plan_started_at: new Date().toISOString(),
      payment_mode:    payment_mode || "none",
      stripe_connect_enabled: stripe_connect_enabled || false,
    }).select().single()

    if (studioErr || !studio) {
      console.error("[create-tenant] Erreur création studio:", studioErr?.message)
      return NextResponse.json({ error: studioErr?.message || "Erreur création studio" }, { status: 500 })
    }

    console.log("[create-tenant] Studio créé:", studio.id, studio.slug)

    // Seed disciplines + abonnements + salle
    const { error: seedErr } = await db.rpc("seed_new_tenant", {
      p_studio_id: studio.id,
      p_type:      type || "Yoga",
    })
    if (seedErr) {
      console.error("[create-tenant] Erreur seed:", seedErr.message)
      // On continue malgré l'erreur de seed — le studio est créé
    } else {
      console.log("[create-tenant] Seed OK")
    }

    // Créer le compte Auth pour l'admin du studio
    const { data: authData, error: authErr } = await db.auth.admin.createUser({
      email,
      // `createUser` (API admin) n'envoie AUCUN e-mail, confirmation comprise :
      // le compte est seulement cree, non confirme.
      email_confirm: false,
      user_metadata: {
        first_name: firstName,
        last_name:  lastName,
      },
    })

    if (authErr || !authData?.user) {
      // Ne devrait plus arriver (e-mail verifie plus haut) sauf course entre
      // deux creations, ou refus de Supabase (adresse invalide…).
      console.error("[create-tenant] Erreur création user auth:", authErr?.message)
      return NextResponse.json({
        ok: true,
        studioId: studio.id,
        slug: studio.slug,
        invitationEnvoyee: false,
        warning: `Studio créé, mais le compte de l'admin n'a pas pu être créé (${authErr?.message || "raison inconnue"}). Aucune invitation n'est partie.`,
      })
    }

    const authUserId = authData.user.id
    console.log("[create-tenant] Auth user créé:", authUserId)

    // Créer le profil admin — `upsert` et non `insert` : si un declencheur
    // sur auth.users a deja cree une ligne pour ce compte (l'ancien
    // `handle_new_user` en creait une, role admin SANS studio), un `insert`
    // echouerait, et au premier clic /api/verify-token retrograderait l'admin
    // en adherent. Sans risque ici : ce compte vient d'etre cree ci-dessus.
    const { error: profileErr } = await db.from("profiles").upsert({
      id:         authUserId,
      studio_id:  studio.id,
      role:       "admin",
      first_name: firstName,
      last_name:  lastName,
      is_coach:   isCoach || false,
    }, { onConflict: "id" })
    if (profileErr) {
      // Pas d'invitation sans profil admin : le lien creerait un ADHERENT.
      console.error("[create-tenant] Erreur création profil:", profileErr.message)
      return NextResponse.json({
        ok: true,
        studioId: studio.id,
        slug: studio.slug,
        adminId: authUserId,
        invitationEnvoyee: false,
        warning: `Studio et compte créés, mais le profil admin n'a pas pu être enregistré (${profileErr.message}). Invitation NON envoyée : le lien aurait ouvert un compte adhérent.`,
      })
    }
    console.log("[create-tenant] Profil admin créé")

    // ── Invitation : lien genere PUIS envoye (Brevo, SendGrid en secours) ──
    const invitation = await envoyerInvitationAdmin(db, {
      email, prenom: firstName, studioName, slug: studio.slug,
    })

    return NextResponse.json({
      ok: true,
      studioId: studio.id,
      slug: studio.slug,
      adminId: authUserId,
      invitationEnvoyee: invitation.envoyee,
      // `=== false` : seul retrecissement possible sans strictNullChecks.
      ...(invitation.envoyee === false ? {
        warning: `Studio créé, mais l'invitation n'est pas partie : ${invitation.raison} Utilisez « Renvoyer l'invitation ».`,
      } : {}),
    })

  } catch (err: any) {
    console.error("SA create-tenant error:", err?.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}