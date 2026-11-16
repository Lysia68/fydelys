# Audit du contrôle d'accès — routes `src/app/api/**`

Relevé du 15/11/2026, sur `dev` après `237539d`. **Lecture du code uniquement :
rien n'est corrigé dans ce lot.** Chaque ligne a été établie en lisant la route
(entrée, contrôle, données lues ou écrites), pas seulement par recherche de mots.

Contexte qui pèse sur presque toutes les lignes : les routes lisent et écrivent
avec la **clé de service** (`createServiceSupabase`), qui **contourne la RLS**.
Le contrôle d'accès repose donc entièrement sur le code de la route : s'il
manque, rien d'autre ne protège.

`checkAuth(req, studioId)` ([`src/lib/auth-check.ts`](../src/lib/auth-check.ts))
vérifie la session et que le studio demandé est celui du profil — **mais pas le
rôle** : un **adhérent** de ce studio passe.

## Statut des corrections — 15/11/2026, sur `dev` (pas encore en production)

Toutes les failles 🔴 et 🟠 du relevé ci-dessous sont **corrigées sur `dev`**.
Chaque correction a ses tests de refus et son cas légitime, rejoués contre la
version d'avant (rouges) et vérifiés par mutation. Le contrôle de rôle se fait
après `checkAuth`, via [`src/lib/roles.ts`](../src/lib/roles.ts) (`exigerRole`,
`estEquipeDuStudio`) — pas dans `checkAuth`, que les tests remplacent par un
double.

