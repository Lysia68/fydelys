// « Studio introuvable » : un sous-domaine de `*.fydelys.fr` qui ne correspond
// a aucun studio.
//
// Partage par la vitrine (`/studio/[slug]`) et par `/login`, et c'est le but :
// les deux doivent dire la meme chose. Une faute de frappe dans l'adresse ne
// doit jamais retomber sur la page de vente de Fydelys — c'est le defaut
// corrige le 31/10/2026, et il reviendrait par cette porte.
//
// Pas de `"use client"` : rien a hydrater. La vitrine, qui est un composant
// client, peut l'importer quand meme.
//
// La page repond 200 et non 404 : c'est l'adresse qui est fausse, pas une
// ressource manquante, et le visiteur a besoin de l'explication plus que le
// robot n'a besoin du code.
export default function StudioIntrouvable() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#F4EFE8",
        fontFamily: "'Helvetica Neue',Arial,sans-serif",
        gap: 12,
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 40 }}>🔍</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#2A1F14" }}>Studio introuvable</div>
      <div style={{ fontSize: 14, color: "#8C7B6C", maxWidth: 360, lineHeight: 1.6 }}>
        Cette adresse ne correspond à aucun studio. Vérifiez le lien que votre studio vous a
        communiqué.
      </div>
      <div style={{ fontSize: 11, color: "#B0A090", marginTop: 20 }}>
        <a
          href="https://fydelys.fr"
          style={{ color: "#A06838", textDecoration: "none", fontWeight: 600 }}
        >
          Fydelys
        </a>
      </div>
    </div>
  );
}
