import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { computeNefForUser, persistNefSnapshot } from '@/lib/scoring/nef';

// Endpoint Vercel Cron — protégé par CRON_SECRET.
// Recalcule la NEF pour tous les utilisateurs onboardés.

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { onboardedAt: { not: null } },
    select: { id: true, primaryCurrency: true },
  });

  const results: Array<{ userId: string; score: number; ok: boolean; error?: string }> = [];

  for (const u of users) {
    try {
      const nef = await computeNefForUser(u.id);
      const accounts = await prisma.account.findMany({
        where: { userId: u.id, isArchived: false, currency: u.primaryCurrency ?? 'XOF' },
        select: { currentBalance: true },
      });
      const netWorth = accounts.reduce((s, a) => s + Number(a.currentBalance), 0);
      await persistNefSnapshot(u.id, nef, netWorth);
      results.push({ userId: u.id, score: nef.score, ok: true });
    } catch (error) {
      results.push({
        userId: u.id,
        score: 0,
        ok: false,
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  return NextResponse.json({
    computedAt: new Date().toISOString(),
    userCount: users.length,
    successCount: results.filter((r) => r.ok).length,
    results,
  });
}
