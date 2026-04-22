'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from '@phosphor-icons/react/dist/ssr';
import { BudgetEditSheet } from '@/components/budget/BudgetEditSheet';

type Props = {
  categories: Array<{ id: string; label: string; color: string }>;
  currency: string;
  locale?: 'fr' | 'en';
};

export function AddBudgetButton({ categories, currency, locale = 'fr' }: Props) {
  const t = useTranslations('budget');
  const [step, setStep] = React.useState<'closed' | 'picking' | 'editing'>('closed');
  const [selected, setSelected] = React.useState<Props['categories'][number] | null>(null);

  if (categories.length === 0) return null;

  const handlePick = (cat: Props['categories'][number]) => {
    setSelected(cat);
    setStep('editing');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setStep('picking')}
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
      >
        <Plus size={12} weight="bold" />
        {t('addBudget')}
      </button>

      {step === 'picking' ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[color:var(--background)]/60 backdrop-blur-sm md:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setStep('closed');
          }}
        >
          <div className="w-full max-w-md rounded-t-[20px] border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:rounded-[20px] md:border">
            <header className="border-b border-border px-5 py-3">
              <p className="editorial-title text-lg text-foreground">{t('pickCategory')}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t('pickCategoryHint')}</p>
            </header>
            <ul className="max-h-[60vh] overflow-y-auto py-2">
              {categories.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => handlePick(c)}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left text-sm transition-colors hover:bg-[color:var(--surface)]"
                  >
                    <span
                      className="h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ background: c.color }}
                      aria-hidden
                    />
                    <span>{c.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {step === 'editing' && selected ? (
        <BudgetEditSheet
          categoryId={selected.id}
          categoryLabel={selected.label}
          monthlyLimit={0}
          currency={currency}
          alertAt70
          alertAt90
          blockAt100={false}
          locale={locale}
          onClose={() => {
            setSelected(null);
            setStep('closed');
          }}
        />
      ) : null}
    </>
  );
}
