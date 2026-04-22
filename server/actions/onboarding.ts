'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/client';
import { requireAuthUser } from '@/lib/auth/session';
import { hashPin, isWeakPin, pinSchema } from '@/lib/auth/pin';
import { COUNTRIES, getCountry, isCountryCode } from '@/lib/countries';
import type { BucketKey } from '@/lib/strategy/buckets';
import { AccountKind, StrategyBucket } from '@prisma/client';

export type ActionResult =
  | { ok: true; redirectTo?: string; message?: string }
  | { ok: false; error: string; field?: string };

// ——— Étape I : infos perso ———
const personalSchema = z.object({
  firstName: z.string().trim().min(1, 'Prénom requis.').max(60),
  lastName: z.string().trim().min(1, 'Nom requis.').max(60),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
});

export async function savePersonalAction(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const user = await requireAuthUser();
  const parsed = personalSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    phone: formData.get('phone'),
    dateOfBirth: formData.get('dateOfBirth'),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? 'Champs invalides.', field: first?.path[0]?.toString() };
  }
  const { firstName, lastName, phone, dateOfBirth } = parsed.data;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName,
      lastName,
      phone: phone || null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
    },
  });
  redirect('/onboarding/II');
}

// ——— Étape II : pays & devise ———
const countrySchema = z.object({
  countryCode: z.string().refine(isCountryCode, 'Pays non supporté.'),
});

export async function saveCountryAction(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const user = await requireAuthUser();
  const parsed = countrySchema.safeParse({ countryCode: formData.get('countryCode') });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Pays invalide.', field: 'countryCode' };
  }
  const country = getCountry(parsed.data.countryCode as Parameters<typeof getCountry>[0]);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      countryCode: country.code,
      primaryCurrency: country.currency,
      timezone: country.timezone,
      locale: country.defaultLocale,
    },
  });
  redirect('/onboarding/III');
}

// ——— Étape III : sécurité & confidentialité (écran informatif) ———
export async function acknowledgePrivacyAction(): Promise<ActionResult> {
  await requireAuthUser();
  redirect('/onboarding/IV');
}

// ——— Étape IV : PIN 6 chiffres ———
const pinCreationSchema = z
  .object({
    pin: pinSchema,
    pinConfirm: pinSchema,
  })
  .refine((data) => data.pin === data.pinConfirm, {
    message: 'Les deux PIN ne correspondent pas.',
    path: ['pinConfirm'],
  });

export async function savePinAction(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const user = await requireAuthUser();
  const parsed = pinCreationSchema.safeParse({
    pin: formData.get('pin'),
    pinConfirm: formData.get('pinConfirm'),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? 'PIN invalide.', field: first?.path[0]?.toString() };
  }
  if (isWeakPin(parsed.data.pin)) {
    return { ok: false, error: 'PIN trop simple. Choisissez des chiffres moins prévisibles.', field: 'pin' };
  }
  const hash = await hashPin(parsed.data.pin);
  await prisma.user.update({ where: { id: user.id }, data: { pinHash: hash } });
  redirect('/onboarding/V');
}

// ——— Étape V : stratégie 6 comptes ———
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
    { message: 'Le total doit faire 100.', path: ['necessities'] },
  );

export async function saveStrategyAction(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const user = await requireAuthUser();
  const parsed = strategySchema.safeParse({
    necessities: formData.get('necessities'),
    emergency: formData.get('emergency'),
    education: formData.get('education'),
    investment: formData.get('investment'),
    joy: formData.get('joy'),
    give: formData.get('give'),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Répartition invalide.' };
  }
  await prisma.strategyConfig.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...parsed.data },
    update: parsed.data,
  });
  redirect('/onboarding/VI');
}

// ——— Étape VI : premier compte ———
const accountKinds = Object.values(AccountKind);
const firstAccountSchema = z.object({
  label: z.string().trim().min(1).max(80),
  institution: z.string().trim().min(1).max(120),
  kind: z.enum(accountKinds as [string, ...string[]]),
  currentBalance: z.coerce.number().finite().min(0),
  strategyBucket: z.enum(['NECESSITIES', 'EMERGENCY', 'EDUCATION', 'INVESTMENT', 'JOY', 'GIVE'] as [BucketKey, ...BucketKey[]]),
});

export async function saveFirstAccountAction(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const user = await requireAuthUser();
  const parsed = firstAccountSchema.safeParse({
    label: formData.get('label'),
    institution: formData.get('institution'),
    kind: formData.get('kind'),
    currentBalance: formData.get('currentBalance'),
    strategyBucket: formData.get('strategyBucket'),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? 'Compte invalide.', field: first?.path[0]?.toString() };
  }

  const userRecord = await prisma.user.findUnique({
    where: { id: user.id },
    select: { primaryCurrency: true },
  });
  const currency = userRecord?.primaryCurrency ?? 'XOF';

  await prisma.account.create({
    data: {
      userId: user.id,
      label: parsed.data.label,
      institution: parsed.data.institution,
      kind: parsed.data.kind as AccountKind,
      currency,
      currentBalance: parsed.data.currentBalance,
      color: '#1F4D3F',
      icon: 'wallet',
      strategyBucket: parsed.data.strategyBucket as StrategyBucket,
    },
  });

  redirect('/onboarding/VII');
}

// ——— Étape VII : finalisation ———
export async function completeOnboardingAction(): Promise<ActionResult> {
  const user = await requireAuthUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { onboardedAt: new Date() },
  });
  redirect('/');
}

export async function getOnboardingState() {
  const user = await requireAuthUser();
  const u = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      firstName: true,
      lastName: true,
      phone: true,
      dateOfBirth: true,
      countryCode: true,
      primaryCurrency: true,
      pinHash: true,
      locale: true,
      onboardedAt: true,
      strategyConfig: true,
      accounts: { select: { id: true }, take: 1 },
    },
  });
  return { user: u, countries: COUNTRIES };
}
