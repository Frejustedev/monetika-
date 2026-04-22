import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// Routes strictement protégées — redirige vers /login si non authentifié.
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/accounts',
  '/transactions',
  '/budget',
  '/goals',
  '/insights',
  '/score',
  '/settings',
];
const ONBOARDING_PREFIX = '/onboarding';
// Pages d'auth — accessibles seulement si NON authentifié.
const AUTH_PAGES = ['/login', '/signup', '/verify'];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const isOnboarding = pathname.startsWith(ONBOARDING_PREFIX);
  const isAuthPage = AUTH_PAGES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  // Pas connecté : seules les pages d'auth et la home publique sont accessibles.
  if (!session?.user) {
    if (isProtected || isOnboarding) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Connecté mais pas onboardé → forcer /onboarding/I (sauf déjà en onboarding ou sur une page auth/verify).
  if (!session.user.onboardedAt) {
    if (!isOnboarding && !isAuthPage) {
      const url = req.nextUrl.clone();
      url.pathname = '/onboarding/I';
      return NextResponse.redirect(url);
    }
  }

  // Connecté & onboardé → pages auth et onboarding redirigent vers la home (dashboard).
  if (session.user.onboardedAt && (isAuthPage || isOnboarding)) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|marks/|fonts/|og-image|robots.txt|sitemap.xml).*)',
  ],
};
