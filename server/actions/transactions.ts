'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { TransactionKind, StrategyBucket } from '@prisma/client';
import { prisma } from '@/lib/db/client';
import { requireOnboardedUser } from '@/lib/auth/session';
import { recordPattern } from '@/lib/patterns';

export type ActionResult =
  | { ok: true; id?: string; message?: string }
  | { ok: false; error: string; field?: string };

const kindEnum = z.enum([
  TransactionKind.EXPENSE,
  TransactionKind.INCOME,
  TransactionKind.TRANSFER,
  TransactionKind.ADJUSTMENT,
]);

const expenseIncomeSchema = z.object({
  kind: z.enum([TransactionKind.EXPENSE, TransactionKind.INCOME]),
  accountId: z.string().min(1),
  amount: z.coerce.number().positive(),
  categoryId: z.string().min(1).optional().or(z.literal('')),
  note: z.string().max(280).optional().or(z.literal('')),
  merchant: z.string().max(120).optional().or(z.literal('')),
  occurredAt: z.string().optional().or(z.literal('')),
});

const transferSchema = z.object({
  kind: z.literal(TransactionKind.TRANSFER),
  accountId: z.string().min(1),
  counterAccountId: z.string().min(1),
  amount: z.coerce.number().positive(),
  note: z.string().max(280).optional().or(z.literal('')),
  occurredAt: z.string().optional().or(z.literal('')),
});

export async function createTransactionAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireOnboardedUser();
  const kindRaw = formData.get('kind');
  const kindParse = kindEnum.safeParse(kindRaw);
  if (!kindParse.success) return { ok: false, error: 'Type invalide.' };
  const kind = kindParse.data;

  if (kind === TransactionKind.TRANSFER) {
    return handleTransfer(user.id, formData);
  }
  if (kind === TransactionKind.EXPENSE || kind === TransactionKind.INCOME) {
    return handleExpenseOrIncome(user.id, kind, formData);
  }
  return { ok: false, error: 'Type non supporté ici.' };
}

async function handleExpenseOrIncome(
  userId: string,
  kind: typeof TransactionKind.EXPENSE | typeof TransactionKind.INCOME,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = expenseIncomeSchema.safeParse({
    kind,
    accountId: formData.get('accountId'),
    amount: formData.get('amount'),
    categoryId: formData.get('categoryId'),
    note: formData.get('note'),
    merchant: formData.get('merchant'),
    occurredAt: formData.get('occurredAt'),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? 'Champs invalides.', field: first?.path[0]?.toString() };
  }

  const data = parsed.data;
  const account = await prisma.account.findFirst({
    where: { id: data.accountId, userId, isArchived: false },
    select: { id: true, currency: true, isBlocked: true, currentBalance: true },
  });
  if (!account) return { ok: false, error: 'Compte introuvable.', field: 'accountId' };
  if (account.isBlocked) return { ok: false, error: 'Compte bloqué.', field: 'accountId' };

  let categoryIdNormalized: string | null = null;
  let bucket: StrategyBucket | null = null;
  if (data.categoryId) {
    const cat = await prisma.category.findFirst({
      where: { id: data.categoryId, OR: [{ isSystem: true }, { userId }] },
      select: { id: true, strategyBucket: true },
    });
    if (!cat) return { ok: false, error: 'Catégorie inconnue.', field: 'categoryId' };
    categoryIdNormalized = cat.id;
    bucket = cat.strategyBucket;
  }

  const occurredAt = data.occurredAt ? new Date(data.occurredAt) : new Date();
  const signedDelta = kind === TransactionKind.EXPENSE ? -data.amount : data.amount;

  const created = await prisma.$transaction(async (tx) => {
    const created = await tx.transaction.create({
      data: {
        userId,
        accountId: account.id,
        kind,
        amount: data.amount,
        currency: account.currency,
        occurredAt,
        categoryId: categoryIdNormalized,
        strategyBucket: bucket,
        note: data.note || null,
        merchant: data.merchant || null,
      },
    });
    await tx.account.update({
      where: { id: account.id },
      data: { currentBalance: { increment: signedDelta } },
    });
    return created;
  });

  // Apprentissage pattern — hors transaction, erreur silencieuse si ça rate.
  if (categoryIdNormalized) {
    try {
      await recordPattern({
        userId,
        categoryId: categoryIdNormalized,
        accountId: account.id,
        amount: data.amount,
        occurredAt,
      });
    } catch (error) {
      console.error('[recordPattern]', error);
    }
  }

  revalidatePath('/dashboard');
  revalidatePath('/transactions');
  revalidatePath('/accounts');
  revalidatePath(`/accounts/${account.id}`);
  return { ok: true, id: created.id, message: 'Transaction enregistrée.' };
}

