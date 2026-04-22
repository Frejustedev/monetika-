import 'server-only';
import { prisma } from '@/lib/db/client';
import type { StrategyBucket } from '@prisma/client';

export type GoalProgress = {
  id: string;
  name: string;
  targetAmount: number;
  startingAmount: number;
  currentAmount: number;
  currency: string;
  targetDate: Date;
  strategyBucket: StrategyBucket;
  accountId: string | null;
  accountLabel: string | null;
  isAchieved: boolean;
  achievedAt: Date | null;
  createdAt: Date;

  // Calculs dérivés
  progressPct: number; // 0..1 sur targetAmount
  monthsLeft: number;
  monthlyContributionNeeded: number;
};

export async function listGoals(userId: string, includeAchieved = true): Promise<GoalProgress[]> {
  const goals = await prisma.goal.findMany({
    where: { userId, ...(includeAchieved ? {} : { isAchieved: false }) },
    orderBy: [{ isAchieved: 'asc' }, { targetDate: 'asc' }],
    include: {
      account: { select: { id: true, label: true } },
    },
  });

  const now = new Date();
  return goals.map((g) => {
    const current = Number(g.currentAmount);
    const target = Number(g.targetAmount);
    const starting = Number(g.startingAmount);
    const progress = target > 0 ? Math.max(0, Math.min(1, (current - starting) / (target - starting || 1))) : 0;

    const monthsLeft = Math.max(
      0,
      Math.floor((g.targetDate.getTime() - now.getTime()) / (30 * 86400_000)),
    );
    const remaining = Math.max(0, target - current);
    const monthlyNeeded = monthsLeft > 0 ? Math.ceil(remaining / monthsLeft) : remaining;

    return {
      id: g.id,
      name: g.name,
      targetAmount: target,
      startingAmount: starting,
      currentAmount: current,
      currency: g.currency,
      targetDate: g.targetDate,
      strategyBucket: g.strategyBucket,
      accountId: g.accountId,
      accountLabel: g.account?.label ?? null,
      isAchieved: g.isAchieved,
      achievedAt: g.achievedAt,
      createdAt: g.createdAt,
      progressPct: progress,
      monthsLeft,
      monthlyContributionNeeded: monthlyNeeded,
    };
  });
}

export async function getGoalWithHistory(userId: string, goalId: string) {
  const goal = await prisma.goal.findFirst({
    where: { id: goalId, userId },
    include: {
      account: { select: { id: true, label: true, currency: true } },
    },
  });
  if (!goal) return null;

  // Historique des contributions (pour le graphique de projection).
  // Une contribution = INCOME sur le compte lié au goal, depuis createdAt, marquée via note.
  const contributions = goal.accountId
    ? await prisma.transaction.findMany({
        where: {
          userId,
          accountId: goal.accountId,
          kind: 'INCOME',
          occurredAt: { gte: goal.createdAt },
          note: { contains: `goal:${goal.id}` },
        },
        orderBy: { occurredAt: 'asc' },
        select: { id: true, amount: true, occurredAt: true, note: true },
      })
    : [];

  return { goal, contributions };
}
