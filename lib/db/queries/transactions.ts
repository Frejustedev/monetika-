import 'server-only';
import { prisma } from '@/lib/db/client';
import type { TransactionKind } from '@prisma/client';

export type TransactionListFilters = {
  kind?: TransactionKind;
  accountId?: string;
  categoryId?: string;
  from?: Date;
  to?: Date;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
};

export async function listTransactions(
  userId: string,
  filters: TransactionListFilters = {},
  options: { limit?: number; offset?: number } = {},
) {
  const { limit = 100, offset = 0 } = options;
  return prisma.transaction.findMany({
    where: {
      userId,
      ...(filters.kind ? { kind: filters.kind } : {}),
      ...(filters.accountId ? { accountId: filters.accountId } : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.from || filters.to
        ? {
            occurredAt: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
      ...(filters.minAmount !== undefined || filters.maxAmount !== undefined
        ? {
            amount: {
              ...(filters.minAmount !== undefined ? { gte: filters.minAmount } : {}),
              ...(filters.maxAmount !== undefined ? { lte: filters.maxAmount } : {}),
            },
          }
        : {}),
      ...(filters.search
        ? {
            OR: [
              { note: { contains: filters.search, mode: 'insensitive' } },
              { merchant: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { occurredAt: 'desc' },
    skip: offset,
    take: limit,
    include: {
      account: { select: { id: true, label: true, color: true } },
      category: { select: { id: true, label: true, icon: true, color: true } },
    },
  });
}

// Top N catégories les plus utilisées par l'utilisateur sur 90 j.
export async function topCategoriesForUser(userId: string, limit = 8) {
  const since = new Date(Date.now() - 90 * 86400_000);
  const grouped = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      userId,
      categoryId: { not: null },
      kind: 'EXPENSE',
      occurredAt: { gte: since },
    },
    _count: { _all: true },
    orderBy: { _count: { categoryId: 'desc' } },
    take: limit,
  });
  const ids = grouped.map((g) => g.categoryId).filter((x): x is string => x !== null);
  if (ids.length === 0) return [];
  const categories = await prisma.category.findMany({ where: { id: { in: ids } } });
  const order = new Map(ids.map((id, i) => [id, i]));
  return categories.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

// Catégories accessibles à l'utilisateur : système + ses personnalisées.
export async function userCategories(userId: string) {
  return prisma.category.findMany({
    where: { OR: [{ isSystem: true }, { userId }] },
    orderBy: [{ isSystem: 'desc' }, { label: 'asc' }],
  });
}

export async function activeAccountsForUser(userId: string) {
  return prisma.account.findMany({
    where: { userId, isArchived: false },
    orderBy: [{ strategyBucket: 'asc' }, { createdAt: 'asc' }],
  });
}
