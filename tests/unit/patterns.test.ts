import { describe, it, expect } from 'vitest';
import { computeAmountBin, hourOfDay, dayOfWeek } from '@/lib/patterns';

describe('computeAmountBin', () => {
  it('place un petit montant dans le premier palier', () => {
    expect(computeAmountBin(50)).toBe(0);
    expect(computeAmountBin(499)).toBe(0);
  });
  it('groupe les montants proches dans le même palier', () => {
    // 2000 et 2100 doivent aller dans le même palier (2k-5k)
    expect(computeAmountBin(2000)).toBe(computeAmountBin(2100));
  });
  it('différencie les paliers distincts', () => {
    expect(computeAmountBin(5000)).not.toBe(computeAmountBin(20_000));
  });
  it('plafonne au palier maximum', () => {
    expect(computeAmountBin(5_000_000)).toBe(9);
  });
});

describe('hourOfDay / dayOfWeek', () => {
  it('extrait heure et jour d\u2019un Date', () => {
    const d = new Date('2026-04-22T14:30:00');
    expect(hourOfDay(d)).toBe(14);
    // 22 avril 2026 est un mercredi → 3
    expect(dayOfWeek(d)).toBe(3);
  });
});
