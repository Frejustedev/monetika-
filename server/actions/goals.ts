'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { StrategyBucket, TransactionKind } from '@prisma/client';
import { prisma } from '@/lib/db/client';
import { requireOnboardedUser } from '@/lib/auth/session';

export type ActionResult =
  | { ok: true; id?: string; message?: string }
  | { ok: false; error: string; field?: string };

const bucketEnum = z.enum([
  StrategyBucket.NECESSITIES,
  StrategyBucket.EMERGENCY,
  StrategyBucket.EDUCATION,
  StrategyBucket.INVESTMENT,
  StrategyBucket.JOY,
  StrategyBucket.GIVE,
]);

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  targetAmount: z.coerce.number().positive(),
  targetDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Date invalide.'),
  strategyBucket: bucketEnum,
  accountId: z.string().optional().or(z.literal('')),
  startingAmount: z.coerce.number().min(0).default(0),
});

export async function createGoalAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireOnboardedUser();
  const parsed = createSchema.safeParse({
    name: formData.get('name'),
    targetAmount: formData.get('targetAmount'),
    targetDate: formData.get('targetDate'),
    strategyBucket: formData.get('strategyBucket'),
    accountId: formData.get('accountId') || undefined,
    startingAmount: formData.get('startingAmount') || 0,
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? 'Objectif invalide.', field: first?.path[0]?.toString() };
  }

  const data = parsed.data;

  // Résout la devise depuis le compte lié ou celle de l'utilisateur.
  let currency = 'XOF';
  if (data.accountId) {
    const acc = await prisma.account.findFirst({
      where: { id: data.accountId, userId: user.id },
      select: { currency: true },
    });
    if (!acc) return { ok: false, error: 'Compte introuvable.', field: 'accountId' };
    currency = acc.currency;
  } else {
    const u = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { primaryCurrency: true },
    });
    currency = u.primaryCurrency ?? 'XOF';
  }

  const created = await prisma.goal.create({
    data: {
      userId: user.id,
      name: data.name,
      targetAmount: data.targetAmount,
      currency,
      targetDate: new Date(data.targetDate),
      strategyBucket: data.strategyBucket,
      startingAmount: data.startingAmount,
      currentAmount: data.startingAmount,
      accountId: data.accountId || null,
    },
    select: { id: true },
  });

  revalidatePath('/goals');
  redirect(`/goals/${created.id}`);
}

const updateSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(80),
  targetAmount: z.coerce.number().positive(),
  targetDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Date invalide.'),
  strategyBucket: bucketEnum,
  accountId: z.string().optional().or(z.literal('')),
});

export async function updateGoalAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireOnboardedUser();
  const parsed = updateSchema.safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
    targetAmount: formData.get('targetAmount'),
    targetDate: formData.get('targetDate'),
    strategyBucket: formData.get('strategyBucket'),
    accountId: formData.get('accountId') || undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Objectif invalide.' };

  const existing = await prisma.goal.findFirst({
    where: { id: parsed.data.id, userId: user.id },
  });
  if (!existing) return { ok: false, error: 'Objectif introuvable.' };

  const { id, ...updates } = parsed.data;
  await prisma.goal.update({
    where: { id },
    data: {
      ...updates,
      targetDate: new Date(updates.targetDate),
      accountId: updates.accountId || null,
    },
  });

  revalidatePath('/goals');
  revalidatePath(`/goals/${id}`);
  return { ok: true, id };
}

const deleteSchema = z.object({ id: z.string().min(1) });

export async function deleteGoalAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireOnboardedUser();
  const parsed = deleteSchema.safeParse({ id: formData.get('id') });
  if (!parsed.success) return { ok: false, error: 'ID invalide.' };

  const existing = await prisma.goal.findFirst({
    where: { id: parsed.data.id, userId: user.id },
  });
  if (!existing) return { ok: false, error: 'Objectif introuvable.' };

  await prisma.goal.delete({ where: { id: parsed.data.id } });
  revalidatePath('/goals');
  redirect('/goals');
}

const contributeSchema = z.object({
  id: z.string().min(1),
  amount: z.coerce.number().positive(),
  note: z.string().max(280).optional().or(z.literal('')),
});

export async function contributeToGoalAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireOnboardedUser();
  const parsed = contributeSchema.safeParse({
    id: formData.get('id'),
    amount: formData.get('amount'),
    note: formData.get('note'),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? 'Contribution invalide.', field: first?.path[0]?.toString() };
  }
  const { id, amount, note } = parsed.data;

  const goal = await prisma.goal.findFirst({ where: { id, userId: user.id } });
  if (!goal) return { ok: false, error: 'Objectif introuvable.' };

  const newCurrent = Number(goal.currentAmount) + amount;
  const willAchieve = newCurrent >= Number(goal.targetAmount);

  await prisma.$transaction(async (tx) => {
    // Crée la contribution comme INCOME sur le compte lié (si défini).
    // Note contient la signature "goal:<id>" pour la retrouver dans l'historique.
    if (goal.accountId) {
      const acc = await tx.account.findUniqueOrThrow({
        where: { id: goal.accountId },
        select: { currency: true, isBlocked: true },
      });
      if (!acc.isBlocked) {
        const tagged = `goal:${goal.id}${note ? ' · ' + note : ''}`;
        await tx.transaction.create({
          data: {
            userId: user.id,
            accountId: goal.accountId,
            kind: TransactionKind.INCOME,
            amount,
            currency: acc.currency,
            occurredAt: new Date(),
            note: tagged,
            strategyBucket: goal.strategyBucket,
          },
        });
        await tx.account.update({
          where: { id: goal.accountId },
          data: { currentBalance: { increment: amount } },
        });
      }
    }

    await tx.goal.update({
      where: { id },
      data: {
        currentAmount: newCurrent,
        isAchieved: willAchieve,
        achievedAt: willAchieve && !goal.isAchieved ? new Date() : goal.achievedAt,
      },
    });
  });

  revalidatePath('/goals');
  revalidatePath(`/goals/${id}`);
  revalidatePath('/dashboard');
  revalidatePath('/transactions');
  if (goal.accountId) revalidatePath(`/accounts/${goal.accountId}`);
  return { ok: true, id, message: willAchieve ? 'Objectif atteint.' : 'Contribution enregistrée.' };
}
