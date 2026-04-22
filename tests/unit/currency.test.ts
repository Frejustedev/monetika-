import { describe, it, expect } from 'vitest';
import { formatAmount, splitAmount } from '@/lib/money/currency';

describe('formatAmount', () => {
  it('formate un montant XOF sans décimale en fr-BJ', () => {
    const out = formatAmount(125_000, 'XOF', { locale: 'fr', country: 'BJ' });
    // Le résultat exact dépend de la locale ICU : on vérifie le sens.
    expect(out).toMatch(/125/);
    expect(out).toMatch(/CFA|F/);
  });

  it('formate un montant NGN avec 2 décimales en en-NG', () => {
    const out = formatAmount(125_000, 'NGN', { locale: 'en', country: 'NG' });
    expect(out).toMatch(/125,000\.00/);
    expect(out).toMatch(/₦|NGN/);
  });

  it('applique le signe si demandé', () => {
    const out = formatAmount(-42, 'XOF', { locale: 'fr', country: 'CI', showSign: true });
    expect(out).toMatch(/-/);
  });
});

describe('splitAmount', () => {
  it('sépare symbole et chiffre pour permettre un rendu composite', () => {
    const { symbol, number } = splitAmount(125_000, 'XOF', { locale: 'fr', country: 'BJ' });
    expect(symbol.length).toBeGreaterThan(0);
    expect(number).toMatch(/125/);
  });
});
