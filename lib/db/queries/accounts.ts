import 'server-only';
import { prisma } from '@/lib/db/client';
import type { AccountKind, StrategyBucket } from '@prisma/client';

export type AccountSummary = {
  id: string;
  label: string;
  institution: string;
  kind: AccountKind;
  currency: string;
  currentBalance: number;
  strategyBucket: StrategyBucket | null;
  color: string;
  icon: string;
  isBlocked: boolean;
  isArchived: boolean;
  lastReconciled: Date | null;
  createdAt: Date;
};

export async function listUserAccounts(userId: string, includeArchived = false): Promise<AccountSummary[]> {
  const accounts = await prisma.account.findMany({
    where: { userId, ...(includeArchived ? {} : { isArchived: false }) },
    orderBy: [{ strategyBucket: 'asc' }, { createdAt: 'asc' }],
  });
  return accounts.map((a) => ({
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
    isArchived: a.isArchived,
    lastReconciled: a.lastReconciled,
    createdAt: a.createdAt,
  }));
}

export async function getUserAccount(userId: string, accountId: string) {
  return prisma.account.findFirst({
    where: { id: accountId, userId },
  });
}

export async function getAccountTransactions(
  userId: string,
  accountId: string,
  options: { limit?: number; offset?: number } = {},
) {
  const { limit = 50, offset = 0 } = options;
  return prisma.transaction.findMany({
    where: { userId, accountId },
    orderBy: { occurredAt: 'desc' },
    skip: offset,
    take: limit,
    include: {
      category: { select: { id: true, label: true, icon: true, color: true } },
    },
  });
}
