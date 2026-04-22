# Monétika

Un journal financier pour l'Afrique de l'Ouest francophone et anglophone (UEMOA + Nigeria + Ghana).

> V1 sans Open Banking, sans Mobile Money API, sans SGI. L'utilisateur **saisit** ses comptes, soldes, revenus et dépenses. C'est un outil de **pleine conscience financière**.

## Stack

| Couche | Choix |
|---|---|
| Framework | Next.js 15 (App Router, RSC, Server Actions) |
| Langage | TypeScript strict |
| Styles | Tailwind CSS v4 + CSS Variables |
| Animation | `motion` (ex Framer Motion) |
| Icônes | `@phosphor-icons/react` |
| Typographie | Fraunces + Instrument Sans + Geist Mono (locales via `next/font`) |
| ORM | Prisma 6 |
| Base | Postgres via Neon (serverless) |
| Auth | Auth.js v5 (magic link + PIN 6 chiffres) |
| i18n | `next-intl` (fr/en) |
| Tests | Vitest (unit) + Playwright (e2e) |
| CI/CD | GitHub Actions + Vercel |

## Setup local (< 10 min)

```bash
# 1. Cloner & installer
git clone <repo> monetika
cd monetika
npm install

# 2. Variables d'environnement
cp .env.example .env.local
# Renseignez au minimum DATABASE_URL, DIRECT_URL, AUTH_SECRET (déjà fourni par défaut en .env.example)

# 3. Schéma DB + seed
npm run prisma:generate
npm run prisma:migrate       # première migration
npm run prisma:seed          # utilisateur démo (Koffi, Bénin) + 4 comptes

# 4. Lancer en dev
npm run dev
```

Ouvrez http://localhost:3000.

## Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` | Dev server Next.js |
| `npm run build` | Build production |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run format` | Prettier écriture |
| `npm run test` | Tests unitaires (Vitest) |
| `npm run test:e2e` | Tests e2e (Playwright) |
| `npm run prisma:studio` | Prisma Studio |
| `npm run prisma:seed` | Seed base |

## Architecture

```
monetika/
├── app/
│   ├── (auth)/           Auth routes (login, signup)
│   ├── (onboarding)/     Onboarding multi-étapes
│   ├── (app)/            Shell protégé (dashboard, comptes, …)
│   ├── api/              Routes serveur & cron
│   ├── fonts.ts          Fraunces + Instrument Sans + Geist Mono
│   ├── globals.css       Tailwind v4 + tokens
│   ├── tokens.css        Palette Sable & Forêt
│   ├── layout.tsx        Shell racine (providers, metadata)
│   ├── manifest.ts       PWA manifest
│   ├── page.tsx          Home éditoriale
│   ├── not-found.tsx     404 éditorial
│   └── error.tsx         Error boundary
├── components/
│   ├── ui/               Composants UI sur-mesure (pas de shadcn brut)
│   ├── charts/           SVG sur mesure
│   ├── money/            Amount, Currency, …
│   ├── layout/           Header, BottomNav, Wordmark
│   └── marketing/        Landing composants
├── lib/
│   ├── auth/             Auth.js v5
│   ├── db/               Prisma client
│   ├── money/            Formatage, conversions
│   ├── scoring/          Calcul NEF
│   └── strategy/         Stratégie 6 comptes
├── server/actions/       Server Actions par domaine
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── messages/             fr.json, en.json (i18n)
├── public/
│   ├── fonts/            Fraunces / Instrument Sans / Geist Mono TTF
│   ├── icons/            PWA icons (16 → 1024)
│   ├── marks/            SVG logo officiels
│   └── og-image.png
├── tests/{unit,e2e}/
└── .github/workflows/ci.yml
```

## Design system — Sable & Forêt

Palette complète dans `app/tokens.css`. Règles non négociables :

- **Jamais** de `#FFFFFF` pur → `--paper` `#F5F1E8`.
- **Jamais** de `#000000` pur → `--ink` `#17160F`.
- Max 3 couleurs d'accent par écran.
- Chiffres en **tabular-nums** partout.
- Montants en **Fraunces** (serif éditoriale), jamais Instrument Sans.
- Symboles monétaires à 60–70% de la taille du chiffre.
- Radius : **4 / 10 / 20**. Pas de `rounded-full` sur les boutons primaires.
- Pas d'ombre : **ligne** de séparation 0.5px en `--bone`.
- Pas de glassmorphism, jamais.
- Pas d'émoji dans l'UI : **icônes Phosphor uniquement**.

## Ton éditorial

Tout le contenu de l'app parle comme un banquier privé sobre et chaleureux. Pas de « Oops », pas de « Bravo ! », pas de ponctuation excessive. Une phrase, un point.

## Roadmap

Phase 0 (✅ fait) — Fondations : scaffold, fonts, tokens, i18n, schéma Prisma, home éditoriale.
Phase 1 — Auth.js v5 + onboarding 7 étapes.
Phase 2 — Comptes + dashboard.
Phase 3 — **Saisie de transactions en < 5 s / 2 taps** (la phase critique).
Phase 4 — Budgets & catégories.
Phase 5 — Objectifs.
Phase 6 — Note d'Évolution Financière.
Phase 7 — Récapitulatifs & insights.
Phase 8 — Paramètres.
Phase 9 — PWA, i18n, polish.
Phase 10 — Tests, déploiement, doc.

Détails dans `PROMPT_MONETIKA_CLAUDE_CODE.md`.

## Licence

Code : © 2026 Monétika. Tous droits réservés.
Fraunces : SIL OFL 1.1 (Undercase Type).
Instrument Sans : SIL OFL 1.1 (Instrument).
Geist Mono : SIL OFL 1.1 (Vercel).
