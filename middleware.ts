import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

// Instance Auth.js minimale pour le middleware edge — pas de providers,
// pas de Prisma, juste la lecture du JWT et les callbacks edge-safe.
const { auth } = NextAuth(authConfig);

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

  if (!session?.user) {
    if (isProtected || isOnboarding) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!session.user.onboardedAt) {
    if (!isOnboarding && !isAuthPage) {
      const url = req.nextUrl.clone();
      url.pathname = '/onboarding/I';
      return NextResponse.redirect(url);
    }
  }

  if (session.user.onboardedAt && (isAuthPage || isOnboarding)) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|marks/|fonts/|splash/|og-image|sw.js|robots.txt|sitemap.xml).*)',
  ],
};
