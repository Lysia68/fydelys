import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync, existsSync } from "fs"
import { join, resolve } from "path"

// La vue `studio_kpis` est cassee (42P17, recursion) et destinee a etre
// supprimee (DROP VIEW). Aucun code ne doit la lire. Son seul lecteur,
// app/(app)/dashboard/page.tsx, etait du code jamais affiche (le layout (app)
// ignore `children`) : il est reduit a une ancre de route — le fichier doit
// rester, sinon /dashboard repond 404.

const racine = resolve(__dirname, "..")
function fichiers(dir: string): string[] {
  return readdirSync(dir).flatMap(n => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? fichiers(p) : /\.(t|j)sx?$/.test(n) ? [p] : []
  })
}

describe("studio_kpis : plus aucun lecteur", () => {
  it("aucun fichier de src/ ne lit la vue (hors commentaire)", () => {
    const lecteurs = fichiers(join(racine, "src")).filter(f =>
      readFileSync(f, "utf8").split("\n").some(l => l.includes("studio_kpis") && !l.trim().startsWith("//")))
    expect(lecteurs).toEqual([])
  })
  it("/dashboard garde son ancre de route", () => {
    const page = join(racine, "src/app/(app)/dashboard/page.tsx")
    expect(existsSync(page)).toBe(true)
    expect(readFileSync(page, "utf8")).toMatch(/export default function Page\(\)/)
  })
})
