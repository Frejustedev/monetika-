'use client';

import { TransactionKind } from '@prisma/client';
import { cn } from '@/lib/utils';

type TxKind = typeof TransactionKind.EXPENSE | typeof TransactionKind.INCOME | typeof TransactionKind.TRANSFER;

type Props = {
  value: TxKind;
  onChange: (kind: TxKind) => void;
  locale?: 'fr' | 'en';
};

const TABS: TxKind[] = [TransactionKind.EXPENSE, TransactionKind.INCOME, TransactionKind.TRANSFER];

const LABELS_FR: Record<TxKind, string> = {
  EXPENSE: 'Dépense',
  INCOME: 'Revenu',
  TRANSFER: 'Transfert',
};
const LABELS_EN: Record<TxKind, string> = {
  EXPENSE: 'Expense',
  INCOME: 'Income',
  TRANSFER: 'Transfer',
};

export function KindTabs({ value, onChange, locale = 'fr' }: Props) {
  const labels = locale === 'fr' ? LABELS_FR : LABELS_EN;

  return (
    <div className="flex items-center gap-1 rounded-[10px] border border-border bg-[color:var(--surface)] p-1">
      {TABS.map((k) => {
        const isActive = value === k;
        return (
          <button
            key={k}
            type="button"
            onClick={() => onChange(k)}
            aria-pressed={isActive}
            className={cn(
              'flex-1 rounded-[8px] px-3 py-2 text-sm transition-colors',
              isActive
                ? k === TransactionKind.EXPENSE
                  ? 'bg-background text-[color:var(--terracotta)] shadow-sm'
                  : k === TransactionKind.INCOME
                    ? 'bg-background text-[color:var(--forest)] shadow-sm'
                    : 'bg-background text-[color:var(--sky)] shadow-sm'
                : 'text-muted-foreground',
            )}
          >
            {labels[k]}
          </button>
        );
      })}
    </div>
  );
}
