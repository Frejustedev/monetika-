// Note d'Évolution Financière — 7 critères pondérés, score 0-1000.
// Le prompt Monétika renvoie à un cahier absent : les 7 critères sont
// dérivés de la philosophie produit (pleine conscience financière,
// stratégie 6 comptes, discipline manuelle).

import 'server-only';
import { prisma } from '@/lib/db/client';
import type { StrategyBucket } from '@prisma/client';
import { DEFAULT_STRATEGY, BUCKETS, type BucketKey } from '@/lib/strategy/buckets';

export type CriterionKey =
  | 'regularity'
  | 'strategyAdherence'
  | 'budgetDiscipline'
  | 'savingsRate'
  | 'goalProgress'
  | 'diversification'
  | 'trend';

export type CriterionScore = {
  key: CriterionKey;
  score: number; // 0-100
  weight: number; // somme = 1000 sur les 7
};

export type NefResult = {
  score: number; // 0-1000
  breakdown: Record<CriterionKey, { score: number; weight: number }>;
  level: 'excellent' | 'good' | 'average' | 'building';
  recommendations: Array<{ key: CriterionKey; message: string }>;
  computedAt: Date;
  periodStart: Date;
  periodEnd: Date;
};

// Pondérations : total = 1000.
const WEIGHTS: Record<CriterionKey, number> = {
  strategyAdherence: 200,
  regularity: 150,
  budgetDiscipline: 150,
  savingsRate: 150,
  trend: 150,
  goalProgress: 100,
  diversification: 100,
};

export function levelFromScore(score: number): NefResult['level'] {
  if (score >= 800) return 'excellent';
  if (score >= 600) return 'good';
  if (score >= 400) return 'average';
  return 'building';
}

export async function computeNefForUser(userId: string, referenceDate: Date = new Date()): Promise<NefResult> {
  const periodEnd = new Date(referenceDate);
  const periodStart = new Date(referenceDate);
  periodStart.setMonth(periodStart.getMonth() - 3); // fenêtre glissante de 3 mois

  const [accounts, transactions, budgets, goals, user] = await Promise.all([
    prisma.account.findMany({
      where: { userId, isArchived: false },
      select: { id: true, currency: true, currentBalance: true, strategyBucket: true, kind: true },
    }),
    prisma.transaction.findMany({
      where: { userId, occurredAt: { gte: periodStart, lte: periodEnd } },
      select: {
        id: true,
        kind: true,
        amount: true,
        occurredAt: true,
        categoryId: true,
        strategyBucket: true,
      },
    }),
    prisma.budget.findMany({
      where: { userId },
      select: { categoryId: true, monthlyLimit: true },
    }),
    prisma.goal.findMany({
      where: { userId, isAchieved: false },
      select: { targetAmount: true, currentAmount: true, startingAmount: true, targetDate: true, createdAt: true },
    }),
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { primaryCurrency: true, strategyConfig: true },
    }),
  ]);

  const primaryCurrency = user.primaryCurrency ?? 'XOF';

  const regularity = scoreRegularity(transactions, periodStart, periodEnd);
  const strategyAdherence = scoreStrategyAdherence(
    accounts.filter((a) => a.currency === primaryCurrency),
    user.strategyConfig,
  );
  const budgetDiscipline = scoreBudgetDiscipline(transactions, budgets, referenceDate);
  const savingsRate = scoreSavingsRate(transactions);
  const goalProgress = scoreGoalProgress(goals, referenceDate);
  const diversification = scoreDiversification(accounts);
  const trend = await scoreTrend(userId, primaryCurrency);

  const criteria: Record<CriterionKey, number> = {
    regularity,
    strategyAdherence,
    budgetDiscipline,
    savingsRate,
    goalProgress,
    diversification,
    trend,
  };

  const totalScore = (Object.keys(criteria) as CriterionKey[]).reduce((sum, k) => {
    return sum + Math.round((criteria[k] / 100) * WEIGHTS[k]);
  }, 0);

  const breakdown = (Object.keys(criteria) as CriterionKey[]).reduce(
    (acc, k) => {
      acc[k] = { score: Math.round(criteria[k]), weight: WEIGHTS[k] };
      return acc;
    },
    {} as Record<CriterionKey, { score: number; weight: number }>,
  );

  const recommendations = buildRecommendations(breakdown);

  return {
    score: Math.min(1000, Math.max(0, totalScore)),
    breakdown,
    level: levelFromScore(totalScore),
    recommendations,
    computedAt: new Date(),
    periodStart,
    periodEnd,
  };
}

// —— Critère 1 : Régularité de saisie ——
// Une saisie régulière = entries dispersées dans le temps, pas un rush mensuel.
// On regarde le % de jours avec au moins une transaction sur les 90 j.
function scoreRegularity(
  txs: Array<{ occurredAt: Date }>,
  start: Date,
  end: Date,
): number {
  if (txs.length === 0) return 0;
  const daySet = new Set(txs.map((t) => new Date(t.occurredAt).toISOString().slice(0, 10)));
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400_000));
  const density = daySet.size / totalDays;
  // 40% des jours avec au moins une saisie = score 100.
  return Math.min(100, Math.round((density / 0.4) * 100));
}

