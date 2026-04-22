import { NextResponse } from 'next/server';
import { consumeMagicLinkToken } from '@/lib/auth/magic-link';
import { prisma } from '@/lib/db/client';
import { signIn, signMagicIntent } from '@/auth';

export const dynamic = 'force-dynamic';

// Route handler qui consomme le magic link et crée la session.
// Les Route Handlers garantissent l'écriture de cookies via signIn(),
// contrairement aux Server Components qui appellent une action imbriquée.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawToken = url.searchParams.get('token');
  const email = url.searchParams.get('email');

  if (!rawToken || !email) {
    return NextResponse.redirect(new URL('/verify', req.url));
  }

  const result = await consumeMagicLinkToken(rawToken, email);
  if (!result.ok) {
    const reason = result.reason === 'expired' ? 'expired' : 'invalid';
    return NextResponse.redirect(new URL(`/verify?error=${reason}`, req.url));
  }

  const intent = await signMagicIntent(email);
  try {
    await signIn('magic', { email, intent, redirect: false });
  } catch (error) {
    console.error('[verify-magic] signIn error', error);
    return NextResponse.redirect(new URL('/verify?error=invalid', req.url));
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { onboardedAt: true },
  });

  const destination = user?.onboardedAt ? '/' : '/onboarding/I';
  return NextResponse.redirect(new URL(destination, req.url));
}
