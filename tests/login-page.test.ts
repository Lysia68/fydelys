import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockDb, mockRequestHeaders } from "./setup"

/**
 * `/login` sur un sous-domaine de studio.
 *
 * Avant le 31/10/2026, cette page devinait son contexte dans un `useEffect`
 * (`window.location.hostname`), donc elle ne pouvait rien afficher avant
 * d'etre hydratee : le HTML servi etait un rond de chargement de 7,9 Ko, sans
 * le nom du studio ni le formulaire. L'onglet, lui, affichait l'argumentaire
 * de vente du logiciel — « Fydelys — Studio Manager », « Gérez votre studio de
 * yoga et bien-être » — a une adherente qui vient reserver son cours.
 *
 * Tout est desormais decide cote serveur, depuis l'en-tete `x-tenant-slug`
 * pose par le middleware. Ces tests portent sur cette decision : qui voit
 * quoi, et avec quel titre.
 */

const studioConnu = { name: "Yogalate Studio", accent_color: "#7E5BB5" }

const pageDeLogin = () => import("@/app/login/page")
const composantLogin = async () => (await import("@/app/login/LoginClient")).default
const composantIntrouvable = async () => (await import("@/components/StudioIntrouvable")).default

const surLHote = (slug?: string) => {
  mockRequestHeaders.clear()
  if (slug) mockRequestHeaders.set("x-tenant-slug", slug)
}

const studioEnBase = (studio: typeof studioConnu | null) => {
  mockDb.from.mockReturnValue(mockDb._chain)
  mockDb._chain.single.mockResolvedValue({ data: studio, error: null })
}

beforeEach(() => {
  vi.clearAllMocks()
  surLHote()
  studioEnBase(null)
})

describe("/login — qui la page croit-elle avoir en face", () => {
  it("sur un sous-domaine de studio : le studio, son nom et sa couleur", async () => {
    surLHote("yogalatestudio")
    studioEnBase(studioConnu)

    const { default: Page } = await pageDeLogin()
    const el: any = await Page()

    expect(el.type).toBe(await composantLogin())
    expect(el.props).toMatchObject({
      ctx: "tenant-login",
      slug: "yogalatestudio",
      studioName: "Yogalate Studio",
      accent: "#7E5BB5",
    })
  })

  it("sur fydelys.fr : la connexion de la plateforme, sans requete en base", async () => {
    surLHote() // pas d'en-tete x-tenant-slug

    const { default: Page } = await pageDeLogin()
    const el: any = await Page()

    expect(el.type).toBe(await composantLogin())
    expect(el.props.ctx).toBe("superadmin")
    expect(el.props.studioName).toBeUndefined()
    // Rien a demander a la base : il n'y a pas de studio a resoudre.
    expect(mockDb.from).not.toHaveBeenCalled()
  })

  it("un studio sans couleur choisie n'impose rien au composant", async () => {
    surLHote("yogalatestudio")
    studioEnBase({ name: "Yogalate Studio", accent_color: null } as any)

    const { default: Page } = await pageDeLogin()
    const el: any = await Page()

    // `undefined` et non `null` : le composant retombe sur le brun Fydelys par
    // sa valeur par defaut.
    expect(el.props.accent).toBeUndefined()
    expect(el.props.studioName).toBe("Yogalate Studio")
  })
})

describe("/login — sous-domaine inconnu : aucun formulaire", () => {
  it("affiche « Studio introuvable », le MEME composant que la vitrine", async () => {
    surLHote("studio-qui-nexiste-pas")
    studioEnBase(null)

    const { default: Page } = await pageDeLogin()
    const el: any = await Page()

    expect(el.type).toBe(await composantIntrouvable())
    // Et surtout PAS le formulaire : proposer un champ e-mail ici reviendrait a
    // faire partir un lien de connexion vers un studio qui n'existe pas.
    expect(el.type).not.toBe(await composantLogin())
  })

  it("une base muette ne rend pas un 500", async () => {
    // Si la requete leve, la page doit s'afficher quand meme. Elle dit alors
    // « Studio introuvable », ce qui confond panne et faute de frappe — c'est
    // exactement ce que fait la vitrine, et les deux doivent rester d'accord.
    surLHote("yogalatestudio")
    mockDb.from.mockImplementation(() => {
      throw new Error("base injoignable")
    })

    const { default: Page } = await pageDeLogin()
    const el: any = await Page()

    expect(el.type).toBe(await composantIntrouvable())
  })
})

