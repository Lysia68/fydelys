export const dynamic = "force-dynamic"
// Ancre de route : le layout (app) rend toujours FydelysApp et ignore
// `children`. Le tableau de bord servi est components/fydelys/Dashboard.jsx.
// Ce fichier contenait 187 lignes jamais affichees, seul lecteur de la vue
// cassee `studio_kpis` (videe le 16/11/2026). NE PAS SUPPRIMER le fichier :
// sans lui, /dashboard repond 404.
export default function Page() { return null }
