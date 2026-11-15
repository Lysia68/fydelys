# Backlog Fydelys

Ce qui reste à faire, et ce qu'il faut savoir avant de le faire.

Ce fichier vit **dans le dépôt** et non dans une mémoire d'assistant : une
mémoire locale ne suit pas les sessions cloud, et ces notes sont justement
celles qui coûtent un aller-retour quand on ne les a pas.

Tenu à jour au fil de l'eau. Dernière mise à jour : 31/10/2026.

---

## 🔴 Monter Next — avis de sécurité, dont trois critiques

**Rien n'est fait.** Constat du 31/10/2026, chiffres relevés sur le poste
(`npm audit`, et les plages d'avis confrontées à la version installée avec
`semver`).

### Où on en est

`next@15.2.6` dans `package.json` **et** dans le verrou. **35 avis** la
concernent : **3 critiques, 13 élevés, 17 moyens, 2 faibles**.

### Une 15.x corrigée EXISTE : `15.5.28`

C'est le point qui décide de tout, et il a été établi à l'envers une première
fois (voir le piège plus bas) :

```
npm audit → fixAvailable: { name: "next", version: "15.5.28", isSemVerMajor: false }
npm view next dist-tags → "backport": "15.5.28"   "latest": "16.4.3"
```

Next maintient une étiquette `backport` dédiée aux correctifs de sécurité de la
ligne 15. **Le passage en 16 n'est donc pas nécessaire pour la sécurité.**

En revanche, **rester en 15.2.x est impossible** : cette ligne s'arrête à
`15.2.9` (étiquette `next-15-2`), et la plupart des avis exigent `>= 15.5.16`,
quatre d'entre eux `>= 15.5.28`.

### ⚠ Le piège qui a fait conclure faux le 29/10

La plage que `npm audit` affiche pour un paquet —
`9.3.4-canary.0 - 16.3.0-preview.10` — est l'**UNION des 35 avis**, pas la plage
d'un seul. Lue comme la plage d'un avis unique, elle fait croire qu'aucune
version 15.x n'est sortie de la zone, et donc qu'il faut passer en 16. C'est
faux. Il faut lire les avis **un par un** :

```bash
npm audit --json > audit.json
node -e "
const a=require('./audit.json'), semver=require('semver');
const v=a.vulnerabilities.next.via.filter(x=>typeof x==='object');
for (const x of v.filter(x=>semver.satisfies('15.2.6', x.range)))
  console.log(x.severity, x.url.split('/').pop(), x.range, x.title);
"
```

### Les avis qui comptent pour CETTE application

| réf. | gravité | corrigé dans | pourquoi ici |
|---|---|---|---|
| `GHSA-267c-6grr-h53f` | élevée | `15.5.16` | **Contournement du middleware** (App Router, segment-prefetch) |
| `GHSA-26hh-7cqf-hhc6` | élevée | `15.5.18` | le même, « Incomplete Fix Follow-Up » |
| `GHSA-p9j2-gv94-2wf4` | élevée | `15.5.21` | SSRF dans les **rewrites** via hôte de destination |
| `GHSA-4342-x723-ch2f` | moyenne | `15.4.7` | SSRF par mauvaise gestion des **redirections de middleware** |
| `GHSA-2464-fhr4-w9xw` | **critique** | `15.5.28` | RCE non authentifiée, API d'optimisation d'images (SVG) |
| `GHSA-2xp9-vwfh-vxw4` | **critique** | `15.5.24` | RCE non authentifiée, la même API (AVIF) |
| `GHSA-p293-qw3h-jr36` | **critique** | `15.5.24` | RCE non authentifiée, **serveurs hébergés sous Windows** |

Les deux contournements de middleware sont les plus graves **pour ce produit** :
ici, le middleware n'est pas un ornement, c'est l'étage qui porte la garde
d'authentification, le blocage des comptes suspendus et la garde de
facturation. Le contourner, c'est les contourner toutes.

Trois nuances, pour ne pas s'alarmer au mauvais endroit :

- le RCE **Windows** ne concerne pas la production (Vercel tourne sous Linux) —
  mais il concerne le **poste de développement**, qui lance `next dev` et
  `next start` sous Windows ;
- les RCE d'**optimisation d'images** passent par l'endpoint `/_next/image`,
  qui existe **même si `next/image` n'est jamais importé** — et c'est le cas
  dans ce dépôt. Le bloc `images.remotePatterns` de `next.config.js`
  (`images.unsplash.com`, `*.supabase.co`) ne sert donc à rien et peut partir ;
