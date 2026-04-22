// Monétika — formatage monétaire centralisé.
// Tous les montants de l'application passent par ici.

export type SupportedCurrency = 'XOF' | 'NGN' | 'GHS';
export type SupportedLocale = 'fr' | 'en';

export type CountryCode =
  | 'BJ'
  | 'BF'
  | 'CI'
  | 'GW'
  | 'ML'
  | 'NE'
  | 'SN'
  | 'TG'
  | 'NG'
  | 'GH';

export const COUNTRY_TO_CURRENCY: Record<CountryCode, SupportedCurrency> = {
  BJ: 'XOF',
  BF: 'XOF',
  CI: 'XOF',
  GW: 'XOF',
  ML: 'XOF',
  NE: 'XOF',
  SN: 'XOF',
  TG: 'XOF',
  NG: 'NGN',
  GH: 'GHS',
};

export const CURRENCY_FRACTION_DIGITS: Record<SupportedCurrency, number> = {
  XOF: 0,
  NGN: 2,
  GHS: 2,
};

function bcpTagFor(locale: SupportedLocale, country: CountryCode): string {
  return `${locale}-${country}`;
}

export function formatAmount(
  amount: number,
  currency: SupportedCurrency,
  options: { locale?: SupportedLocale; country?: CountryCode; showSign?: boolean } = {},
): string {
  const locale = options.locale ?? 'fr';
  const country: CountryCode = options.country ?? (currency === 'NGN' ? 'NG' : currency === 'GHS' ? 'GH' : 'BJ');
  const fractionDigits = CURRENCY_FRACTION_DIGITS[currency];

  const tag = bcpTagFor(locale, country);
  const formatter = new Intl.NumberFormat(tag, {
    style: 'currency',
    currency,
    currencyDisplay: 'symbol',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
    signDisplay: options.showSign ? 'exceptZero' : 'auto',
  });

  return formatter.format(amount);
}

// Renvoie { symbol, number } pour composer un rendu où le symbole est plus petit que le chiffre.
export function splitAmount(
  amount: number,
  currency: SupportedCurrency,
  options: { locale?: SupportedLocale; country?: CountryCode } = {},
): { symbol: string; number: string; sign: string } {
  const locale = options.locale ?? 'fr';
  const country: CountryCode = options.country ?? (currency === 'NGN' ? 'NG' : currency === 'GHS' ? 'GH' : 'BJ');
  const fractionDigits = CURRENCY_FRACTION_DIGITS[currency];

  const tag = bcpTagFor(locale, country);
  const formatter = new Intl.NumberFormat(tag, {
    style: 'currency',
    currency,
    currencyDisplay: 'symbol',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

  const parts = formatter.formatToParts(amount);
  let symbol = '';
  let number = '';
  let sign = '';

  for (const part of parts) {
    if (part.type === 'currency') symbol += part.value;
    else if (part.type === 'minusSign' || part.type === 'plusSign') sign += part.value;
    else if (part.type === 'literal') number += part.value;
    else number += part.value;
  }

  return { symbol: symbol.trim(), number: number.trim(), sign };
}
