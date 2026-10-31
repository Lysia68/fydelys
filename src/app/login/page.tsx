import type { Metadata } from "next";
import { cache } from "react";
import { headers } from "next/headers";
import { createServiceSupabase } from "@/lib/supabase-server";
import StudioIntrouvable from "@/components/StudioIntrouvable";
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

type Studio = { name: string; accent_color: string | null };

// ── Le studio est resolu UNE fois, ici, et cote serveur ──────────────
//
// `cache()` parce que `generateMetadata` et la page ont tous deux besoin du
// studio : sans lui, deux requetes identiques a chaque affichage. React
// memorise par requete ; hors rendu (en test) la fonction est simplement
// appelee, ce qui ne change rien au resultat.
//
// PAS de filtre sur `status`, contrairement a la vitrine qui exige
// `status = 'actif'`. C'est delibere et ce n'est pas un oubli : si un studio
// est suspendu, ses adherentes doivent pouvoir continuer a se connecter pour
// consulter leur compte. Un studio suspendu n'a donc pas de vitrine, mais
// garde sa page de connexion. Le blocage des comptes, lui, se fait dans le
// middleware (adherent supprime ou suspendu) et par la garde de facturation.
//
// Tout en `try` : la page doit s'afficher meme si la base ne repond pas.
const chargerStudio = cache(async (slug: string): Promise<Studio | null> => {
  if (!slug) return null;
  try {
    const { data } = await createServiceSupabase()
      .from("studios")
      .select("name, accent_color")
      .eq("slug", slug)
      .single();
    return data?.name ? (data as Studio) : null;
  } catch {
    return null;
  }
});

// Le slug vient de l'en-tete pose par le middleware, jamais de
// `window.location` : c'est ce qui permet de rendre la page du premier coup.
// Vide sur `fydelys.fr`, sur `www`, sur `app` et en local.
async function slugDeLHote(): Promise<string> {
  return (await headers()).get("x-tenant-slug") || "";
}

// ── Le titre de l'onglet ─────────────────────────────────────────────
// Sans `generateMetadata`, cette page heritait du `layout` racine :
// « Fydelys — Studio Manager », description « Gérez votre studio de yoga et
// bien-être ». Une adherente qui se connecte a son cours de yoga lisait donc
// l'argumentaire de vente du logiciel dans son onglet, dans son historique et
// dans ses favoris.
export async function generateMetadata(): Promise<Metadata> {
  const neutre: Metadata = {
    title: "Connexion — Fydelys",
    description: "Connectez-vous à votre espace.",
  };

  const slug = await slugDeLHote();
  if (!slug) return neutre;

  const studio = await chargerStudio(slug);
  if (!studio) return { title: "Studio introuvable — Fydelys", description: neutre.description };

  return {
    title: `${studio.name} — Connexion`,
    description: `Espace membre — ${studio.name}`,
  };
}

export default async function Page() {
  const slug = await slugDeLHote();

  // Sur `fydelys.fr` : la connexion de la plateforme (gerants et super-admin).
  if (!slug) return <LoginClient ctx="superadmin" />;

  const studio = await chargerStudio(slug);

  // Sous-domaine qui ne correspond a aucun studio : AUCUN formulaire. Afficher
  // un champ e-mail ici reviendrait a proposer de creer un compte sur un studio
  // qui n'existe pas, et a faire partir un lien de connexion dans le vide.
  if (!studio) return <StudioIntrouvable />;

  return (
    <LoginClient
      ctx="tenant-login"
      slug={slug}
      studioName={studio.name}
      accent={studio.accent_color || undefined}
    />
  );
}
