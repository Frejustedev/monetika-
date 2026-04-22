'use client';

import type { SupportedCurrency, SupportedLocale } from '@/lib/money/currency';
import { formatAmount } from '@/lib/money/currency';
import { cn } from '@/lib/utils';

type Props = {
  label: string;
  amount: number;
  currency: SupportedCurrency;
  locale?: SupportedLocale;
  onAccept: () => void;
  className?: string;
};

// Suggestion 1-tap — affichée au-dessus du pavé quand un pattern fréquent matche.
export function SuggestionLine({ label, amount, currency, locale = 'fr', onAccept, className }: Props) {
  const formatted = formatAmount(amount, currency, { locale });
  return (
    <button
      type="button"
      onClick={onAccept}
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-[10px] border border-[color:var(--ochre)] bg-[color:var(--ochre)]/8 px-4 py-3 text-left transition-colors hover:bg-[color:var(--ochre)]/15',
        className,
      )}
    >
      <span className="flex min-w-0 flex-col">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--ochre)]">
          {locale === 'fr' ? 'Suggestion' : 'Suggestion'}
        </span>
        <span className="truncate text-sm text-foreground">
          {label} ·{' '}
          <span className="font-display tabular-nums font-medium" data-numeric>
            {formatted}
          </span>
        </span>
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {locale === 'fr' ? 'Tap pour valider' : 'Tap to log'}
      </span>
    </button>
  );
}
