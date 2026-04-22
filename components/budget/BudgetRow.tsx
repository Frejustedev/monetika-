'use client';

import * as React from 'react';
import { Amount } from '@/components/money/Amount';
import { BudgetEditSheet } from './BudgetEditSheet';
import type { SupportedCurrency, SupportedLocale } from '@/lib/money/currency';
import { cn } from '@/lib/utils';

type Props = {
  categoryId: string;
  categoryLabel: string;
  categoryColor: string;
  spent: number;
  monthlyLimit: number; // 0 = pas de budget
  currency: string;
  ratio: number;
  tone: 'calm' | 'watch' | 'over';
  alertAt70: boolean;
  alertAt90: boolean;
  blockAt100: boolean;
  locale?: SupportedLocale;
};

const TONE_CLASS: Record<Props['tone'], string> = {
  calm: 'bg-[color:var(--forest)]',
  watch: 'bg-[color:var(--ochre)]',
  over: 'bg-[color:var(--terracotta)]',
};

export function BudgetRow(props: Props) {
  const { categoryLabel, spent, monthlyLimit, currency, ratio, tone, locale = 'fr' } = props;
  const [editOpen, setEditOpen] = React.useState(false);
  const progress = Math.min(Math.max(ratio, 0), 1) * 100;
  const hasBudget = monthlyLimit > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setEditOpen(true)}
        className="flex w-full flex-col gap-2 border-b border-border py-4 text-left transition-colors hover:bg-[color:var(--surface)]"
      >
        <div className="flex items-baseline justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="h-2 w-2 flex-shrink-0 rounded-full"
              style={{ background: props.categoryColor }}
              aria-hidden
            />
            <span className="truncate text-[15px] text-foreground">{categoryLabel}</span>
            {tone === 'over' && hasBudget ? (
              <span className="ml-1 font-mono text-[9px] uppercase tracking-[0.18em] text-[color:var(--terracotta)]">
                {locale === 'fr' ? 'Dépassé' : 'Over'}
              </span>
            ) : null}
            {tone === 'watch' && hasBudget ? (
              <span className="ml-1 font-mono text-[9px] uppercase tracking-[0.18em] text-[color:var(--ochre)]">
                {locale === 'fr' ? '70 %' : '70%'}
              </span>
            ) : null}
          </div>
          <div className="flex flex-col items-end text-sm">
            <Amount
              value={spent}
              currency={currency as SupportedCurrency}
              locale={locale}
              size="sm"
              className="font-medium"
            />
            {hasBudget ? (
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                / <Amount value={monthlyLimit} currency={currency as SupportedCurrency} locale={locale} size="sm" className="font-normal" />
              </span>
            ) : (
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {locale === 'fr' ? 'Sans plafond' : 'No cap'}
              </span>
            )}
          </div>
        </div>
        {hasBudget ? (
          <div className="h-1 w-full overflow-hidden rounded-full bg-[color:var(--bone)]">
            <span
              className={cn('block h-full transition-[width] duration-[var(--dur-normal)] ease-[var(--ease-monetika)]', TONE_CLASS[tone])}
              style={{ width: `${progress}%` }}
              aria-hidden
            />
          </div>
        ) : null}
      </button>
      {editOpen ? (
        <BudgetEditSheet
          categoryId={props.categoryId}
          categoryLabel={props.categoryLabel}
          monthlyLimit={props.monthlyLimit}
          currency={props.currency}
          alertAt70={props.alertAt70}
          alertAt90={props.alertAt90}
          blockAt100={props.blockAt100}
          locale={locale}
          onClose={() => setEditOpen(false)}
        />
      ) : null}
    </>
  );
}
