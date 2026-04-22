// Gestion des magic link tokens côté serveur.
// Utilise la table VerificationToken (compatible Auth.js).

import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { prisma } from '@/lib/db/client';

export const TOKEN_TTL_MINUTES = 15;

// On génère un token aléatoire URL-safe. On stocke un hash SHA-256, pas le token en clair.
function generateRawToken(): string {
  return randomBytes(32).toString('base64url');
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createMagicLinkToken(email: string): Promise<{ rawToken: string; expires: Date }> {
  const rawToken = generateRawToken();
  const hashed = hashToken(rawToken);
  const expires = new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000);

  // Invalide les anciens tokens pour cet email (un seul actif à la fois).
  await prisma.verificationToken.deleteMany({ where: { identifier: email.toLowerCase() } });
  await prisma.verificationToken.create({
    data: {
      identifier: email.toLowerCase(),
      token: hashed,
      expires,
    },
  });

  return { rawToken, expires };
}

type ConsumeResult = { ok: true; email: string } | { ok: false; reason: 'invalid' | 'expired' };

export async function consumeMagicLinkToken(rawToken: string, email: string): Promise<ConsumeResult> {
  if (!rawToken || !email) return { ok: false, reason: 'invalid' };
  const hashed = hashToken(rawToken);
  const record = await prisma.verificationToken.findUnique({
    where: { token: hashed },
  });
  if (!record) return { ok: false, reason: 'invalid' };

  // Vérif en temps constant de l'email attendu.
  const expected = Buffer.from(record.identifier);
  const received = Buffer.from(email.toLowerCase());
  const emailMatches =
    expected.length === received.length && timingSafeEqual(expected, received);

  if (!emailMatches) return { ok: false, reason: 'invalid' };

  if (record.expires.getTime() < Date.now()) {
    await prisma.verificationToken.delete({ where: { token: hashed } }).catch(() => {});
    return { ok: false, reason: 'expired' };
  }

  // Token consommé une seule fois.
  await prisma.verificationToken.delete({ where: { token: hashed } });
  return { ok: true, email: record.identifier };
}

// Garbage collection périodique — appelée par Vercel Cron ou à la main.
export async function cleanupExpiredTokens(): Promise<number> {
  const { count } = await prisma.verificationToken.deleteMany({
    where: { expires: { lt: new Date() } },
  });
  return count;
}
