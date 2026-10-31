import type { Metadata } from "next";
import { createServiceSupabase } from "@/lib/supabase-server";
import StudioVitrine from "./StudioVitrine";

type Props = { params: Promise<{ slug: string }> };

// Le titre de l'onglet, lui aussi, parlait au mauvais public : la vitrine
// heritait de celui du `layout` racine, « Fydelys — Studio Manager », avec en
// description « Gérez votre studio de yoga et bien-être ». C'est l'argumentaire
// de vente, lu par une adherente qui vient reserver son cours.
//
// Tout en `try` : cette page doit s'afficher meme si la base ne repond pas (le
// nom du studio n'est pas vital, la vitrine se charge cote client de toute
// facon). Une exception ici rendrait un 500 a la place de la vitrine.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const neutre: Metadata = { title: "Réservation — Fydelys" };

  try {
    const { data } = await createServiceSupabase()
      .from("studios")
      .select("name, city, description")
      .eq("slug", slug)
      .eq("status", "actif")
      .single();

    if (!data?.name) return neutre;

    return {
      title: `${data.name} — Réserver`,
      description:
        data.description || `Planning et réservation${data.city ? ` à ${data.city}` : ""} — ${data.name}`,
    };
  } catch {
    return neutre;
  }
}

// `<studio>.fydelys.fr/` arrive ici par une reecriture du middleware, qui
// connait le slug par le sous-domaine. L'adresse affichee reste celle du
// studio : une reecriture ne touche pas a la barre d'adresse.
//
// La route est aussi joignable en direct sur `fydelys.fr/studio/<slug>`, ce qui
// la rend verifiable sans toucher au DNS.
export default async function StudioVitrinePage({ params }: Props) {
  const { slug } = await params;
  return <StudioVitrine slug={slug} />;
}
