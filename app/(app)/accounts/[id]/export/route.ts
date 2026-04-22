import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const { id } = await params;

  const account = await prisma.account.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, label: true, currency: true },
  });
  if (!account) return new NextResponse('Not found', { status: 404 });

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.user.id, accountId: id },
    orderBy: { occurredAt: 'desc' },
    include: {
      category: { select: { label: true } },
      counterAccount: { select: { label: true } },
    },
  });

  const header = [
    'date',
    'kind',
    'amount',
    'currency',
    'category',
    'merchant',
    'counterparty',
    'note',
  ];
  const rows = transactions.map((t) => [
    t.occurredAt.toISOString(),
    t.kind,
    t.amount.toString(),
    t.currency,
    t.category?.label ?? '',
    t.merchant ?? '',
    t.counterAccount?.label ?? '',
    (t.note ?? '').replace(/"/g, '""'),
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n');

  const filename = `monetika-${account.label.replace(/\s+/gu, '-').toLowerCase()}-${Date.now()}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
