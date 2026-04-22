// Note d'Évolution Financière — placeholder Phase 0.
// Implémentation complète des 7 critères en Phase 6.

export type NefBreakdown = {
  regularite: number;
  repartition: number;
  discipline: number;
  epargne: number;
  objectifs: number;
  diversification: number;
  tendance: number;
};

export type NefResult = {
  score: number;
  breakdown: NefBreakdown;
  level: 'excellent' | 'good' | 'average' | 'building';
};

export function levelFromScore(score: number): NefResult['level'] {
  if (score >= 800) return 'excellent';
  if (score >= 600) return 'good';
  if (score >= 400) return 'average';
  return 'building';
}

// Stub calcul — sera remplacé en Phase 6 par l'implémentation complète.
export function computeNefPlaceholder(): NefResult {
  const breakdown: NefBreakdown = {
    regularite: 0,
    repartition: 0,
    discipline: 0,
    epargne: 0,
    objectifs: 0,
    diversification: 0,
    tendance: 0,
  };
  return { score: 0, breakdown, level: 'building' };
}