// —— Critère 2 : Adhérence à la stratégie 6 comptes ——
// Compare la répartition du patrimoine par bucket aux pourcentages cibles.
function scoreStrategyAdherence(
  accounts: Array<{ currentBalance: { toString: () => string }; strategyBucket: StrategyBucket | null }>,
  config: { necessities: number; emergency: number; education: number; investment: number; joy: number; give: number } | null,
): number {
  const target: Record<BucketKey, number> = config
    ? {
        NECESSITIES: config.necessities,
        EMERGENCY: config.emergency,
        EDUCATION: config.education,
        INVESTMENT: config.investment,
        JOY: config.joy,
        GIVE: config.give,
      }
    : DEFAULT_STRATEGY;

  const sums: Record<BucketKey, number> = {
    NECESSITIES: 0, EMERGENCY: 0, EDUCATION: 0, INVESTMENT: 0, JOY: 0, GIVE: 0,
  };
  let total = 0;
  for (const a of accounts) {
    const amount = Number(a.currentBalance);
    total += amount;
    if (a.strategyBucket) sums[a.strategyBucket] += amount;
  }
  if (total <= 0) return 0;

  let totalDeviation = 0;
  for (const k of BUCKETS) {
    const actualPct = (sums[k] / total) * 100;
    const targetPct = target[k];
    totalDeviation += Math.abs(actualPct - targetPct);
  }
  // Déviation 0 = 100, déviation 100% = 0.
  return Math.max(0, 100 - totalDeviation);
}

// —— Critère 3 : Discipline budgétaire ——
// % de catégories budgétées sous leur plafond ce mois-ci.
function scoreBudgetDiscipline(
  txs: Array<{ kind: string; amount: { toString: () => string }; categoryId: string | null; occurredAt: Date }>,
  budgets: Array<{ categoryId: string; monthlyLimit: { toString: () => string } }>,
  refDate: Date,
): number {
  if (budgets.length === 0) return 50; // neutre : pas de budget défini

  const startMonth = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
  const spentByCategory = new Map<string, number>();
  for (const t of txs) {
    if (t.kind !== 'EXPENSE' || !t.categoryId) continue;
    if (t.occurredAt < startMonth) continue;
    spentByCategory.set(t.categoryId, (spentByCategory.get(t.categoryId) ?? 0) + Number(t.amount));
  }

  let under = 0;
  let partial = 0;
  for (const b of budgets) {
    const limit = Number(b.monthlyLimit);
    const spent = spentByCategory.get(b.categoryId) ?? 0;
    const ratio = limit > 0 ? spent / limit : 0;
    if (ratio <= 0.7) under++;
    else if (ratio < 1) partial++;
  }
  const score = ((under + partial * 0.5) / budgets.length) * 100;
  return Math.round(score);
}

// —— Critère 4 : Taux d'épargne ——
// (revenus - dépenses) / revenus sur la période.
function scoreSavingsRate(
  txs: Array<{ kind: string; amount: { toString: () => string } }>,
): number {
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    if (t.kind === 'INCOME') income += Number(t.amount);
    else if (t.kind === 'EXPENSE') expense += Number(t.amount);
  }
  if (income <= 0) return 0;
  const rate = (income - expense) / income;
  // 30% d'épargne = score 100 ; 0% = 0 ; négatif = 0 ; borne à 100.
  return Math.max(0, Math.min(100, Math.round((rate / 0.3) * 100)));
}

// —— Critère 5 : Progression des objectifs ——
function scoreGoalProgress(
  goals: Array<{
    targetAmount: { toString: () => string };
    currentAmount: { toString: () => string };
    startingAmount: { toString: () => string };
    targetDate: Date;
    createdAt: Date;
  }>,
  refDate: Date,
): number {
  if (goals.length === 0) return 50; // neutre : pas d'objectif

  let sumRatio = 0;
  for (const g of goals) {
    const target = Number(g.targetAmount);
    const starting = Number(g.startingAmount);
    const current = Number(g.currentAmount);
    if (target <= starting) continue;

    const elapsed = refDate.getTime() - g.createdAt.getTime();
    const totalDuration = g.targetDate.getTime() - g.createdAt.getTime();
    const timeRatio = totalDuration > 0 ? Math.max(0, Math.min(1, elapsed / totalDuration)) : 0;
    const progressRatio = Math.max(0, Math.min(1, (current - starting) / (target - starting)));

    // En avance = score > 100 (plafonné) ; en retard = < 100.
    const relative = timeRatio > 0 ? progressRatio / timeRatio : progressRatio;
    sumRatio += Math.min(1.5, relative);
  }
  const avg = sumRatio / goals.length;
  return Math.max(0, Math.min(100, Math.round(avg * 80))); // 80 = score plein à 1.0
}

