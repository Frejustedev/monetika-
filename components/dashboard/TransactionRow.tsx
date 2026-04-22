import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { Amount } from '@/components/money/Amount';
import type { SupportedCurrency, SupportedLocale } from '@/lib/money/currency';
import { cn } from '@/lib/utils';

type Props = {
  occurredAt: Date;
  kind: 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'ADJUSTMENT';
  amount: number;
  currency: string;
  accountLabel: string;
  categoryLabel?: string | null;
  merchant?: string | null;
  note?: string | null;
  locale?: SupportedLocale;
  className?: string;
};

export function TransactionRow({
  occurredAt,
  kind,
  amount,
  currency,
  accountLabel,
  categoryLabel,
  merchant,
  note,
  locale = 'fr',
  className,
}: Props) {
  const dateLocale = locale === 'fr' ? fr : enUS;
  const dateLabel = format(occurredAt, locale === 'fr' ? 'd MMM' : 'd MMM', { locale: dateLocale });

  const signedAmount = kind === 'EXPENSE' || kind === 'TRANSFER' ? -amount : amount;
  const title = merchant ?? categoryLabel ?? note ?? accountLabel;
  const subtitle =
    kind === 'TRANSFER'
      ? locale === 'fr'
        ? 'Transfert'
        : 'Transfer'
      : kind === 'ADJUSTMENT'
        ? locale === 'fr'
          ? 'Ajustement'
          : 'Adjustment'
        : categoryLabel
          ? `${categoryLabel} · ${accountLabel}`
          : accountLabel;

  return (
    <div className={cn('flex items-baseline gap-4 border-b border-border py-3 last:border-b-0', className)}>
      <span className="w-14 flex-shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {dateLabel}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] text-foreground">{title}</p>
        <p className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {subtitle}
        </p>
      </div>
      <Amount
        value={signedAmount}
        currency={currency as SupportedCurrency}
        locale={locale}
        size="sm"
        showSignColor
        className="flex-shrink-0 font-medium"
      />
    </div>
  );
}
