import bcrypt from 'bcryptjs';
import { z } from 'zod';

export const PIN_LENGTH = 6;

export const pinSchema = z
  .string()
  .regex(/^\d{6}$/u, 'PIN invalide : 6 chiffres attendus.');

const ROUNDS = 12;

export async function hashPin(pin: string): Promise<string> {
  pinSchema.parse(pin);
  return bcrypt.hash(pin, ROUNDS);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  if (!/^\d{6}$/.test(pin) || !hash) return false;
  return bcrypt.compare(pin, hash);
}

// Rejet de PIN faibles (séquences évidentes, répétitions).
export function isWeakPin(pin: string): boolean {
  if (!/^\d{6}$/.test(pin)) return false;
  if (/^(\d)\1{5}$/.test(pin)) return true; // 000000, 111111, …

  const digits = pin.split('').map(Number);
  let ascending = true;
  let descending = true;
  for (let i = 1; i < digits.length; i++) {
    const current = digits[i]!;
    const previous = digits[i - 1]!;
    if (current !== previous + 1) ascending = false;
    if (current !== previous - 1) descending = false;
  }
  if (ascending || descending) return true;

  const COMMON = new Set(['123456', '654321', '111222', '121212', '112233', '101010']);
  return COMMON.has(pin);
}