// —— Critère 6 : Diversification des comptes ——
function scoreDiversification(
  accounts: Array<{ kind: string; strategyBucket: StrategyBucket | null }>,
): number {
  const kinds = new Set(accounts.map((a) => a.kind));
  const buckets = new Set(accounts.map((a) => a.strategyBucket).filter(Boolean));
  // 4 types distincts OU 4 buckets utilisés = 100.
  const kindScore = Math.min(100, (kinds.size / 4) * 100);
  const bucketScore = Math.min(100, (buckets.size / 4) * 100);
  return Math.round((kindScore + bucketScore) / 2);
}

// —— Critère 7 : Tendance du patrimoine ——
// On compare le NetWorth actuel (en devise primaire) au snapshot d'il y a 3 mois.
async function scoreTrend(userId: string, primaryCurrency: string): Promise<number> {
  const accounts = await prisma.account.findMany({
    where: { userId, isArchived: false, currency: primaryCurrency },
    select: { currentBalance: true },
  });
  const currentNetWorth = accounts.reduce((s, a) => s + Number(a.currentBalance), 0);

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const prevSnapshot = await prisma.nefSnapshot.findFirst({
    where: { userId, computedAt: { lte: threeMonthsAgo } },
    orderBy: { computedAt: 'desc' },
  });

  if (!prevSnapshot) return 50; // neutre : pas d'historique
  const prevBreakdown = prevSnapshot.breakdown as unknown as { netWorthSnapshot?: number };
  const prev = Number(prevBreakdown.netWorthSnapshot ?? 0);
  if (prev <= 0) return 50;

  const growth = (currentNetWorth - prev) / prev;
  // +15% sur 3 mois = score 100.
  return Math.max(0, Math.min(100, Math.round((growth / 0.15) * 100 + 50)));
}

// —— Recommandations : top 3 critères les plus faibles ——
function buildRecommendations(
  breakdown: Record<CriterionKey, { score: number; weight: number }>,
): Array<{ key: CriterionKey; message: string }> {
  const RECOMMENDATIONS: Record<CriterionKey, string> = {
    regularity:
      'Saisissez chaque jour, même de petites dépenses. La régularité nourrit la conscience financière.',
    strategyAdherence:
      'Ajustez la répartition de vos comptes pour coller à votre stratégie 6 comptes.',
    budgetDiscipline:
      'Définissez un plafond mensuel sur vos catégories de dépense principales.',
    savingsRate:
      'Visez un taux d\u2019épargne de 20 à 30 % de vos revenus mensuels.',
    goalProgress:
      'Programmez une contribution mensuelle à vos objectifs, même modeste.',
    diversification:
      'Répartissez vos soldes entre plusieurs types de comptes (courant, épargne, investissement).',
    trend:
      'Continuez à consigner chaque mouvement. La tendance patrimoine se lit sur la durée.',
  };

  const entries = (Object.keys(breakdown) as CriterionKey[])
    .map((k) => ({ key: k, score: breakdown[k].score }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  return entries.map((e) => ({ key: e.key, message: RECOMMENDATIONS[e.key] }));
}

// —— Persistance snapshot ——
export async function persistNefSnapshot(userId: string, result: NefResult, netWorth: number) {
  // On stocke netWorth dans breakdown.netWorthSnapshot pour permettre la tendance future.
  const breakdownWithNw = {
    ...result.breakdown,
    netWorthSnapshot: netWorth,
  };
  return prisma.nefSnapshot.create({
    data: {
      userId,
      score: result.score,
      breakdown: breakdownWithNw,
      computedAt: result.computedAt,
      periodStart: result.periodStart,
      periodEnd: result.periodEnd,
    },
  });
}

// —— Récupère le dernier snapshot OU recalcule si obsolète (> 24 h) ——
export async function getLatestOrComputeNef(userId: string): Promise<NefResult> {
  const last = await prisma.nefSnapshot.findFirst({
    where: { userId },
    orderBy: { computedAt: 'desc' },
  });

  const stale =
    !last || Date.now() - last.computedAt.getTime() > 86400_000;

  if (!stale && last) {
    // On reconstruit NefResult à partir du snapshot (sans recommendations → on les refait ad hoc).
    const breakdown = last.breakdown as unknown as Record<CriterionKey, { score: number; weight: number }>;
    return {
      score: last.score,
      breakdown,
      level: levelFromScore(last.score),
      recommendations: buildRecommendations(breakdown),
      computedAt: last.computedAt,
      periodStart: last.periodStart,
      periodEnd: last.periodEnd,
    };
  }

  const result = await computeNefForUser(userId);
  const accounts = await prisma.account.findMany({
    where: { userId, isArchived: false },
    select: { currentBalance: true, currency: true },
  });
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { primaryCurrency: true },
  });
  const netWorth = accounts
    .filter((a) => a.currency === (user.primaryCurrency ?? 'XOF'))
    .reduce((s, a) => s + Number(a.currentBalance), 0);

  await persistNefSnapshot(userId, result, netWorth);
  return result;
}

// —— Historique pour sparkline ——
export async function getNefHistory(userId: string, months = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);
  const snapshots = await prisma.nefSnapshot.findMany({
    where: { userId, computedAt: { gte: since } },
    orderBy: { computedAt: 'asc' },
    select: { score: true, computedAt: true },
  });
  return snapshots;
}
