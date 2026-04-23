'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/client';
import { requireOnboardedUser } from '@/lib/auth/session';
import { hashPin, isWeakPin, pinSchema, verifyPin } from '@/lib/auth/pin';
import { signOut } from '@/auth';
import { BUCKETS, type BucketKey, validateStrategy } from '@/lib/strategy/buckets';
import { isCountryCode, COUNTRIES } from '@/lib/countries';

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; field?: string };

// —— Profil ——
const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
});

export async function updateProfileAction(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const user = await requireOnboardedUser();
  const parsed = profileSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    phone: formData.get('phone'),
    dateOfBirth: formData.get('dateOfBirth'),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? 'Champs invalides.', field: first?.path[0]?.toString() };
  }
  await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone || null,
      dateOfBirth: parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : null,
    },
  });
  revalidatePath('/settings');
  return { ok: true, message: 'Profil mis à jour.' };
}

// —— PIN ——
const pinChangeSchema = z
  .object({
    currentPin: pinSchema,
    newPin: pinSchema,
    confirmPin: pinSchema,
  })
  .refine((d) => d.newPin === d.confirmPin, { message: 'Les deux PIN ne correspondent pas.', path: ['confirmPin'] })
  .refine((d) => d.newPin !== d.currentPin, { message: 'Choisissez un PIN différent.', path: ['newPin'] });

export async function changePinAction(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const user = await requireOnboardedUser();
  const parsed = pinChangeSchema.safeParse({
    currentPin: formData.get('currentPin'),
    newPin: formData.get('newPin'),
    confirmPin: formData.get('confirmPin'),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? 'PIN invalide.', field: first?.path[0]?.toString() };
  }
  if (isWeakPin(parsed.data.newPin)) {
    return { ok: false, error: 'PIN trop simple.', field: 'newPin' };
  }

  const userRow = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { pinHash: true },
  });
  if (!userRow.pinHash) return { ok: false, error: 'Aucun PIN défini.' };

  const ok = await verifyPin(parsed.data.currentPin, userRow.pinHash);
  if (!ok) return { ok: false, error: 'PIN actuel incorrect.', field: 'currentPin' };

  const newHash = await hashPin(parsed.data.newPin);
  await prisma.user.update({ where: { id: user.id }, data: { pinHash: newHash } });
  revalidatePath('/settings');
  return { ok: true, message: 'PIN mis à jour.' };
}

// —— Préférences ——
const preferencesSchema = z.object({
  locale: z.enum(['fr', 'en']),
  primaryCurrency: z.enum(['XOF', 'NGN', 'GHS']),
  countryCode: z.string().refine(isCountryCode, 'Pays invalide.'),
  theme: z.enum(['system', 'light', 'dark']),
});

export async function updatePreferencesAction(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const user = await requireOnboardedUser();
  const parsed = preferencesSchema.safeParse({
    locale: formData.get('locale'),
    primaryCurrency: formData.get('primaryCurrency'),
    countryCode: formData.get('countryCode'),
    theme: formData.get('theme'),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? 'Préférences invalides.', field: first?.path[0]?.toString() };
  }

  const country = COUNTRIES.find((c) => c.code === parsed.data.countryCode);
  if (!country) return { ok: false, error: 'Pays introuvable.' };

  await prisma.user.update({
    where: { id: user.id },
    data: {
      locale: parsed.data.locale,
      primaryCurrency: parsed.data.primaryCurrency,
      countryCode: parsed.data.countryCode,
      timezone: country.timezone,
    },
  });

  // Thème dans un cookie (pas besoin d'un champ DB).
  const cookieStore = await cookies();
  cookieStore.set('NEXT_THEME', parsed.data.theme, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  });
  cookieStore.set('NEXT_LOCALE', parsed.data.locale, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath('/settings');
  revalidatePath('/');
  return { ok: true, message: 'Préférences enregistrées.' };
}

// —— Stratégie 6 comptes ——
const strategySchema = z
  .object({
    necessities: z.coerce.number().int().min(0).max(100),
    emergency: z.coerce.number().int().min(0).max(100),
    education: z.coerce.number().int().min(0).max(100),
    investment: z.coerce.number().int().min(0).max(100),
    joy: z.coerce.number().int().min(0).max(100),
    give: z.coerce.number().int().min(0).max(100),
  })
  .refine(
    (d) => d.necessities + d.emergency + d.education + d.investment + d.joy + d.give === 100,
    { message: 'Le total doit faire 100.' },
  );

