import { describe, it, expect } from 'vitest';
import { pinSchema, hashPin, verifyPin, isWeakPin } from '@/lib/auth/pin';

describe('pinSchema', () => {
  it('accepte 6 chiffres', () => {
    expect(pinSchema.safeParse('493021').success).toBe(true);
  });
  it('refuse tout sauf 6 chiffres', () => {
    expect(pinSchema.safeParse('12345').success).toBe(false);
    expect(pinSchema.safeParse('1234567').success).toBe(false);
    expect(pinSchema.safeParse('abcdef').success).toBe(false);
    expect(pinSchema.safeParse('12 34 56').success).toBe(false);
  });
});

describe('isWeakPin', () => {
  it('repère les suites croissantes', () => {
    expect(isWeakPin('123456')).toBe(true);
    expect(isWeakPin('234567')).toBe(true);
  });
  it('repère les suites décroissantes', () => {
    expect(isWeakPin('987654')).toBe(true);
    expect(isWeakPin('654321')).toBe(true);
  });
  it('repère les répétitions', () => {
    expect(isWeakPin('111111')).toBe(true);
    expect(isWeakPin('000000')).toBe(true);
  });
  it('laisse passer un PIN non trivial', () => {
    expect(isWeakPin('493021')).toBe(false);
    expect(isWeakPin('847193')).toBe(false);
  });
});

describe('hashPin / verifyPin', () => {
  it('produit un hash bcrypt et vérifie', async () => {
    const hash = await hashPin('493021');
    expect(hash.length).toBeGreaterThan(20);
    expect(hash.startsWith('$2')).toBe(true);
    expect(await verifyPin('493021', hash)).toBe(true);
    expect(await verifyPin('493020', hash)).toBe(false);
  });
  it('refuse les PIN malformés sans lancer', async () => {
    const hash = await hashPin('493021');
    expect(await verifyPin('bad', hash)).toBe(false);
    expect(await verifyPin('', hash)).toBe(false);
  });
});