- le SSRF des rewrites parle d'un **hôte de destination contrôlé par
  l'attaquant**. Notre seule réécriture vise un chemin interne
  (`/studio/<slug>`), le slug sortant d'une regexp `^([a-z0-9-]+)\.fydelys\.fr`.
  Elle n'est pas exploitable telle quelle — mais l'avis porte sur la version,
  pas sur notre usage.

### Ce que `15.2.6 → 15.5.28` casse : rien de connu

Lu dans les notes officielles de 15.5 :

- **middleware** : le runtime Node devient *stable*, mais **le défaut ne change
  pas** (« Although Node.js runtime won't be the default in Next.js 16, we are
  exploring making it the default starting with Next.js 17 »). Notre middleware
  Edge continue tel quel ;
- **`images`** : seulement des **avertissements** (`qualities` si ≠ 75 sans
  `images.qualities`, `localPatterns` non configuré). Rien ne change à
  l'exécution avant 16 ;
- `next lint`, `legacyBehavior` de `next/link`, AMP : avertissements, suppression
  en 16.

**Et ce que les notes ne disent PAS** : rien sur `NextResponse.rewrite`, rien
sur les cookies de requête ou de réponse. Absence d'information n'est pas une
garantie — d'où les contrôles de l'étape 3 ci-dessous, qui portent précisément
là.

Reste à monter `eslint-config-next` (15.2.6) en phase, sans urgence.

### Ce que `16.4.3` casserait, si on y allait

À traiter comme un **lot séparé**, pas comme un effet de bord de la sécurité :

- **`middleware.ts` → `proxy.ts`** (fonction `middleware` → `proxy`,
  `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`). Et surtout :
  « The `edge` runtime is **NOT** supported in `proxy`… If you want to continue
  using the `edge` runtime, keep using `middleware` ». Le guide **ne dit pas
  explicitement** si `middleware.ts` reste accepté en 16 : à établir avant de
  s'engager, c'est le point qui décide du coût du lot ;
- **Turbopack par défaut** pour `next dev` et `next build` ;
- **APIs de requête asynchrones** : l'accès synchrone à `cookies()`,
  `headers()`, `params`, `searchParams` est supprimé ;
- **`next/image`** : `minimumCacheTTL` 60 s → 4 h, `qualities` restreint à
  `[75]`, `16` retiré de `imageSizes`, `maximumRedirects` à 3, IP locales
  bloquées, `images.domains` déprécié ;
- **Node ≥ 20.9**, **TypeScript ≥ 5.1** ;
- l'App Router de 16 s'appuie sur une **canary de React** (fonctionnalités 19.2).
  Pour un produit en production, ça compte.

Ce que l'audit du dépôt dit déjà, le 31/10/2026 — la plupart des obstacles ne
nous concernent pas :

```
config webpack personnalisée    aucune
cookies()/headers() synchrones  0   (le seul `headers()` trouvé est dans un commentaire)
revalidateTag                   0
routes parallèles (@slot)       0
node local                      v26.2.0   (≥ 20.9 ✓)
typescript                      5.9.3     (≥ 5.1 ✓)
```

Le codemod officiel existe : `npx @next/codemod@canary upgrade latest`, et il
sait faire le renommage `middleware` → `proxy`.

### Ordre proposé

1. `npm i next@backport` (→ `15.5.28`), **sur `dev`** ;
2. les 55 tests, `tsc`, `next build` ;
3. le relevé du HTML servi sur les quatre hôtes (voir plus bas) : c'est ce qui
   vérifie middleware, réécriture de sous-domaine et cookies, précisément ce
   que les notes de version ne couvrent pas ;
4. contrôle visuel en préprod, puis `main` ;
5. le bloc `images.remotePatterns` inutile peut partir dans le même lot ;
6. **16.4.3 plus tard**, comme un lot à lui, après la question
   `middleware`/`proxy`.

⚠ **Ne pas lancer `npm audit fix --force`.** Sur ce dépôt, npm propose
`eslint@4.0.0` et `eslint-config-next@12.0.4` comme « correctifs » — des
retours en arrière de plusieurs années, marqués `isSemVerMajor: true`.

---

## Pages vues par les adhérentes

Les pages servies sur `<studio>.fydelys.fr` : la vitrine (`/`, réécrit vers
`/studio/[slug]` par le middleware) et `/login`.

Les deux ont été remises d'aplomb les 29 et 31/10/2026 — une adhérente y
recevait l'argumentaire de vente du logiciel. Le détail est dans les commits
(`0595081`, `07053ca`, `ce9b5f1`) ; ce qui suit ne s'y trouve pas.

### 1. Un état « momentanément indisponible », distinct de « Studio introuvable »

Quand la base est injoignable, les deux pages affichent **« Studio
introuvable »** : une panne se lit donc comme un studio inexistant.

