import 'server-only';
import { prisma } from '@/lib/db/client';
import type { StrategyBucket } from '@prisma/client';

export type Aggregate = {
  label: string;
  color: string;
  amount: number;
  share: number; // ∈ [0, 1]
};

export type MonthSummary = {
  year: number;
  month: number;
  currency: string;
  income: number;
  expense: number;
  net: number;
  savingsRate: number; // (income - expense) / income, 0 if income ≤ 0
  incomeBySource: Aggregate[]; // par catégorie pour les INCOME
  expenseByCategory: Aggregate[];
  bucketTotals: Array<{ bucket: StrategyBucket; amount: number }>;
  deltas?: MonthDeltas;
};

export type MonthDeltas = {
  income: number; // %
  expense: number;
  net: number;
  savingsRate: number; // points de pourcentage
};

export type YearSummary = {
  year: number;
  currency: string;
  byMonth: Array<{ month: number; income: number; expense: number }>;
  totalIncome: number;
  totalExpense: number;
  topExpenseCategories: Aggregate[];
  goalsProgress: Array<{ name: string; current: number; target: number; currency: string }>;
  prevYear?: { totalIncome: number; totalExpense: number };
};

export async function getMonthSummary(
  userId: string,
  year: number,
  month: number,
  options: { compareToPrevious?: boolean } = {},
): Promise<MonthSummary> {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);

  const [user, txs, accounts] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { primaryCurrency: true },
    }),
    prisma.transaction.findMany({
      where: { userId, occurredAt: { gte: start, lt: end } },
      include: {
        category: { select: { label: true, color: true } },
      },
    }),
    prisma.account.findMany({
      where: { userId, isArchived: false },
      select: { currency: true, currentBalance: true, strategyBucket: true },
    }),
  ]);

  const currency = user.primaryCurrency ?? 'XOF';

  // Totaux
  let income = 0;
  let expense = 0;
  const incomeMap = new Map<string, { label: string; color: string; amount: number }>();
  const expenseMap = new Map<string, { label: string; color: string; amount: number }>();

  for (const t of txs) {
    const amount = Number(t.amount);
    if (t.kind === 'INCOME') {
      income += amount;
      const key = t.categoryId ?? '_uncategorized';
      const label = t.category?.label ?? 'Non catégorisé';
      const color = t.category?.color ?? '#5B7A5E';
      const entry = incomeMap.get(key) ?? { label, color, amount: 0 };
      entry.amount += amount;
      incomeMap.set(key, entry);
    } else if (t.kind === 'EXPENSE') {
      expense += amount;
      const key = t.categoryId ?? '_uncategorized';
      const label = t.category?.label ?? 'Non catégorisé';
      const color = t.category?.color ?? '#B8552D';
      const entry = expenseMap.get(key) ?? { label, color, amount: 0 };
      entry.amount += amount;
      expenseMap.set(key, entry);
    }
  }

  const net = income - expense;
  const savingsRate = income > 0 ? (income - expense) / income : 0;

  const incomeBySource: Aggregate[] = Array.from(incomeMap.values())
    .sort((a, b) => b.amount - a.amount)
    .map((e) => ({ ...e, share: income > 0 ? e.amount / income : 0 }));

  const expenseByCategory: Aggregate[] = Array.from(expenseMap.values())
    .sort((a, b) => b.amount - a.amount)
    .map((e) => ({ ...e, share: expense > 0 ? e.amount / expense : 0 }));

  // Buckets (balances courantes en devise primaire — snapshot actuel, pas sur la période).
  const bucketMap = new Map<StrategyBucket, number>();
  for (const a of accounts) {
    if (a.currency !== currency || !a.strategyBucket) continue;
    bucketMap.set(a.strategyBucket, (bucketMap.get(a.strategyBucket) ?? 0) + Number(a.currentBalance));
  }
  const bucketTotals = Array.from(bucketMap.entries()).map(([bucket, amount]) => ({ bucket, amount }));

  let deltas: MonthDeltas | undefined;
  if (options.compareToPrevious) {
    const prevStart = new Date(year, month - 1, 1);
    const prevEnd = new Date(year, month, 1);
    const prevAgg = await prisma.transaction.groupBy({
      by: ['kind'],
      where: { userId, occurredAt: { gte: prevStart, lt: prevEnd } },
      _sum: { amount: true },
    });
    const prevIncome = Number(prevAgg.find((a) => a.kind === 'INCOME')?._sum.amount ?? 0);
    const prevExpense = Number(prevAgg.find((a) => a.kind === 'EXPENSE')?._sum.amount ?? 0);
    const prevNet = prevIncome - prevExpense;
    const prevSavingsRate = prevIncome > 0 ? (prevIncome - prevExpense) / prevIncome : 0;

    deltas = {
      income: prevIncome > 0 ? (income - prevIncome) / prevIncome : 0,
      expense: prevExpense > 0 ? (expense - prevExpense) / prevExpense : 0,
      net: prevNet !== 0 ? (net - prevNet) / Math.abs(prevNet) : 0,
      savingsRate: savingsRate - prevSavingsRate,
    };
  }

  return {
    year,
    month,
    currency,
    income,
    expense,
    net,
    savingsRate,
    incomeBySource,
    expenseByCategory,
    bucketTotals,
    deltas,
  };
}