async function handleTransfer(userId: string, formData: FormData): Promise<ActionResult> {
  const parsed = transferSchema.safeParse({
    kind: TransactionKind.TRANSFER,
    accountId: formData.get('accountId'),
    counterAccountId: formData.get('counterAccountId'),
    amount: formData.get('amount'),
    note: formData.get('note'),
    occurredAt: formData.get('occurredAt'),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? 'Champs invalides.', field: first?.path[0]?.toString() };
  }
  const data = parsed.data;
  if (data.accountId === data.counterAccountId) {
    return { ok: false, error: 'Source et destination identiques.' };
  }

  const [from, to] = await Promise.all([
    prisma.account.findFirst({
      where: { id: data.accountId, userId, isArchived: false },
      select: { id: true, currency: true, isBlocked: true },
    }),
    prisma.account.findFirst({
      where: { id: data.counterAccountId, userId, isArchived: false },
      select: { id: true, currency: true, isBlocked: true },
    }),
  ]);
  if (!from || !to) return { ok: false, error: 'Compte introuvable.' };
  if (from.isBlocked || to.isBlocked) return { ok: false, error: 'Compte bloqué.' };
  if (from.currency !== to.currency) {
    return { ok: false, error: 'Transfert entre devises différentes non supporté en V1.' };
  }

  const occurredAt = data.occurredAt ? new Date(data.occurredAt) : new Date();

  const created = await prisma.$transaction(async (tx) => {
    const created = await tx.transaction.create({
      data: {
        userId,
        accountId: from.id,
        counterAccountId: to.id,
        kind: TransactionKind.TRANSFER,
        amount: data.amount,
        currency: from.currency,
        occurredAt,
        note: data.note || null,
      },
    });
    await tx.account.update({
      where: { id: from.id },
      data: { currentBalance: { decrement: data.amount } },
    });
    await tx.account.update({
      where: { id: to.id },
      data: { currentBalance: { increment: data.amount } },
    });
    return created;
  });

  revalidatePath('/dashboard');
  revalidatePath('/transactions');
  revalidatePath('/accounts');
  revalidatePath(`/accounts/${from.id}`);
  revalidatePath(`/accounts/${to.id}`);
  return { ok: true, id: created.id, message: 'Transfert enregistré.' };
}

const deleteSchema = z.object({ id: z.string().min(1) });

export async function deleteTransactionAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireOnboardedUser();
  const parsed = deleteSchema.safeParse({ id: formData.get('id') });
  if (!parsed.success) return { ok: false, error: 'ID invalide.' };

  const existing = await prisma.transaction.findFirst({
    where: { id: parsed.data.id, userId: user.id },
    select: { id: true, kind: true, amount: true, accountId: true, counterAccountId: true },
  });
  if (!existing) return { ok: false, error: 'Transaction introuvable.' };

  const amount = Number(existing.amount);
  await prisma.$transaction(async (tx) => {
    // Annule l'effet sur le solde avant suppression.
    if (existing.kind === TransactionKind.EXPENSE) {
      await tx.account.update({
        where: { id: existing.accountId },
        data: { currentBalance: { increment: amount } },
      });
    } else if (existing.kind === TransactionKind.INCOME) {
      await tx.account.update({
        where: { id: existing.accountId },
        data: { currentBalance: { decrement: amount } },
      });
    } else if (existing.kind === TransactionKind.TRANSFER && existing.counterAccountId) {
      await tx.account.update({
        where: { id: existing.accountId },
        data: { currentBalance: { increment: amount } },
      });
      await tx.account.update({
        where: { id: existing.counterAccountId },
        data: { currentBalance: { decrement: amount } },
      });
    }
    await tx.transaction.delete({ where: { id: parsed.data.id } });
  });

  revalidatePath('/dashboard');
  revalidatePath('/transactions');
  revalidatePath('/accounts');
  return { ok: true, message: 'Transaction supprimée.' };
}
