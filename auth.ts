// Monétika — configuration Auth.js v5 complète (runtime node).
// Providers, callbacks DB et helpers. Le middleware edge utilise auth.config.ts à la place.

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { verifyPin } from '@/lib/auth/pin';
import { rateLimitPinAttempt } from '@/lib/auth/rate-limit';
import { authConfig } from './auth.config';

const magicSchema = z.object({
  email: z.string().email(),
  intent: z.string().min(16),
});

const pinSchema = z.object({
  email: z.string().email(),
  pin: z.string().regex(/^\d{6}$/u),
});

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
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
    ...authConfig.callbacks,
    // Côté node : on rafraîchit le token depuis la DB quand `update()` est déclenché
    // (ex. après l'étape VII de l'onboarding pour propager onboardedAt).
    async jwt({ token, user, trigger, session }) {
      // Applique d'abord la logique edge-safe.
      if (user) {
        token.id = user.id;
        const u = user as { onboardedAt?: string | null; locale?: string };
        token.onboardedAt = u.onboardedAt ?? null;
        token.locale = u.locale ?? 'fr';
      }
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
      // Permet un update manuel via session.update({...}).
      if (trigger === 'update' && session && typeof session === 'object') {
        const patch = session as { onboardedAt?: string | null };
        if ('onboardedAt' in patch) token.onboardedAt = patch.onboardedAt ?? null;
      }
      return token;
    },
  },
});

// HMAC-SHA256 via Web Crypto — compatible node 20+ et edge.
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
