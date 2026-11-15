import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase-server"
import { envoyerInvitationAdmin } from "@/lib/invitation-admin"

export const dynamic = "force-dynamic"

// POST /api/sa/resend-admin-invite { studioId } — super-admin uniquement.
//
// Renvoie l'invitation a l'admin d'un studio : nouveau lien (l'ancien expire
// au bout d'une heure), meme modele de mail que la creation du studio.
//
// L'admin est retrouve par son PROFIL (role admin, rattache a ce studio), et
// non par `studios.email` : c'est le profil qui decide de ce que le lien
// ouvrira (cf. lib/invitation-admin.ts).
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const db = createServiceSupabase()
    const { data: caller } = await db.from("profiles").select("role").eq("id", user.id).single()
    if (caller?.role !== "superadmin")
      return NextResponse.json({ error: "Accès refusé — superadmin uniquement" }, { status: 403 })

    const { studioId } = await req.json()
    if (!studioId) return NextResponse.json({ error: "studioId requis" }, { status: 400 })

    const { data: studio } = await db.from("studios").select("id, name, slug").eq("id", studioId).single()
    if (!studio) return NextResponse.json({ error: "Studio introuvable" }, { status: 404 })

    const { data: admins, error: adminErr } = await db.from("profiles")
      .select("id, first_name")
      .eq("studio_id", studio.id)
      .eq("role", "admin")
      .order("created_at")
      .limit(1)
    if (adminErr) return NextResponse.json({ error: adminErr.message }, { status: 500 })
    const admin = admins?.[0]
    if (!admin) {
      return NextResponse.json({
        error: "Ce studio n'a aucun profil admin : impossible d'envoyer une invitation (le lien ouvrirait un compte adhérent).",
      }, { status: 409 })
    }

    const { data: compte } = await db.auth.admin.getUserById(admin.id)
    const email = compte?.user?.email
    if (!email) return NextResponse.json({ error: "Compte de l'admin introuvable" }, { status: 404 })

    const invitation = await envoyerInvitationAdmin(db, {
      email, prenom: admin.first_name || "", studioName: studio.name, slug: studio.slug,
    })
    if (invitation.envoyee === false) { // `=== false` : retrecissement sans strictNullChecks
      return NextResponse.json({ ok: false, error: `Invitation non envoyée : ${invitation.raison}` }, { status: 502 })
    }
    return NextResponse.json({ ok: true, email })
  } catch (err: any) {
    console.error("[sa/resend-admin-invite] error:", err?.message)
    return NextResponse.json({ error: err?.message || "Erreur" }, { status: 500 })
  }
}
