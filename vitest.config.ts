import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    // 20 s au lieu de 5 : le PREMIER test d'un fichier importe dynamiquement
    // la route (et ses dependances, Stripe compris) ; suite complete en
    // parallele, cet import a depasse 5 s (15/11/2026) — faux echecs.
    testTimeout: 20_000,
    coverage: {
      provider: "v8", // le defaut de vitest, rendu explicite (exige par le typage)
      reporter: ["text", "html"],
      include: ["src/app/api/**/*.ts", "src/middleware.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  // Next compile le JSX avec le runtime « automatic » (tsconfig : jsx
  // "preserve", donc c'est le bundler qui tranche). Sans cette ligne, esbuild
  // retombe sur `React.createElement` et tout module testant un composant
  // echoue sur « React is not defined » — ce qui n'arrive jamais au build.
  esbuild: { jsx: "automatic" },
})