C'est une confusion **assumée** pour l'instant, écrite en commentaire dans
[`src/app/login/page.tsx`](../src/app/login/page.tsx) et couverte par un test
(`tests/login-page.test.ts`, « une base muette ne rend pas un 500 ») — ce n'est
pas un oubli, c'est un choix à reprendre.

À traiter **en commun** pour la vitrine et `/login` : les deux passent par
[`src/components/StudioIntrouvable.tsx`](../src/components/StudioIntrouvable.tsx),
et doivent rester d'accord. Un visiteur qui se trompe d'adresse et un visiteur
qui tombe sur une panne n'ont pas besoin du même message, ni du même conseil.

### 2. Le logo du studio

Lot séparé, jamais commencé. Ce qu'on sait déjà :

- `logo_url` est sélectionné par `loadStudioSettings`
  ([`src/lib/db.ts`](../src/lib/db.ts)) — et **cette fonction n'est appelée
  nulle part** ;
- aucun écran ne permet de téléverser un logo, et rien ne l'affiche ;
- **l'existence de la colonne en base reste à vérifier** : une colonne absente
  d'un `select` PostgREST renvoie une erreur et `data: null`, donc le code
  actuel ne prouve rien.

`accent_color`, en revanche, existe vraiment — sélecteur de couleurs dans les
réglages — et habille depuis le 31/10/2026 la vitrine **et** `/login`. Son
format est vérifié (`#rrggbb`) avant d'entrer dans un attribut `style` : la
valeur vient de la base, et le sélecteur n'est qu'une convention d'écran.

---

## Notes de vérification — à lire avant de toucher au multi-domaine

### La réécriture de sous-domaine ne se vérifie PAS en préprod

Une préprod Vercel répond sur `*.vercel.app`. Le middleware n'y voit donc aucun
sous-domaine de studio : `/` y servira **toujours** la landing, et le contrôle
visuel de la vitrine y est impossible. Ne pas le promettre.

Les deux seules façons de vérifier :

1. **en préprod** : attaquer la route directement, `<préprod>/studio/<slug>` ;
2. **en local, et c'est la vraie épreuve** :

```bash
npx next build
npx next start -p 3125
curl -H "Host: yogalatestudio.fydelys.fr" http://localhost:3125/
curl -H "Host: fydelys.fr"                http://localhost:3125/
```

C'est ce qui a prouvé, octet pour octet, que `fydelys.fr` et `www.fydelys.fr`
reçoivent la landing (74 804 o, identiques) et qu'un sous-domaine de studio
reçoit la vitrine (7 736 o).

### Résoudre un studio en local, sans clé de service

Il n'y a pas de clé Supabase sur le poste de développement. Un bouchon
PostgREST de vingt lignes suffit : répondre l'objet du studio sur
`/rest/v1/studios?slug=eq.<connu>`, et **406 + `PGRST116`** pour tout le reste
— c'est ce que renvoie PostgREST à un `.single()` qui ne trouve rien.

```js
// node bouchon.cjs, puis NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 next start
const http = require("http");
const CONNU = { name: "Yogalate Studio", accent_color: "#7E5BB5" };
http.createServer((req, res) => {
  const u = new URL(req.url, "http://b");
  const slug = (u.searchParams.get("slug") || "").replace(/^eq\./, "");
  res.setHeader("content-type", "application/json");
  if (u.pathname === "/rest/v1/studios") {
    if (slug === "yogalatestudio") return res.end(JSON.stringify(CONNU));
    res.statusCode = 406;
    return res.end(JSON.stringify({ code: "PGRST116", message: "0 rows" }));
  }
  res.statusCode = 401;
  res.end(JSON.stringify({ message: "pas de session" }));
}).listen(54321);
```

### `www` et `app` ne sont pas des studios

Le domaine joker `*.fydelys.fr` est attaché au projet Vercel, donc
`www.fydelys.fr` **répond** (200, vérifié le 31/10/2026). Toute logique qui
dérive un slug du sous-domaine doit les exclure, sinon `www` part sur « Studio
introuvable » au lieu de la landing. C'est déjà le cas dans
[`src/middleware.ts`](../src/middleware.ts) — à ne pas défaire.

### Tester un composant

`vitest.config.ts` passe le JSX en runtime « automatic ». Sans cette ligne,
esbuild retombe sur `React.createElement` et **tout** test qui rend un composant
échoue sur « React is not defined » — ce qui n'arrive jamais au build, Next
utilisant le runtime automatique.

C'est ce qui rend testable le **HTML servi**, et donc la classe de défaut
corrigée les 29 et 31/10 : une identité connue du serveur mais devinée par le
navigateur, derrière un écran de chargement.
