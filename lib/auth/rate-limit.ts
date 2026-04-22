// Rate limit minimaliste en mémoire. Suffisant V1 — on plugue Upstash plus tard.
// Efficace sur un seul process Node. Les runtimes edge/serverless peuvent avoir
// plusieurs instances, donc c'est un garde-fou « best effort » avant Redis.

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt < now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}

// Cooldown 60 s par email pour les magic links.
export function rateLimitMagicLink(email: string): RateLimitResult {
  return rateLimit(`magic:${email.toLowerCase()}`, 3, 5 * 60_000); // 3 par 5 min
}

// Cooldown plus strict pour l'essai PIN (anti brute-force).
export function rateLimitPinAttempt(userId: string): RateLimitResult {
  return rateLimit(`pin:${userId}`, 5, 15 * 60_000); // 5 par 15 min
}
