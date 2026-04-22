// Config Auth.js edge-safe — importée par le middleware.
// NE DOIT PAS importer Prisma, bcrypt, Resend, ni aucun code qui dépasse Edge.
// Les providers (Credentials avec DB) sont ajoutés dans auth.ts uniquement.

import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 7 },
  pages: {
    signIn: '/login',
    verifyRequest: '/verify',
    error: '/login',
  },
  // Pas de providers ici — ils seront ajoutés côté node dans auth.ts.
  providers: [],
  callbacks: {
    // Edge-safe : lecture du token JWT, aucun accès DB.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const u = user as { onboardedAt?: string | null; locale?: string };
        token.onboardedAt = u.onboardedAt ?? null;
        token.locale = u.locale ?? 'fr';
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
        session.user.onboardedAt = (token.onboardedAt as string | null) ?? null;
        session.user.locale = (token.locale as string) ?? 'fr';
      }
      return session;
    },
  },
};