export async function getYearSummary(userId: string, year: number): Promise<YearSummary> {
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const [user, byMonthRaw, topExpenseRaw, goals, prevTotalsRaw] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { primaryCurrency: true },
    }),
    prisma.$queryRaw<Array<{ month: number; kind: string; total: number }>>`
      SELECT EXTRACT(MONTH FROM "occurredAt")::int AS month, "kind"::text, SUM("amount")::float AS total
      FROM "Transaction"
      WHERE "userId" = ${userId} AND "occurredAt" >= ${start} AND "occurredAt" < ${end}
      GROUP BY month, "kind"
      ORDER BY month ASC
    `,
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        kind: 'EXPENSE',
        categoryId: { not: null },
        occurredAt: { gte: start, lt: end },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 10,
    }),
    prisma.goal.findMany({
      where: { userId, isAchieved: false },
      select: { name: true, currentAmount: true, targetAmount: true, currency: true },
      orderBy: { targetDate: 'asc' },
    }),
    prisma.transaction.groupBy({
      by: ['kind'],
      where: {
        userId,
        occurredAt: { gte: new Date(year - 1, 0, 1), lt: start },
      },
      _sum: { amount: true },
    }),
  ]);

  const currency = user.primaryCurrency ?? 'XOF';

  // Agrégation par mois (index 1-12 → 0-11).
  const monthMap = new Map<number, { income: number; expense: number }>();
  for (let m = 0; m < 12; m++) monthMap.set(m, { income: 0, expense: 0 });
  for (const row of byMonthRaw) {
    const key = row.month - 1;
    const entry = monthMap.get(key);
    if (!entry) continue;
    if (row.kind === 'INCOME') entry.income += Number(row.total);
    else if (row.kind === 'EXPENSE') entry.expense += Number(row.total);
  }

  const byMonth = Array.from(monthMap.entries()).map(([month, v]) => ({
    month,
    income: v.income,
    expense: v.expense,
  }));

  const totalIncome = byMonth.reduce((s, m) => s + m.income, 0);
  const totalExpense = byMonth.reduce((s, m) => s + m.expense, 0);

  // Top catégories — hydrater les labels / couleurs.
  const catIds = topExpenseRaw.map((r) => r.categoryId).filter((x): x is string => x !== null);
  const categories = catIds.length > 0 ? await prisma.category.findMany({ where: { id: { in: catIds } } }) : [];
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const topExpenseCategories: Aggregate[] = topExpenseRaw
    .map((r) => {
      const cat = r.categoryId ? catMap.get(r.categoryId) : null;
      if (!cat) return null;
      const amount = Number(r._sum.amount ?? 0);
      return {
        label: cat.label,
        color: cat.color,
        amount,
        share: totalExpense > 0 ? amount / totalExpense : 0,
      };
    })
    .filter((x): x is Aggregate => x !== null);

  const prevIncome = Number(prevTotalsRaw.find((p) => p.kind === 'INCOME')?._sum.amount ?? 0);
  const prevExpense = Number(prevTotalsRaw.find((p) => p.kind === 'EXPENSE')?._sum.amount ?? 0);

  return {
    year,
    currency,
    byMonth,
    totalIncome,
    totalExpense,
    topExpenseCategories,
    goalsProgress: goals.map((g) => ({
      name: g.name,
      current: Number(g.currentAmount),
      target: Number(g.targetAmount),
      currency: g.currency,
    })),
    prevYear:
      prevIncome > 0 || prevExpense > 0
        ? { totalIncome: prevIncome, totalExpense: prevExpense }
        : undefined,
  };
}
