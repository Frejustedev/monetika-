'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/client';
import { requireOnboardedUser } from '@/lib/auth/session';

export type ActionResult =
  | { ok: true; id?: string; message?: string }
  | { ok: false; error: string; field?: string };

const upsertSchema = z.object({
  categoryId: z.string().min(1),
  monthlyLimit: z.coerce.number().finite().min(0),
  alertAt70: z.coerce.boolean().optional().default(true),
  alertAt90: z.coerce.boolean().optional().default(true),
  blockAt100: z.coerce.boolean().optional().default(false),
});

export async function upsertBudgetAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireOnboardedUser();

  const parsed = upsertSchema.safeParse({
    categoryId: formData.get('categoryId'),
    monthlyLimit: formData.get('monthlyLimit'),
    alertAt70: formData.get('alertAt70') === 'on',
    alertAt90: formData.get('alertAt90') === 'on',
    blockAt100: formData.get('blockAt100') === 'on',
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? 'Budget invalide.', field: first?.path[0]?.toString() };
  }

  const { categoryId, monthlyLimit, alertAt70, alertAt90, blockAt100 } = parsed.data;

  const category = await prisma.category.findFirst({
    where: { id: categoryId, OR: [{ isSystem: true }, { userId: user.id }] },
    select: { id: true },
  });
  if (!category) return { ok: false, error: 'Catégorie inconnue.', field: 'categoryId' };

  const userRow = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { primaryCurrency: true },
  });
  const currency = userRow.primaryCurrency ?? 'XOF';

  // Si monthlyLimit == 0 → on supprime le budget (intention : "pas de plafond").
  if (monthlyLimit === 0) {
    await prisma.budget.deleteMany({ where: { userId: user.id, categoryId } });
    revalidatePath('/budget');
    return { ok: true, message: 'Budget retiré.' };
  }

  const existing = await prisma.budget.findUnique({
    where: { userId_categoryId: { userId: user.id, categoryId } },
  });

  if (existing) {
    await prisma.budget.update({
      where: { userId_categoryId: { userId: user.id, categoryId } },
      data: { monthlyLimit, currency, alertAt70, alertAt90, blockAt100 },
    });
  } else {
    await prisma.budget.create({
      data: {
        userId: user.id,
        categoryId,
        monthlyLimit,
        currency,
        alertAt70,
        alertAt90,
        blockAt100,
      },
    });
  }

  revalidatePath('/budget');
  return { ok: true, message: 'Budget enregistré.' };
}

const deleteSchema = z.object({ categoryId: z.string().min(1) });

export async function deleteBudgetAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireOnboardedUser();
  const parsed = deleteSchema.safeParse({ categoryId: formData.get('categoryId') });
  if (!parsed.success) return { ok: false, error: 'Entrée invalide.' };

  await prisma.budget.deleteMany({
    where: { userId: user.id, categoryId: parsed.data.categoryId },
  });

  revalidatePath('/budget');
  return { ok: true, message: 'Budget supprimé.' };
}