| Route | Correction | Commit |
|---|---|---|
| `/members` PATCH, DELETE | équipe du studio du membre | `1ff863b` |
| `/bookings/cancel` | équipe du studio / l'adhérent pour SA réservation | `237539d` |
| `/create-profile` | **supprimée** (aucun appelant) | `4ca9088` |
| `/invite-coach` | admin du studio visé | `d94ec4c` |
| `/connect/onboard`, `/connect/disconnect`, `/connect/status` | admin du studio | `5568dc7` |
| `/sa/studios` | super-admin | `eb3ac36` |
| `/bookings` POST | le membre lui-même ; l'équipe de son studio ; `force` réservé à l'équipe ; auteur réel journalisé | `0db550c` |
| `/send-reminder` | équipe du studio ; destinataires et contenu relus en base | `cde8f75` |
| `/bookings` GET | l'adhérent pour lui-même ; l'équipe (planning filtré sur le studio) | `44c9365` |
| `/members/history` | équipe du studio du membre | `44c9365` |
| `/invoice` | équipe du studio du paiement, ou le payeur | `44c9365` |
| `/team` GET, POST | GET équipe ; POST admin, coach du même studio | `44c9365` |
| `/notify-new-member` | **supprimée** → `lib/notify-new-member.ts` (appel serveur direct) | `44c9365` |
| `/activity`, `/export`, `/disciplines` POST, `/members` GET/POST | adhérent refusé (équipe du studio) | `cd33b7f` |
| `/member-profile` POST | sa propre fiche, ou l'équipe du studio ; champs fixes ; le nom de l'admin n'est plus écrasé | `cd33b7f` |
| `/team/suspend` POST | **créée** (appelée par les réglages, inexistante) : admin du studio, sur un coach de son studio, jamais soi-même ni un admin ; coach suspendu bloqué par le middleware et `checkAuth`. Migration `20261115_profiles_suspended_at.sql` à appliquer. DELETE : voir la ligne dédiée | `5b748f9` |
| `/cron/*` (birthdays, cleanup, reminders, sms-reset) | `CRON_SECRET` absente = **refus** (avant : `Bearer undefined` passait ; `reminders` ne vérifiait rien) | `a429931` |
| `/connect/checkout` | adhérent pour SA fiche (équipe : membre du studio) ; abonnement/pack/séance **du studio** et actifs ; montant relu en base ; URL de retour calculées côté serveur | `d7ea3cb` |
| `/connect/webhook`, `/stripe/webhook` | idempotence sur `event.id` (table `stripe_webhook_events`, migration à appliquer ; repli : paiement déjà enregistré) ; membre crédité = membre du studio du paiement | `3d50f2a` |
| `/calendar` | **supprimée** (aucun appelant, pas de flux d'agenda) | `a08e8db` |
| `/team/suspend` DELETE | coach sans aucune séance seulement, sinon 409 « suspendez-le plutôt » ; la suspension annonce les séances futures à réassigner | `72d49fc` |
| `/albert` | équipe du studio uniquement ; quota **par studio** partagé entre instances (20 / 10 min, 100 / jour — fonction SQL `consommer_quota`, migration `20261116_api_quota.sql` à appliquer ; repli en mémoire sans elle) ; question ≤ 2 000 caractères, historique ≤ 10 messages ; nom du studio lu en base | (ce commit) |

**Reste ouvert** :
- 🟡 `/check-availability` : révèle si un e-mail a un compte (faible).

## Légende

- 🔴 **faille critique** : exploitable sans compte, ou prise de contrôle / argent / données de tous les studios
- 🟠 **faille** : exploitable par un compte connecté, ou fuite de données personnelles
- 🟡 **à préciser** : dépend d'un réglage ou d'un choix produit
- ✅ **OK**

## Tableau — relevé initial (avant corrections)

| Route | Méthode | Qui peut appeler aujourd'hui | Qui devrait pouvoir | Verdict |
|---|---|---|---|---|
| `/sa/studios` | GET | **Tout le monde, sans compte** | Super-admin | 🔴 Liste tous les studios (adresse, e-mail, téléphone, notes, facturation), **nom et téléphone des admins**, leur dernière connexion. Seule route `/sa/*` sans contrôle |
| `/connect/onboard` | POST | **Tout le monde, sans compte** (« l'auth est vérifiée côté client ») | Admin du studio | 🔴 Renvoie un **lien de connexion au tableau de bord Stripe Express** du studio (versements, coordonnées bancaires) ; peut aussi créer un compte Connect |
| `/connect/disconnect` | POST | **Tout le monde, sans compte** | Admin du studio | 🔴 Déconnecte le Stripe de n'importe quel studio : plus aucun paiement en ligne |
| `/invite-coach` | POST | **Tout le monde, sans compte** (le `studioId` du corps est pris tel quel) | Admin du studio | 🔴 Crée une invitation **coach** et envoie le lien à l'adresse choisie : un inconnu **obtient un compte coach** dans n'importe quel studio |
| `/create-profile` | POST | **Tout le monde, sans compte** ; `userId` et **`userMetadata.role` lus dans le corps** | Le flux de connexion, pour le compte connecté uniquement | 🔴 Un compte sans profil peut se créer un profil **admin** de n'importe quel studio (`role = invite?.role \|\| userMetadata?.role`) |
| `/send-reminder` | POST | **Tout le monde, sans compte** ; destinataires et contenu **lus dans le corps** | Équipe du studio, destinataires = inscrits de la séance | 🔴 **Relais de phishing** : mails vers n'importe quelle adresse, au nom du studio, par notre Brevo/SendGrid (réputation du domaine). Critère « SendGrid seul » en plus |
| `/bookings` | GET | **Tout le monde, sans compte** | Équipe du studio ; l'adhérent pour ses propres réservations | 🟠 Réservations d'un membre ou de séances, **avec noms et coordonnées** des inscrits |
| `/bookings` | POST | **Tout le monde, sans compte** (limite de débit en mémoire) ; `force` lu dans le corps | Adhérent pour lui-même ; équipe pour `force` | 🔴 Réserver **au nom de n'importe quel membre** ; `force=true` contourne la liste d'attente et le contrôle de paiement |
| `/members/history` | GET | **Tout le monde, sans compte** | Équipe du studio du membre ; le membre lui-même | 🟠 Historique des réservations **et des paiements** d'un membre par son id |
| `/invoice` | GET | **Tout le monde, sans compte** | Équipe du studio ; le membre payeur | 🟠 Facture d'un paiement par son id (nom, montant, studio) |
| `/notify-new-member` | POST | **Tout le monde, sans compte** | Le serveur (après inscription) ou l'équipe du studio | 🟠 Déclenche des mails de bienvenue vers n'importe quel membre et vers le studio (spam) |
| `/team` | GET | **Tout le monde, sans compte** | Équipe du studio | 🟠 Liste nominative de l'équipe et des invitations en cours |
| `/team` | POST | **Tout le monde, sans compte** | Admin du studio | 🟠 Réécrit les disciplines d'un coach |
| `/connect/checkout` | POST | **Tout le monde, sans compte** | Adhérent du studio (paiement de sa formule / séance) | 🟡 Crée une session de paiement Stripe pour n'importe quel studio et membre (le payeur paie : impact surtout de données) ; **écrit** `subscriptions.stripe_price_id` |
| `/connect/status` | GET | **Tout le monde, sans compte** | Admin du studio | 🟡 Lit l'état Stripe Connect et le **réécrit** en base (sans gravité directe) |
| `/member-profile` | POST | Tout compte connecté ; avec `memberId`, **n'importe quel membre** | Le membre pour lui-même ; l'équipe pour son studio | 🟠 « Édition admin d'un autre membre » sans aucun contrôle de rôle ni de studio |
| `/member-profile` | GET | Compte connecté, sa propre fiche (`auth_user_id`) | Idem | ✅ |
| `/activity` | GET | Compte du studio, **adhérent compris** | Équipe du studio | 🟠 Un adhérent lit le journal d'activité de tous les membres (noms, crédits, paiements) |
| `/export` | GET | Compte du studio, **adhérent compris** | Admin du studio | 🟠 Un adhérent exporte les données du studio |
| `/calendar` | GET | Compte du studio, **adhérent compris** ; `studioId` facultatif | À préciser (flux iCal ?) | 🟡 Dépend de l'usage : flux de l'adhérent ou du studio |
| `/disciplines` | POST | Compte du studio, **adhérent compris** | Admin du studio | 🟠 Un adhérent crée des disciplines |
| `/disciplines` | GET | Tout le monde | Tout le monde (vitrine) | ✅ |
| `/members` | GET, POST | Compte du studio, adhérent compris | Équipe du studio | 🟠 Un adhérent liste les membres du studio (coordonnées) et en crée |
| `/members` | PATCH, DELETE | Équipe du studio du membre (corrigé `1ff863b`) | Idem | ✅ |
| `/bookings/cancel` | POST | Équipe du studio / l'adhérent pour SA réservation (corrigé `237539d`) | Idem | ✅ |
| `/dashboard/stats-presences`, `/dashboard/membres-inactifs` | GET | Équipe du studio (RLS + rôle) | Idem | ✅ |
| `/seed-demo` | POST | Admin de son propre studio | Idem | ✅ |
| `/studio/stripe-keys` | POST | Admin de son studio, super-admin | Idem | ✅ |
| `/stripe/checkout`, `/stripe/subscribe`, `/stripe/portal`, `/stripe/sms-credits` | POST | Admin de son studio | Idem | ✅ |
| `/yogalatestudio-vo-subs` | POST | Admin du studio concerné, super-admin | Idem | ✅ |
| `/stripe/webhook`, `/connect/webhook` | POST | Stripe (signature vérifiée) | Idem | ✅ |
| `/cron/birthdays`, `/cron/cleanup`, `/cron/sms-reset` | GET | Porteur de `Bearer ${CRON_SECRET}` | Vercel Cron | 🟡 Si `CRON_SECRET` n'est pas posée, l'en-tête attendu devient `Bearer undefined` — devinable |
| `/cron/reminders` | GET | Porteur du secret ; **tout le monde si `CRON_SECRET` est absente** | Vercel Cron | 🟡 La vérification est sautée sans secret (`if (cronSecret && …)`) |
| `/verify-token`, `/exchange-code` | POST | Porteur d'un jeton / code Supabase valide | Idem (flux de connexion) | ✅ côté accès — mais voir lot 3 (rétrogradation d'un admin en adhérent) |
| `/register`, `/check-availability`, `/contact`, `/studio-public`, `/send-magic-link` | POST/GET | Tout le monde (limite de débit / captcha selon la route) | Tout le monde | ✅ public par nature. `check-availability` révèle si un e-mail a un compte (énumération, faible) |
| `/albert` | POST | Tout le monde, 10 req/min par IP | Tout le monde ? | 🟡 Assistant IA public : coût d'API exposé ; la limite de débit est **en mémoire**, par instance serverless (peu fiable) |
| `/sa/config`, `/sa/create-tenant`, `/sa/plans` (GET, POST), `/sa/resend-admin-invite`, `/sa/stripe-keys`, `/sa/test-brevo`, `/sa/test-notifications`, `/sa/update-tenant` (PATCH, DELETE) | — | Super-admin (vérifié dans **chaque** méthode) | Idem | ✅ |

## Priorité proposée

1. 🔴 Sans compte, prise de contrôle ou argent : `create-profile`, `invite-coach`, `connect/onboard`, `connect/disconnect`, `sa/studios`, `bookings` POST, `send-reminder`.
2. 🟠 Fuites de données personnelles sans compte : `bookings` GET, `members/history`, `invoice`, `team`, `notify-new-member`.
3. 🟠 Adhérent qui accède aux outils de l'équipe : `activity`, `export`, `disciplines` POST, `members` GET/POST, `member-profile` POST. Correctif commun possible : une option « équipe seulement » dans `checkAuth`.
4. 🟡 Vérifier que `CRON_SECRET` est posée en production ; décider du statut de `/albert` et `/calendar`.
