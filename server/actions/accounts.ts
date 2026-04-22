'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { AccountKind, StrategyBucket, TransactionKind } from '@prisma/client';
import { prisma } from '@/lib/db/client';
import { requireOnboardedUser } from '@/lib/auth/session';
import type { BucketKey } from '@/lib/strategy/buckets';

export type ActionResult =
  | { ok: true; id?: string; message?: string }
  | { ok: false; error: string; field?: string };

const accountKinds = Object.values(AccountKind) as [string, ...string[]];
const bucketValues: [BucketKey, ...BucketKey[]] = [
  'NECESSITIES',
  'EMERGENCY',
  'EDUCATION',
  'INVESTMENT',
  'JOY',
  'GIVE',
];

const createSchema = z.object({
  label: z.string().trim().min(1).max(80),
  institution: z.string().trim().min(1).max(120),
  kind: z.enum(accountKinds),
  currency: z.string().trim().min(3).max(4).toUpperCase(),
  currentBalance: z.coerce.number().finite(),
  strategyBucket: z.enum(bucketValues).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/u).default('#1F4D3F'),
  icon: z.string().trim().min(1).max(40).default('wallet'),
});

export async function createAccountAction(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const user = await requireOnboardedUser();
  const parsed = createSchema.safeParse({
    label: formData.get('label'),
    institution: formData.get('institution'),
    kind: formData.get('kind'),
    currency: formData.get('currency'),
    currentBalance: formData.get('currentBalance'),
    strategyBucket: formData.get('strategyBucket') || undefined,
    color: formData.get('color') || '#1F4D3F',
    icon: formData.get('icon') || 'wallet',
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? 'Compte invalide.', field: first?.path[0]?.toString() };
  }

  const data = parsed.data;
  const created = await prisma.account.create({
    data: {
      userId: user.id,
      label: data.label,
      institution: data.institution,
      kind: data.kind as AccountKind,
      currency: data.currency,
      currentBalance: data.currentBalance,
      color: data.color,
      icon: data.icon,
      strategyBucket: data.strategyBucket ? (data.strategyBucket as StrategyBucket) : null,
    },
    select: { id: true },
  });

  revalidatePath('/accounts');
  revalidatePath('/dashboard');
  redirect(`/accounts/${created.id}`);
}

const updateSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1).max(80),
  institution: z.string().trim().min(1).max(120),
  strategyBucket: z.enum(bucketValues).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/u).optional(),
  icon: z.string().trim().min(1).max(40).optional(),
});

export async function updateAccountAction(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const user = await requireOnboardedUser();
  const parsed = updateSchema.safeParse({
    id: formData.get('id'),
    label: formData.get('label'),
    institution: formData.get('institution'),
    strategyBucket: formData.get('strategyBucket') || undefined,
    color: formData.get('color') || undefined,
    icon: formData.get('icon') || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Champs invalides.' };
  }

  const { id, ...updates } = parsed.data;
  const existing = await prisma.account.findFirst({ where: { id, userId: user.id } });
  if (!existing) return { ok: false, error: 'Compte introuvable.' };

  await prisma.account.update({
    where: { id },
    data: {
      ...updates,
      strategyBucket: updates.strategyBucket ? (updates.strategyBucket as StrategyBucket) : null,
    },
  });

  revalidatePath('/accounts');
  revalidatePath('/dashboard');
  revalidatePath(`/accounts/${id}`);
  return { ok: true, id, message: 'Compte mis à jour.' };
}

const adjustSchema = z.object({
  id: z.string().min(1),
  newBalance: z.coerce.number().finite(),
  note: z.string().trim().max(280).optional(),
});

export async function adjustBalanceAction(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const user = await requireOnboardedUser();
  const parsed = adjustSchema.safeParse({
    id: formData.get('id'),
    newBalance: formData.get('newBalance'),
    note: formData.get('note'),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Ajustement invalide.' };
  }
  const { id, newBalance, note } = parsed.data;

  const account = await prisma.account.findFirst({ where: { id, userId: user.id } });
  if (!account) return { ok: false, error: 'Compte introuvable.' };

  const delta = newBalance - Number(account.currentBalance);
  if (delta === 0) return { ok: true, id, message: 'Solde déjà à jour.' };

  await prisma.$transaction([
    prisma.transaction.create({
      data: {
        userId: user.id,
        accountId: id,
        kind: TransactionKind.ADJUSTMENT,
        amount: Math.abs(delta),
        currency: account.currency,
        occurredAt: new Date(),
        note: note ?? (delta > 0 ? 'Ajustement positif' : 'Ajustement négatif'),
      },
    }),
    prisma.account.update({
      where: { id },
      data: { currentBalance: newBalance, lastReconciled: new Date() },
    }),
  ]);

  revalidatePath('/accounts');
  revalidatePath('/dashboard');
  revalidatePath(`/accounts/${id}`);
  return { ok: true, id, message: 'Solde ajusté.' };
}

const toggleBlockSchema = z.object({ id: z.string().min(1), blocked: z.enum(['on', 'off']) });

export async function toggleBlockAccountAction(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const user = await requireOnboardedUser();
  const parsed = toggleBlockSchema.safeParse({
    id: formData.get('id'),
    blocked: formData.get('blocked'),
  });
  if (!parsed.success) return { ok: false, error: 'Entrée invalide.' };

  const existing = await prisma.account.findFirst({ where: { id: parsed.data.id, userId: user.id } });
  if (!existing) return { ok: false, error: 'Compte introuvable.' };

  await prisma.account.update({
    where: { id: parsed.data.id },
    data: { isBlocked: parsed.data.blocked === 'on' },
  });

  revalidatePath('/accounts');
  revalidatePath(`/accounts/${parsed.data.id}`);
  return { ok: true, id: parsed.data.id };
}

const archiveSchema = z.object({ id: z.string().min(1) });

export async function archiveAccountAction(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const user = await requireOnboardedUser();
  const parsed = archiveSchema.safeParse({ id: formData.get('id') });
  if (!parsed.success) return { ok: false, error: 'ID invalide.' };

  const existing = await prisma.account.findFirst({ where: { id: parsed.data.id, userId: user.id } });
  if (!existing) return { ok: false, error: 'Compte introuvable.' };

  await prisma.account.update({ where: { id: parsed.data.id }, data: { isArchived: true } });

  revalidatePath('/accounts');
  revalidatePath('/dashboard');
  redirect('/accounts');
}