export async function updateStrategyAction(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const user = await requireOnboardedUser();
  const parsed = strategySchema.safeParse({
    necessities: formData.get('necessities'),
    emergency: formData.get('emergency'),
    education: formData.get('education'),
    investment: formData.get('investment'),
    joy: formData.get('joy'),
    give: formData.get('give'),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Répartition invalide.' };

  const { total, ok } = validateStrategy({
    NECESSITIES: parsed.data.necessities,
    EMERGENCY: parsed.data.emergency,
    EDUCATION: parsed.data.education,
    INVESTMENT: parsed.data.investment,
    JOY: parsed.data.joy,
    GIVE: parsed.data.give,
  });
  if (!ok) return { ok: false, error: `Total ${total}, attendu 100.` };

  await prisma.strategyConfig.upsert({
    where: { userId: user.id },
    update: parsed.data,
    create: { userId: user.id, ...parsed.data },
  });

  // Rappel : on ne touche PAS aux buckets des comptes — c'est à l'utilisateur.
  revalidatePath('/settings');
  revalidatePath('/dashboard');
  return { ok: true, message: 'Stratégie mise à jour.' };
}

// —— Revenus récurrents ——
const incomeSchema = z.object({
  id: z.string().optional().or(z.literal('')),
  label: z.string().trim().min(1).max(80),
  kind: z.enum(['SALARY', 'RENT', 'DIVIDENDS', 'FREELANCE', 'REMITTANCE', 'OTHER']),
  expectedAmount: z.coerce.number().positive(),
  frequency: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL', 'VARIABLE']),
  dayOfMonth: z.coerce.number().int().min(1).max(28).optional().or(z.literal('').transform(() => undefined)),
  isActive: z.coerce.boolean().optional().default(true),
});

export async function upsertIncomeSourceAction(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const user = await requireOnboardedUser();
  const parsed = incomeSchema.safeParse({
    id: formData.get('id'),
    label: formData.get('label'),
    kind: formData.get('kind'),
    expectedAmount: formData.get('expectedAmount'),
    frequency: formData.get('frequency'),
    dayOfMonth: formData.get('dayOfMonth') || '',
    isActive: formData.get('isActive') === 'on',
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? 'Source invalide.', field: first?.path[0]?.toString() };
  }

  const userRow = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { primaryCurrency: true },
  });

  const data = {
    label: parsed.data.label,
    kind: parsed.data.kind,
    expectedAmount: parsed.data.expectedAmount,
    currency: userRow.primaryCurrency ?? 'XOF',
    frequency: parsed.data.frequency,
    dayOfMonth: parsed.data.dayOfMonth ?? null,
    isActive: parsed.data.isActive ?? true,
  };

  if (parsed.data.id) {
    const existing = await prisma.incomeSource.findFirst({
      where: { id: parsed.data.id, userId: user.id },
    });
    if (!existing) return { ok: false, error: 'Source introuvable.' };
    await prisma.incomeSource.update({ where: { id: parsed.data.id }, data });
  } else {
    await prisma.incomeSource.create({ data: { ...data, userId: user.id } });
  }

  revalidatePath('/settings');
  return { ok: true, message: 'Source enregistrée.' };
}

export async function deleteIncomeSourceAction(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const user = await requireOnboardedUser();
  const id = formData.get('id')?.toString();
  if (!id) return { ok: false, error: 'ID manquant.' };

  const existing = await prisma.incomeSource.findFirst({ where: { id, userId: user.id } });
  if (!existing) return { ok: false, error: 'Source introuvable.' };

  await prisma.incomeSource.delete({ where: { id } });
  revalidatePath('/settings');
  return { ok: true };
}

// —— Export complet ——
export async function exportAllDataAction(): Promise<ActionResult> {
  // Pas de vrai action ici — l'export se fait via la route /settings/export-all qui renvoie un JSON.
  return { ok: true };
}

// —— Suppression compte ——
const deleteSchema = z.object({ confirmation: z.string() });

export async function deleteAccountAction(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const user = await requireOnboardedUser();
  const parsed = deleteSchema.safeParse({ confirmation: formData.get('confirmation') });
  if (!parsed.success || parsed.data.confirmation !== 'SUPPRIMER') {
    return { ok: false, error: 'Tapez SUPPRIMER pour confirmer.', field: 'confirmation' };
  }

  // Cascade Prisma : User → onDelete:Cascade sur tout.
  await prisma.user.delete({ where: { id: user.id } });
  await signOut({ redirect: false });
  redirect('/');
}

// —— Garde-fou TS : prévient TypeScript que BUCKETS est utilisé (pour export possible) ——
export const _usedBuckets = BUCKETS as readonly BucketKey[];
