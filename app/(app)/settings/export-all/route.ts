import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  const [user, accounts, transactions, budgets, goals, incomeSources, nefSnapshots] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        dateOfBirth: true,
        countryCode: true,
        primaryCurrency: true,
        locale: true,
        timezone: true,
        onboardedAt: true,
        createdAt: true,
      },
    }),
    prisma.account.findMany({ where: { userId: session.user.id } }),
    prisma.transaction.findMany({ where: { userId: session.user.id } }),
    prisma.budget.findMany({ where: { userId: session.user.id } }),
    prisma.goal.findMany({ where: { userId: session.user.id } }),
    prisma.incomeSource.findMany({ where: { userId: session.user.id } }),
    prisma.nefSnapshot.findMany({
      where: { userId: session.user.id },
      orderBy: { computedAt: 'asc' },
    }),
  ]);

  const dump = {
    exportedAt: new Date().toISOString(),
    format: 'monetika-full-export-v1',
    user,
    accounts: accounts.map((a) => ({ ...a, currentBalance: a.currentBalance.toString() })),
    transactions: transactions.map((t) => ({ ...t, amount: t.amount.toString() })),
    budgets: budgets.map((b) => ({ ...b, monthlyLimit: b.monthlyLimit.toString() })),
    goals: goals.map((g) => ({
      ...g,
      targetAmount: g.targetAmount.toString(),
      startingAmount: g.startingAmount.toString(),
      currentAmount: g.currentAmount.toString(),
    })),
    incomeSources: incomeSources.map((s) => ({ ...s, expectedAmount: s.expectedAmount.toString() })),
    nefSnapshots,
  };

  return new NextResponse(JSON.stringify(dump, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="monetika-export-${Date.now()}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}
