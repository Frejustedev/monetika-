'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { createMagicLinkToken } from '@/lib/auth/magic-link';
import { renderMagicLinkEmail, sendTransactionalEmail } from '@/lib/auth/email';
import { rateLimitMagicLink } from '@/lib/auth/rate-limit';
import { signIn } from '@/auth';

const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail invalide.'),
  firstName: z.string().trim().min(1, 'Prénom requis.').max(60),
  lastName: z.string().trim().min(1, 'Nom requis.').max(60),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  locale: z.enum(['fr', 'en']).default('fr'),
});

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; field?: string };

export async function signupAction(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = signupSchema.safeParse({
    email: raw.email,
    firstName: raw.firstName,
    lastName: raw.lastName,
    phone: raw.phone,
    locale: raw.locale ?? 'fr',
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? 'Champs invalides.', field: first?.path[0]?.toString() };
  }

  const { email, firstName, lastName, phone, locale } = parsed.data;

  const rl = rateLimitMagicLink(email);
  if (!rl.allowed) {
    return { ok: false, error: 'Trop de demandes. Réessayez dans quelques minutes.' };
  }

  // Upsert : si un user existe déjà, on met à jour les infos fournies.
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      phone: phone || undefined,
      locale,
    },
    create: {
      email,
      firstName,
      lastName,
      phone: phone || null,
      locale,
    },
    select: { id: true, firstName: true, locale: true },
  });

  const { rawToken } = await createMagicLinkToken(email);
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const link = `${base}/api/auth/verify-magic?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(email)}`;

  const { html, text, subject } = renderMagicLinkEmail({
    link,
    firstName: user.firstName,
    locale: (user.locale as 'fr' | 'en') ?? locale,
  });

  try {
    await sendTransactionalEmail({ to: email, subject, html, text });
  } catch (error) {
    console.error('[signupAction] email error', error);
    return { ok: false, error: 'Impossible d\u2019envoyer l\u2019e-mail. Réessayez.' };
  }

  return { ok: true, message: 'E-mail envoyé.' };
}

const loginEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail invalide.'),
});

export async function requestMagicLinkAction(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const parsed = loginEmailSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'E-mail invalide.', field: 'email' };
  }
  const { email } = parsed.data;
  const rl = rateLimitMagicLink(email);
  if (!rl.allowed) {
    return { ok: false, error: 'Trop de demandes. Réessayez dans quelques minutes.' };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, firstName: true, locale: true },
  });

  // Réponse neutre : pas de leak d'existence de compte.
  if (!user) {
    return { ok: true, message: 'Si un compte existe, un e-mail a été envoyé.' };
  }

  const { rawToken } = await createMagicLinkToken(email);
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const link = `${base}/api/auth/verify-magic?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(email)}`;
  const { html, text, subject } = renderMagicLinkEmail({
    link,
    firstName: user.firstName,
    locale: (user.locale as 'fr' | 'en') ?? 'fr',
  });

  try {
    await sendTransactionalEmail({ to: email, subject, html, text });
  } catch (error) {
    console.error('[requestMagicLinkAction] email error', error);
    return { ok: false, error: 'Impossible d\u2019envoyer l\u2019e-mail. Réessayez.' };
  }
  return { ok: true, message: 'E-mail envoyé.' };
}

// NB : la vérification du magic link est désormais gérée côté Route Handler
// /api/auth/verify-magic (Route Handler = écriture cookie garantie).
// Cette action avait un bug de cookie dans le pattern Server Component.

const pinLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  pin: z.string().regex(/^\d{6}$/u, 'PIN invalide.'),
});

export async function loginWithPinAction(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const parsed = pinLoginSchema.safeParse({
    email: formData.get('email'),
    pin: formData.get('pin'),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? 'Champs invalides.', field: first?.path[0]?.toString() };
  }
  const { email, pin } = parsed.data;

  try {
    await signIn('pin', { email, pin, redirect: false });
  } catch (error) {
    console.error('[loginWithPinAction] signIn error', error);
    return { ok: false, error: 'E-mail ou PIN incorrect.' };
  }
  return { ok: true };
}
