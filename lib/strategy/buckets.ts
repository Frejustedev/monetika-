// Stratégie 6 comptes — §5 du prompt.
// Les pourcentages par défaut suivent la répartition 55/10/10/10/5/5.

import type { StrategyBucket } from '@prisma/client';

export type BucketKey =
  | 'NECESSITIES'
  | 'EMERGENCY'
  | 'EDUCATION'
  | 'INVESTMENT'
  | 'JOY'
  | 'GIVE';

// Répartition par défaut : 55/15/10/10/5/5 = 100.
// Boost de l'urgence (15%) cohérent avec le contexte ouest-africain
// où les chocs financiers (santé, aide familiale, cérémonies) sont fréquents.
export const DEFAULT_STRATEGY: Record<BucketKey, number> = {
  NECESSITIES: 55,
  EMERGENCY: 15,
  EDUCATION: 10,
  INVESTMENT: 10,
  JOY: 5,
  GIVE: 5,
};

export const BUCKET_LABELS_FR: Record<BucketKey, { long: string; short: string }> = {
  NECESSITIES: { long: 'Nécessités', short: 'N' },
  EMERGENCY: { long: 'Urgence', short: 'FU' },
  EDUCATION: { long: 'Éducation', short: 'EDU' },
  INVESTMENT: { long: 'Investissement', short: 'INV' },
  JOY: { long: 'Joie', short: 'JOY' },
  GIVE: { long: 'Partage', short: 'GIVE' },
};

export const BUCKET_LABELS_EN: Record<BucketKey, { long: string; short: string }> = {
  NECESSITIES: { long: 'Necessities', short: 'N' },
  EMERGENCY: { long: 'Emergency', short: 'FU' },
  EDUCATION: { long: 'Education', short: 'EDU' },
  INVESTMENT: { long: 'Investment', short: 'INV' },
  JOY: { long: 'Joy', short: 'JOY' },
  GIVE: { long: 'Give', short: 'GIVE' },
};

// Palette d'accent par bucket — cohérente avec les tokens Sable & Forêt
export const BUCKET_COLORS: Record<BucketKey, string> = {
  NECESSITIES: 'var(--forest)',
  EMERGENCY: 'var(--terracotta)',
  EDUCATION: 'var(--sky)',
  INVESTMENT: 'var(--clay)',
  JOY: 'var(--ochre)',
  GIVE: 'var(--moss)',
};

export function validateStrategy(pct: Record<BucketKey, number>): {
  ok: boolean;
  total: number;
  drift: number;
} {
  const total = Object.values(pct).reduce((sum, v) => sum + v, 0);
  const drift = total - 100;
  return { ok: drift === 0, total, drift };
}

// Garde-fou TS : s'assurer que l'enum Prisma couvre tous les buckets UI.
export const BUCKETS: BucketKey[] = [
  'NECESSITIES',
  'EMERGENCY',
  'EDUCATION',
  'INVESTMENT',
  'JOY',
  'GIVE',
];

// Cast d'export — utile côté serveur quand on type un champ Prisma.
export type PrismaBucket = StrategyBucket;
