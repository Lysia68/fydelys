# Backlog Fydelys

Ce qui reste à faire, et ce qu'il faut savoir avant de le faire.

Ce fichier vit **dans le dépôt** et non dans une mémoire d'assistant : une
mémoire locale ne suit pas les sessions cloud, et ces notes sont justement
celles qui coûtent un aller-retour quand on ne les a pas.

Tenu à jour au fil de l'eau. Dernière mise à jour : 31/10/2026.

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
