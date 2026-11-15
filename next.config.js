/** @type {import('next').NextConfig} */
const buildDate = new Date().toLocaleDateString("fr-FR")
const nextConfig = {
  // Plus de `typescript.ignoreBuildErrors` (retire le 15/11/2026) : il
  // masquait 10 erreurs de types, dont une option mal nommee dans
  // create-tenant. Le build verifie desormais les types, comme `tsc --noEmit`.
  env: {
    NEXT_PUBLIC_BUILD_DATE: buildDate,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
}
module.exports = nextConfig