describe("/login — le titre de l'onglet", () => {
  it("porte le nom du studio, jamais le discours commercial", async () => {
    surLHote("yogalatestudio")
    studioEnBase(studioConnu)

    const { generateMetadata } = await pageDeLogin()
    const meta = await generateMetadata()

    expect(meta.title).toBe("Yogalate Studio — Connexion")
    expect(meta.description).toBe("Espace membre — Yogalate Studio")
    // Le libelle herite du layout racine, celui qu'une adherente ne doit pas
    // lire : « Gérez votre studio de yoga et bien-être ».
    expect(String(meta.description)).not.toMatch(/[Gg]érez votre studio/)
    expect(String(meta.title)).not.toMatch(/Studio Manager/)
  })

  it("reste neutre sur un sous-domaine inconnu", async () => {
    surLHote("studio-qui-nexiste-pas")
    studioEnBase(null)

    const { generateMetadata } = await pageDeLogin()
    const meta = await generateMetadata()

    expect(meta.title).toBe("Studio introuvable — Fydelys")
  })

  it("reste neutre sur fydelys.fr", async () => {
    surLHote()

    const { generateMetadata } = await pageDeLogin()
    const meta = await generateMetadata()

    expect(meta.title).toBe("Connexion — Fydelys")
    expect(String(meta.title)).not.toMatch(/Studio Manager/)
  })
})

/**
 * Ce que contient le HTML SERVI.
 *
 * C'est le test qui aurait vu le defaut : `if (!hydrated) return <spinner>`
 * renvoyait un rond de chargement et rien d'autre. Le nom du studio etait
 * bien dans la charge utile React, mais pas dans le document — donc invisible
 * sans JavaScript, et affiche en retard avec.
 */
describe("/login — le HTML servi, sans JavaScript", () => {
  const rendre = async (props: Record<string, unknown>) => {
    const { renderToStaticMarkup } = await import("react-dom/server")
    const { createElement } = await import("react")
    const LoginClient = await composantLogin()
    return renderToStaticMarkup(createElement(LoginClient as any, props as any))
  }

  it("porte le nom du studio et le formulaire, des le premier octet", async () => {
    const html = await rendre({ ctx: "tenant-login", slug: "yogalatestudio", studioName: "Yogalate Studio" })

    expect(html).toContain("Yogalate")
    expect(html).toContain("Votre espace membre")
    expect(html).toContain("Adresse email")
  })

  it("ne tient aucun discours commercial a une adherente", async () => {
    const html = await rendre({ ctx: "tenant-login", slug: "yogalatestudio", studioName: "Yogalate Studio" })

    expect(html).not.toContain("Gestion de studio")
    expect(html).not.toContain("Plateforme de gestion")
    expect(html).not.toContain("Créer mon studio")
  })

  it("prend la couleur du studio", async () => {
    const html = await rendre({
      ctx: "tenant-login",
      slug: "yogalatestudio",
      studioName: "Yogalate Studio",
      accent: "#7E5BB5",
    })

    // #7E5BB5 = rgb(126,91,181) : la teinte sort en hexadecimal (textes,
    // bordures) et en rgba (voiles, lueur).
    expect(html).toMatch(/#7E5BB5|126,91,181/i)
    expect(html).not.toContain("#A06838") // le brun Fydelys a cede la place
  })

  it("refuse une couleur qui n'est pas une couleur", async () => {
    // `accent_color` vient de la base et finit dans un attribut `style`. Une
    // valeur libre y serait du CSS libre.
    const html = await rendre({
      ctx: "tenant-login",
      slug: "yogalatestudio",
      studioName: "Yogalate Studio",
      accent: "red;background-image:url(//ailleurs.example/x)",
    })

    expect(html).not.toContain("ailleurs.example")
    expect(html).toContain("#A06838") // repli sur le brun Fydelys
  })

  it("sur fydelys.fr, sert la connexion de la plateforme", async () => {
    const html = await rendre({ ctx: "superadmin" })

    expect(html).toContain("Plateforme de gestion")
    expect(html).toContain("Adresse email")
    expect(html).toContain("Créer mon studio")
  })
})
