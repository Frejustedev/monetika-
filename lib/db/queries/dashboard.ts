import 'server-only';
import { prisma } from '@/lib/db/client';
import type { StrategyBucket, TransactionKind } from '@prisma/client';

export type DashboardData = {
  user: {
    id: string;
    firstName: string | null;
    locale: string;
    countryCode: string | null;
    primaryCurrency: string | null;
  };
  netWorth: {
    primary: number;
    primaryCurrency: string;
    otherCurrenciesCount: number;
  };
  accounts: Array<{
    id: string;
    label: string;
    institution: string;
    kind: string;
    currency: string;
    currentBalance: number;
    strategyBucket: StrategyBucket | null;
    color: string;
    icon: string;
    isBlocked: boolean;
  }>;
  bucketTotals: Array<{ bucket: StrategyBucket; amount: number }>;
  recentTransactions: Array<{
    id: string;
    occurredAt: Date;
    kind: TransactionKind;
    amount: number;
    currency: string;
    note: string | null;
    merchant: string | null;
    accountLabel: string;
    categoryLabel: string | null;
  }>;
  insight: { text: string } | null;
};

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const [user, accounts, recentRaw] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        locale: true,
        countryCode: true,
        primaryCurrency: true,
      },
    }),
    prisma.account.findMany({
      where: { userId, isArchived: false },
      orderBy: [{ strategyBucket: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { occurredAt: 'desc' },
      take: 5,
      include: {
        account: { select: { label: true } },
        category: { select: { label: true } },
      },
    }),
  ]);

  const primaryCurrency = user.primaryCurrency ?? 'XOF';
  const inPrimary = accounts.filter((a) => a.currency === primaryCurrency);
  const otherCurrencies = new Set(accounts.filter((a) => a.currency !== primaryCurrency).map((a) => a.currency));

  const primarySum = inPrimary.reduce((sum, a) => sum + Number(a.currentBalance), 0);

  // Totaux par bucket (uniquement devise primaire pour l'instant).
  const bucketMap = new Map<StrategyBucket, number>();
  for (const a of inPrimary) {
    if (!a.strategyBucket) continue;
    bucketMap.set(a.strategyBucket, (bucketMap.get(a.strategyBucket) ?? 0) + Number(a.currentBalance));
  }

  const insight = await buildInsightOfTheDay(userId, user.locale as 'fr' | 'en');

  return {
    user,
    netWorth: {
      primary: primarySum,
      primaryCurrency,
      otherCurrenciesCount: otherCurrencies.size,
    },
    accounts: accounts.map((a) => ({
      id: a.id,
      label: a.label,
      institution: a.institution,
      kind: a.kind,
      currency: a.currency,
      currentBalance: Number(a.currentBalance),
      strategyBucket: a.strategyBucket,
      color: a.color,
      icon: a.icon,
      isBlocked: a.isBlocked,
    })),
    bucketTotals: Array.from(bucketMap.entries()).map(([bucket, amount]) => ({ bucket, amount })),
    recentTransactions: recentRaw.map((t) => ({
      id: t.id,
      occurredAt: t.occurredAt,
      kind: t.kind,
      amount: Number(t.amount),
      currency: t.currency,
      note: t.note,
      merchant: t.merchant,
      accountLabel: t.account.label,
      categoryLabel: t.category?.label ?? null,
    })),
    insight,
  };
}

// Insight du jour — règle simple V1 : catégorie avec plus forte variation mois N vs N-1.
async function buildInsightOfTheDay(
  userId: string,
  locale: 'fr' | 'en',
): Promise<{ text: string } | null> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [current, previous] = await Promise.all([
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        kind: 'EXPENSE',
        occurredAt: { gte: startOfMonth, lt: now },
        categoryId: { not: null },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        kind: 'EXPENSE',
        occurredAt: { gte: startOfLastMonth, lt: startOfMonth },
        categoryId: { not: null },
      },
      _sum: { amount: true },
    }),
  ]);

  if (current.length === 0) return null;

  const previousMap = new Map(previous.map((p) => [p.categoryId, Number(p._sum.amount ?? 0)]));
  let biggestVariation: { categoryId: string; variation: number; current: number; previous: number } | null = null;

  for (const row of current) {
    if (!row.categoryId) continue;
    const currentAmount = Number(row._sum.amount ?? 0);
    const previousAmount = previousMap.get(row.categoryId) ?? 0;
    if (previousAmount <= 0) continue;
    const variation = (currentAmount - previousAmount) / previousAmount;
    if (!biggestVariation || Math.abs(variation) > Math.abs(biggestVariation.variation)) {
      biggestVariation = { categoryId: row.categoryId, variation, current: currentAmount, previous: previousAmount };
    }
  }

  if (!biggestVariation || Math.abs(biggestVariation.variation) < 0.1) return null;

  const cat = await prisma.category.findUnique({
    where: { id: biggestVariation.categoryId },
    select: { label: true },
  });
  if (!cat) return null;

  const pct = Math.abs(biggestVariation.variation * 100).toFixed(0);
  const isUp = biggestVariation.variation > 0;
  const text =
    locale === 'fr'
      ? isUp
        ? `Vous dépensez ${pct}% de plus en ${cat.label.toLowerCase()} ce mois-ci.`
        : `Vous dépensez ${pct}% de moins en ${cat.label.toLowerCase()} ce mois-ci.`
      : isUp
        ? `You are spending ${pct}% more on ${cat.label.toLowerCase()} this month.`
        : `You are spending ${pct}% less on ${cat.label.toLowerCase()} this month.`;

  return { text };
}
