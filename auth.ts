// Monétika — configuration Auth.js v5.
// Deux providers sur un backend unique (Credentials) :
//   - "magic": trust le token déjà consommé côté server action, identifie par email
//   - "pin"  : email + PIN 6 chiffres vérifié en bcrypt
// Session JWT, pas de DB sessions (nous gardons notre modèle Session pour l'audit).

import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { verifyPin } from '@/lib/auth/pin';
import { rateLimitPinAttempt } from '@/lib/auth/rate-limit';

const magicSchema = z.object({
  email: z.string().email(),
  // Un secret partagé entre l'action serveur qui a consommé le token
  // et le callback signIn. Empêche l'appel direct du provider depuis un client.
  // La value est dérivée d'AUTH_SECRET + email + timestamp court.
  intent: z.string().min(16),
});

const pinSchema = z.object({
  email: z.string().email(),
  pin: z.string().regex(/^\d{6}$/u),
});

export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 7 }, // 7 jours
  pages: {
    signIn: '/login',
    verifyRequest: '/verify',
    error: '/login',
  },
  providers: [
    Credentials({
      id: 'magic',
      name: 'Magic Link',
      credentials: {
        email: { type: 'email' },
        intent: { type: 'text' },
      },
      async authorize(creds) {
        const parsed = magicSchema.safeParse(creds);
        if (!parsed.success) return null;

        const { email, intent } = parsed.data;
        const secret = process.env.AUTH_SECRET ?? '';
        if (!secret) return null;

        // L'intent est signé par verifyMagicTokenIntent côté server action.
        // Ici on vérifie uniquement la structure + fraîcheur.
        const [timestamp, signature] = intent.split('.');
        if (!timestamp || !signature) return null;
        const ts = Number(timestamp);
        if (!Number.isFinite(ts) || Date.now() - ts > 5 * 60_000) return null;

        const expected = await sign(`${email}:${timestamp}`, secret);
        if (expected !== signature) return null;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            locale: true,
            onboardedAt: true,
          },
        });
        if (!user) return null;

        // Marque l'email comme vérifié si ce n'est pas déjà fait.
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: [user.firstName, user.lastName].filter(Boolean).join(' ') || null,
          onboardedAt: user.onboardedAt ? user.onboardedAt.toISOString() : null,
          locale: user.locale,
        };
      },
    }),
    Credentials({
      id: 'pin',
      name: 'PIN 6 chiffres',
      credentials: {
        email: { type: 'email' },
        pin: { type: 'password' },
      },
      async authorize(creds) {
        const parsed = pinSchema.safeParse(creds);
        if (!parsed.success) return null;

        const { email, pin } = parsed.data;
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            pinHash: true,
            locale: true,
            onboardedAt: true,
          },
        });
        if (!user || !user.pinHash) return null;

        const limit = rateLimitPinAttempt(user.id);
        if (!limit.allowed) return null;

        const ok = await verifyPin(pin, user.pinHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: [user.firstName, user.lastName].filter(Boolean).join(' ') || null,
          onboardedAt: user.onboardedAt ? user.onboardedAt.toISOString() : null,
          locale: user.locale,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.onboardedAt = (user as { onboardedAt?: string | null }).onboardedAt ?? null;
        token.locale = (user as { locale?: string }).locale ?? 'fr';
      }
      // Rafraîchit onboardedAt quand l'app le demande (après l'étape VII).
      if (trigger === 'update' && token.id) {
        const u = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { onboardedAt: true, locale: true },
        });
        if (u) {
          token.onboardedAt = u.onboardedAt ? u.onboardedAt.toISOString() : null;
          token.locale = u.locale;
        }
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

// Signature HMAC-SHA256 via Web Crypto — compatible edge runtime.
async function sign(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return Buffer.from(sig).toString('base64url');
}

export const signMagicIntent = async (email: string): Promise<string> => {
  const timestamp = String(Date.now());
  const secret = process.env.AUTH_SECRET ?? '';
  const signature = await sign(`${email.toLowerCase()}:${timestamp}`, secret);
  return `${timestamp}.${signature}`;
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
