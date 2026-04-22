// Apprentissage simple de patterns de transaction.
// Utilisé pour la suggestion 1-tap dans /transactions/new.

import 'server-only';
import { prisma } from '@/lib/db/client';

// Paliers log-espacés — évite que "2 000" et "2 100" soient considérés comme différents.
const AMOUNT_BINS = [500, 1_000, 2_000, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000];

export function computeAmountBin(amount: number): number {
  const abs = Math.abs(amount);
  for (let i = 0; i < AMOUNT_BINS.length; i++) {
    const upper = AMOUNT_BINS[i]!;
    // Borne stricte : 2000 atterrit dans le palier 2000-5000 (pas 1000-2000).
    if (abs < upper) return i;
  }
  return AMOUNT_BINS.length;
}

export function hourOfDay(date: Date): number {
  return date.getHours();
}

export function dayOfWeek(date: Date): number {
  return date.getDay();
}

// Upsert un pattern — appelé après chaque création de transaction.
export async function recordPattern(params: {
  userId: string;
  categoryId: string;
  accountId: string;
  amount: number;
  occurredAt: Date;
}): Promise<void> {
  const hour = hourOfDay(params.occurredAt);
  const day = dayOfWeek(params.occurredAt);
  const bin = computeAmountBin(params.amount);

  await prisma.transactionPattern.upsert({
    where: {
      userId_hourOfDay_dayOfWeek_amountBin_categoryId_accountId: {
        userId: params.userId,
        hourOfDay: hour,
        dayOfWeek: day,
        amountBin: bin,
        categoryId: params.categoryId,
        accountId: params.accountId,
      },
    },
    update: {
      frequency: { increment: 1 },
    },
    create: {
      userId: params.userId,
      hourOfDay: hour,
      dayOfWeek: day,
      amountBin: bin,
      categoryId: params.categoryId,
      accountId: params.accountId,
      frequency: 1,
    },
  });
}

export type TransactionSuggestion = {
  label: string;
  amount: number;
  categoryId: string;
  accountId: string;
  frequency: number;
};

// Retourne une suggestion si un pattern récent matche l'heure ± 1h et le jour courant.
// Condition d'affichage : frequency >= 3 (pattern suffisamment régulier).
const MIN_FREQUENCY = 3;

export async function getSuggestionForNow(
  userId: string,
  now: Date = new Date(),
): Promise<TransactionSuggestion | null> {
  const hour = hourOfDay(now);
  const day = dayOfWeek(now);

  const candidates = await prisma.transactionPattern.findMany({
    where: {
      userId,
      dayOfWeek: day,
      hourOfDay: { gte: hour - 1, lte: hour + 1 },
      frequency: { gte: MIN_FREQUENCY },
    },
    orderBy: [{ frequency: 'desc' }, { updatedAt: 'desc' }],
    take: 1,
  });

  const best = candidates[0];
  if (!best) return null;

  // Détails catégorie pour construire le label.
  const [category, account] = await Promise.all([
    prisma.category.findUnique({
      where: { id: best.categoryId },
      select: { label: true },
    }),
    prisma.account.findUnique({
      where: { id: best.accountId },
      select: { id: true, currency: true, isBlocked: true, isArchived: true },
    }),
  ]);

  if (!category || !account || account.isArchived || account.isBlocked) return null;

  // Montant suggéré : moyenne du palier (approximation).
  const binUpper = best.amountBin < AMOUNT_BINS.length ? AMOUNT_BINS[best.amountBin]! : 500_000;
  const binLower = best.amountBin === 0 ? 0 : AMOUNT_BINS[best.amountBin - 1]!;
  const amount = Math.round((binLower + binUpper) / 2);

  return {
    label: category.label,
    amount,
    categoryId: best.categoryId,
    accountId: best.accountId,
    frequency: best.frequency,
  };
}

export const _internals = { AMOUNT_BINS };
