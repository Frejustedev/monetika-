// Rendu composite d'un montant : symbole plus petit (60%), chiffres en Fraunces tabular.
// C'est le composant à utiliser pour tout montant affiché dans l'app.

import { splitAmount, type SupportedCurrency, type SupportedLocale, type CountryCode } from '@/lib/money/currency';
import { cn } from '@/lib/utils';

type AmountProps = {
  value: number | string;
  currency: SupportedCurrency;
  locale?: SupportedLocale;
  country?: CountryCode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  className?: string;
  negativeToneClass?: string;
  showSignColor?: boolean;
};

const SIZE_MAP = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-3xl',
  xl: 'text-5xl',
  xxl: 'text-7xl',
} as const;

// Taille du symbole monétaire — 62% du chiffre, non gras.
const SYMBOL_SIZE = '0.62em';

export function Amount({
  value,
  currency,
  locale = 'fr',
  country,
  size = 'md',
  className,
  negativeToneClass = 'text-[color:var(--terracotta)]',
  showSignColor = false,
}: AmountProps) {
  const numeric = typeof value === 'string' ? Number(value) : value;
  const { symbol, number, sign } = splitAmount(numeric, currency, { locale, country });
  const isNegative = numeric < 0 || sign === '-';

  return (
    <span
      className={cn(
        'amount-xl inline-flex items-baseline',
        SIZE_MAP[size],
        showSignColor && isNegative ? negativeToneClass : '',
        className,
      )}
      data-numeric
    >
      <span
        className="mr-1 font-medium text-muted-foreground"
        style={{ fontSize: SYMBOL_SIZE, letterSpacing: 0 }}
        aria-hidden
      >
        {symbol}
      </span>
      <span>{number.replace(/\s/g, '\u202F')}</span>
      <span className="sr-only">
        {` ${symbol}`}
      </span>
    </span>
  );
}
