import { format, isToday, isYesterday } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { Amount } from '@/components/money/Amount';
import { TransactionRow } from '@/components/dashboard/TransactionRow';
import type { SupportedCurrency, SupportedLocale } from '@/lib/money/currency';

type Tx = {
  id: string;
  occurredAt: Date;
  kind: 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'ADJUSTMENT';
  amount: number;
  currency: string;
  accountLabel: string;
  categoryLabel?: string | null;
  merchant?: string | null;
  note?: string | null;
};

type Props = {
  day: Date;
  transactions: Tx[];
  locale?: SupportedLocale;
};

export function DayGroup({ day, transactions, locale = 'fr' }: Props) {
  const dateLocale = locale === 'fr' ? fr : enUS;

  let label: string;
  if (isToday(day)) label = locale === 'fr' ? "aujourd'hui" : 'today';
  else if (isYesterday(day)) label = locale === 'fr' ? 'hier' : 'yesterday';
  else label = format(day, locale === 'fr' ? 'EEEE d MMMM' : 'EEEE d MMMM', { locale: dateLocale });

  // Solde net du jour (EXPENSE négatif, INCOME positif, TRANSFER neutre en net worth)
  const currency = transactions[0]?.currency ?? 'XOF';
  const net = transactions.reduce((sum, t) => {
    if (t.kind === 'EXPENSE') return sum - t.amount;
    if (t.kind === 'INCOME') return sum + t.amount;
    return sum;
  }, 0);

  return (
    <section className="mt-8 first:mt-0">
      <header className="mb-2 flex items-baseline justify-between gap-3 border-b border-border pb-2">
        <h2 className="editorial-title text-foreground">{label}</h2>
        <Amount
          value={net}
          currency={currency as SupportedCurrency}
          locale={locale}
          size="sm"
          showSignColor
          className="font-medium tabular-nums"
        />
      </header>
      <div>
        {transactions.map((tx) => (
          <TransactionRow
            key={tx.id}
            occurredAt={tx.occurredAt}
            kind={tx.kind}
            amount={tx.amount}
            currency={tx.currency}
            accountLabel={tx.accountLabel}
            categoryLabel={tx.categoryLabel}
            merchant={tx.merchant}
            note={tx.note}
            locale={locale}
          />
        ))}
      </div>
    </section>
  );
}
