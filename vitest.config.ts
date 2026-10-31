import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    coverage: {
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
