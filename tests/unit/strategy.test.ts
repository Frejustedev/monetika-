import { describe, it, expect } from 'vitest';
import { DEFAULT_STRATEGY, validateStrategy, BUCKETS } from '@/lib/strategy/buckets';

describe('stratégie 6 comptes', () => {
  it('la répartition par défaut 55/15/10/10/5/5 somme à 100', () => {
    const result = validateStrategy(DEFAULT_STRATEGY);
    expect(result.total).toBe(100);
    expect(result.ok).toBe(true);
    expect(result.drift).toBe(0);
  });

  it('expose la répartition par défaut validée (option a : urgence boostée)', () => {
    expect(DEFAULT_STRATEGY.NECESSITIES).toBe(55);
    expect(DEFAULT_STRATEGY.EMERGENCY).toBe(15);
    expect(DEFAULT_STRATEGY.EDUCATION).toBe(10);
    expect(DEFAULT_STRATEGY.INVESTMENT).toBe(10);
    expect(DEFAULT_STRATEGY.JOY).toBe(5);
    expect(DEFAULT_STRATEGY.GIVE).toBe(5);
  });

  it('détecte un écart quand la somme n\u2019est pas 100', () => {
    const result = validateStrategy({
      NECESSITIES: 50,
      EMERGENCY: 10,
      EDUCATION: 10,
      INVESTMENT: 10,
      JOY: 10,
      GIVE: 5,
    });
    expect(result.ok).toBe(false);
    expect(result.drift).toBe(-5);
  });

  it('expose les 6 buckets', () => {
    expect(BUCKETS).toHaveLength(6);
  });
});
