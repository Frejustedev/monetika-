import { NextResponse } from 'next/server';
import { consumeMagicLinkToken } from '@/lib/auth/magic-link';
import { prisma } from '@/lib/db/client';
import { signIn, signMagicIntent } from '@/auth';
import { publicUrl } from '@/lib/http/public-origin';

export const dynamic = 'force-dynamic';

// Route handler qui consomme le magic link et crée la session.
// Les Route Handlers garantissent l'écriture de cookies via signIn(),
// contrairement aux Server Components qui appellent une action imbriquée.
// Les redirections partent de l'origine publique (lib/http/public-origin) et
// non de req.url, qui vaut 0.0.0.0:3000 en auto-hébergement.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawToken = url.searchParams.get('token');
  const email = url.searchParams.get('email');
  const redirectTo = (path: string) => NextResponse.redirect(publicUrl(path, req.headers));

  if (!rawToken || !email) {
    return redirectTo('/verify');
  }

  const result = await consumeMagicLinkToken(rawToken, email);
  if (!result.ok) {
    const reason = result.reason === 'expired' ? 'expired' : 'invalid';
    return redirectTo(`/verify?error=${reason}`);
  }

  const intent = await signMagicIntent(email);
  try {
    await signIn('magic', { email, intent, redirect: false });
  } catch (error) {
    console.error('[verify-magic] signIn error', error);
    return redirectTo('/verify?error=invalid');
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { onboardedAt: true },
  });

  const destination = user?.onboardedAt ? '/' : '/onboarding/I';
  return redirectTo(destination);
}
