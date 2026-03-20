/** @type {import('next').NextConfig} */
const buildDate = new Date().toLocaleDateString("fr-FR")
const nextConfig = {
  typescript: {
    // Ignore TypeScript errors in JSX files (inline styles boxSizing etc.)
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_BUILD_DATE: buildDate,
  },
}
module.exports = nextConfig