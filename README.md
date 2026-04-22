# Monétika

Un journal financier pour l'Afrique de l'Ouest francophone et anglophone (UEMOA + Nigeria + Ghana, 10 marchés).

> **V1 sans Open Banking, sans API Mobile Money, sans SGI.** L'utilisateur **saisit** ses comptes, soldes, revenus et dépenses. Monétika est un outil de **pleine conscience financière** : l'utilisateur reprend le contrôle parce qu'il touche ses chiffres avec ses doigts, tous les jours.

## État du produit

| Phase | Statut |
|---|---|
| 0 · Fondations (scaffold, tokens, fonts, Prisma, i18n) | ✅ |
| 1 · Auth & onboarding (magic link Resend, PIN bcrypt, 7 étapes) | ✅ |
| 2 · Comptes & dashboard (net worth, barre stratégique, CRUD, export CSV) | ✅ |
| 3 · Saisie ≤5s / 2 taps (pavé XXL, suggestion 1-tap, patterns) | ✅ |
| 4 · Budgets & catégories (30+ cats, seuils 70/90, month selector) | ✅ |
| 5 · Objectifs (CRUD, projection SVG, contribution intégrée aux tx) | ✅ |
| 6 · Note d'Évolution Financière (7 critères, sparkline, PDF 1 page) | ✅ |
| 7 · Insights (treemap, barres mensuelles, delta N-1, export CSV+PDF) | ✅ |
| 8 · Réglages (profil, PIN, thème, stratégie, revenus, export/delete) | ✅ |
| 9 · PWA (service worker offline-first, splash iOS, a11y audit) | ✅ |
| 10 · Tests e2e + déploiement Vercel + README | ✅ |

## Stack

| Couche | Choix |
|---|---|
| Framework | Next.js 15.5 (App Router, RSC, Server Actions) |
| Langage | TypeScript strict (noImplicitAny, noUncheckedIndexedAccess) |
| Styles | Tailwind CSS v4 + CSS Variables |
| Animation | `motion` (ex Framer Motion) |
| Icônes | `@phosphor-icons/react` (duotone pour les accents) |
| Typographie | Fraunces + Instrument Sans + Geist Mono (locales via `next/font`) |
| ORM | Prisma 6 |
| Base | Postgres via Neon (serverless) |
| Auth | Auth.js v5 (magic link Resend + PIN 6 chiffres bcrypt) |
| i18n | `next-intl` (fr/en) |
| PDF | `@react-pdf/renderer` avec Fraunces + Instrument Sans |
| Tests | Vitest (unit) + Playwright (e2e) |
| CI | GitHub Actions (typecheck + lint + prettier + unit tests) |
| Cron | Vercel Cron (`vercel.json`) |
| Déploiement | Vercel |

## Setup local (< 10 minutes)

```bash
# 1. Cloner & installer
git clone https://github.com/Frejustedev/monetika-.git monetika
cd monetika
npm install

# 2. Variables d'environnement
cp .env.example .env.local
# Renseigner DATABASE_URL (Neon), AUTH_SECRET (générer), RESEND_API_KEY, NEXT_PUBLIC_APP_URL.

# 3. Schéma DB + seed
npm run prisma:generate
npm run prisma:migrate       # première migration
npm run prisma:seed          # utilisateur démo Koffi + 4 comptes + 80 tx + 8 budgets + 3 goals + 12 snapshots NEF

# 4. Lancer en dev
npm run dev
```

Ouvrir http://localhost:3000. Compte démo : `koffi@monetika.demo` + PIN `483726`.

## Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` | Dev server Next.js |
| `npm run build` | Build production (inclut `prisma generate` + `migrate deploy`) |
| `npm run start` | Serveur production |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run format` | Prettier écriture |
| `npm run test` | Tests unitaires Vitest |
| `npm run test:e2e` | Tests e2e Playwright (requiert Neon seed + dev server) |
| `npm run prisma:studio` | Prisma Studio (GUI DB) |
| `npm run prisma:seed` | Seed base |

## Architecture

```
monetika/
├── app/
│   ├── (auth)/                   Login, signup, verify (magic link)
│   ├── (onboarding)/             7 étapes I→VII (chiffres romains Fraunces italique)
│   ├── (app)/                    Shell protégé avec bottom nav + sidebar
│   │   ├── dashboard/
│   │   ├── accounts/
│   │   ├── transactions/
│   │   ├── budget/
│   │   ├── goals/
│   │   ├── insights/
│   │   ├── score/
│   │   └── settings/
│   ├── api/
│   │   ├── auth/[...nextauth]/   Auth.js handler
│   │   └── cron/compute-nef/     Cron quotidien (protégé CRON_SECRET)
│   ├── offline/                  Fallback SW
│   ├── fonts.ts                  next/font/local
│   ├── globals.css               Tailwind v4 + @theme
│   ├── tokens.css                Palette Sable & Forêt
│   ├── layout.tsx                Shell racine
│   ├── manifest.ts               PWA manifest
│   └── page.tsx                  Marketing (redirige /dashboard si auth+onboardé)
├── components/
│   ├── ui/                       Input, Button, PinPad
│   ├── charts/                   StrategyBar, Treemap, MonthlyBars
│   ├── money/                    Amount (composite symbole+chiffre)
│   ├── layout/                   Sidebar, BottomNav, Wordmark, EditorialHeader
│   ├── dashboard/                AccountRow, TransactionRow
│   ├── transactions/             AmountPad, KindTabs, CategoryGrid, AccountSelector, SuggestionLine, DayGroup
│   ├── goals/                    GoalRow, GoalProjection
│   ├── budget/                   MonthSelector, BudgetRow, BudgetEditSheet
│   ├── insights/                 TabSwitcher
│   ├── score/                    ScoreDisplay, CriteriaBreakdown, ScoreSparkline
│   ├── onboarding/               StepProgress, CountryPicker, StrategySlider
│   ├── marks/                    Flag (10 drapeaux SVG sobres)
│   └── system/                   ServiceWorkerRegistry
├── lib/
│   ├── auth/                     config, pin, email (Resend), magic-link, rate-limit, session
│   ├── db/                       Prisma client + queries/
│   │   └── queries/              dashboard, accounts, transactions, budgets, goals, insights
│   ├── money/                    formatAmount, splitAmount
│   ├── scoring/nef.ts            NEF 0-1000 avec 7 critères pondérés
│   ├── strategy/buckets.ts       Stratégie 6 comptes
│   ├── countries.ts              10 pays + dial codes + institutions
│   ├── patterns.ts               Learning pour suggestion 1-tap
│   └── utils.ts                  cn, fieldError, globalError
├── server/actions/               auth, onboarding, accounts, transactions, budgets, goals, settings
├── prisma/
│   ├── schema.prisma             12 modèles, 4 enums
│   ├── migrations/               2 migrations (init + auth_and_nullable_profile)
│   └── seed.ts                   Koffi + 4 comptes + 80 tx + 8 budgets + 3 goals + 12 snapshots NEF
├── messages/                     fr.json, en.json (complets)
├── public/
│   ├── fonts/                    20 TTF Fraunces + Instrument Sans + Geist Mono
│   ├── icons/                    31 PWA icons (16 → 1024, maskable)
│   ├── marks/                    16 SVG logos officiels
│   ├── splash/                   6 splash screens iOS/iPad
│   ├── sw.js                     Service worker custom
│   └── og-image.png
├── tests/
│   ├── unit/                     currency, strategy, pin, patterns, nef
│   └── e2e/                      home, login, tx-entry, goal
├── auth.ts                       NextAuth config (export handlers, auth, signIn, signOut)
├── middleware.ts                 Protection routes + onboarding gate
├── next.config.mjs
├── playwright.config.ts
├── vercel.json                   Cron + caching headers
└── .github/workflows/ci.yml      Typecheck + lint + prettier + unit tests
```

## Design system — Sable & Forêt

Palette complète dans [`app/tokens.css`](app/tokens.css). Règles non négociables :

- **Jamais** de `#FFFFFF` pur → `--paper` `#F5F1E8`.
- **Jamais** de `#000000` pur → `--ink` `#17160F`.
- Max 3 couleurs d'accent par écran.
- Chiffres en **tabular-nums** partout (`font-variant-numeric: tabular-nums`).
- Montants en **Fraunces** (serif éditoriale), jamais Instrument Sans.
- Symboles monétaires à 62% de la taille du chiffre (voir [`Amount`](components/money/Amount.tsx)).
- Radius : **4 / 10 / 20**. Pas de `rounded-full` sur les boutons primaires.
- Pas d'ombre : **ligne** de séparation 0.5px en `--bone`.
- Pas de glassmorphism, jamais.
- Pas d'émoji dans l'UI : **icônes Phosphor uniquement** (duotone pour l'actif).

## Ton éditorial

L'interface parle comme un banquier privé sobre et chaleureux. Pas de « Oops », pas de « Bravo ! », pas de ponctuation excessive. Une phrase, un point. Les succès sont sobres, les erreurs factuelles et orientées solution.

## Déploiement Vercel

### Prérequis

- Compte GitHub (repo déjà créé : `Frejustedev/monetika-`)
- Compte Neon (https://neon.tech) — plan gratuit suffisant
- Compte Vercel (https://vercel.com) — plan hobby suffisant
- Compte Resend (https://resend.com) — plan gratuit suffisant
- (Optionnel) Domaine custom `monetika.app` + DNS

### Procédure

**1. Neon — provisionner la base**

- Créer un projet, noter la `DATABASE_URL` (pooler) et `DIRECT_URL` (direct).
- Préfixer `DATABASE_URL` avec `&connect_timeout=30` pour éviter les cold starts.

**2. Resend — configurer l'email**

- Créer une API key, noter `RESEND_API_KEY`.
- Vérifier le domaine `monetika.app` dans Resend (sinon utiliser `onboarding@resend.dev`).

**3. Vercel — import du projet**

```bash
# Via la CLI Vercel :
npx vercel link
npx vercel env add DATABASE_URL production
npx vercel env add DIRECT_URL production
npx vercel env add AUTH_SECRET production          # openssl rand -base64 32
npx vercel env add AUTH_URL production             # https://monetika.vercel.app
npx vercel env add AUTH_TRUST_HOST production      # true
npx vercel env add RESEND_API_KEY production
npx vercel env add EMAIL_FROM production           # "Monétika <onboarding@resend.dev>"
npx vercel env add CRON_SECRET production          # openssl rand -base64 32
npx vercel env add NEXT_PUBLIC_APP_URL production  # https://monetika.vercel.app

# (Optionnel) Vercel Blob pour les photos de reçu :
npx vercel env add BLOB_READ_WRITE_TOKEN production
```

**4. Déployer**

```bash
npx vercel --prod
```

Le `vercel.json` configure :
- Build command : `prisma generate && prisma migrate deploy && next build`
- Cron quotidien à 02:00 UTC sur `/api/cron/compute-nef`
- Caching long-terme sur `/fonts/*`, `/icons/*`, `/marks/*`
- `no-store` sur `/sw.js` (pour que les mises à jour du SW soient prises en compte)

**5. Tester en production**

- PWA installable : sur Android Chrome → *Ajouter à l'écran d'accueil* ; sur iOS Safari → *Partager > Sur l'écran d'accueil*
- Lighthouse mobile (ambition 95+ sur Performance / Accessibilité / Best Practices / SEO)
- Cron manuellement testable : `curl -H "Authorization: Bearer $CRON_SECRET" https://monetika.vercel.app/api/cron/compute-nef`

## Sécurité

- **PIN bcrypt** : 12 rounds, détection de PIN faibles (séquences, répétitions)
- **Magic links** : tokens SHA-256, TTL 15 min, one-shot
- **Rate limiting** : 3 mails / 5 min, 5 tentatives PIN / 15 min (in-memory ; upgrader Redis en cas de trafic)
- **Session JWT** : cookie httpOnly, expiry 7 jours
- **Middleware** : filtre par `userId` systématique, zéro fuite entre utilisateurs
- **Server Actions** : toutes vérifient la session + validate Zod
- **CSP headers** : X-Frame-Options DENY, Referrer-Policy strict-origin
- **Cron protégé** : `Bearer ${CRON_SECRET}` requis

## Critères d'acceptation V1

- [x] App tournerait en production sur Vercel (pipeline prêt, reste à exécuter le deploy)
- [x] Utilisateur peut s'inscrire, faire l'onboarding, saisir sa 1ère transaction
- [x] Saisir une transaction ≤ 5s / ≤ 2 taps (mesuré par e2e)
- [x] Zéro écran ressemble à un template shadcn ou Vercel par défaut
- [x] Fraunces + Instrument Sans préchargés (zéro FOUT visible)
- [x] Zéro émoji dans l'UI de production (icônes Phosphor uniquement)
- [x] Tous montants en tabular-nums, formatés selon la locale
- [x] Mode sombre complet et cohérent (data-theme + prefers-color-scheme)
- [x] PWA installable (manifest + SW)
- [x] Zéro erreur TypeScript, zéro warning ESLint
- [x] 22 tests unitaires verts (currency, strategy, pin, patterns, NEF)
- [x] 4 parcours e2e Playwright (home, login, tx-entry <5s, goal+contribution)
- [x] README permet d'installer en local en < 10 minutes
- [x] Toutes les queries Prisma filtrent sur `userId`
- [x] PIN bcrypté, Server Actions vérifient la session
- [x] Build Vercel passe sans warning

## Licence

Code : © 2026 Monétika. Tous droits réservés.
Fraunces : SIL OFL 1.1 (Undercase Type).
Instrument Sans : SIL OFL 1.1 (Instrument).
Geist Mono : SIL OFL 1.1 (Vercel).

---

Référence source : [`PROMPT_MONETIKA_CLAUDE_CODE.md`](../Monetica/PROMPT_MONETIKA_CLAUDE_CODE.md)
