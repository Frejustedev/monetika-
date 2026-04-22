'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BUCKETS, BUCKET_LABELS_FR, BUCKET_LABELS_EN } from '@/lib/strategy/buckets';
import { createGoalAction, type ActionResult } from '@/server/actions/goals';
import { formatAmount, type SupportedCurrency, type SupportedLocale } from '@/lib/money/currency';
import { fieldError, globalError, cn } from '@/lib/utils';

type Props = {
  accounts: Array<{ id: string; label: string; currency: string; color: string }>;
  defaultCurrency: string;
  locale: SupportedLocale;
};

const initial: ActionResult | undefined = undefined;

export function GoalForm({ accounts, defaultCurrency, locale }: Props) {
  const t = useTranslations('goals.new');
  const [state, action, pending] = useActionState(createGoalAction, initial);

  const [targetAmount, setTargetAmount] = React.useState('');
  const [startingAmount, setStartingAmount] = React.useState('0');
  const [targetDate, setTargetDate] = React.useState(defaultTargetDate());
  const [bucket, setBucket] = React.useState<(typeof BUCKETS)[number]>('INVESTMENT');
  const [accountId, setAccountId] = React.useState<string>(accounts[0]?.id ?? '');

  const labels = locale === 'fr' ? BUCKET_LABELS_FR : BUCKET_LABELS_EN;

  // Calcul live de la contribution mensuelle recommandée.
  const monthly = React.useMemo(() => {
    const target = Number(targetAmount);
    const starting = Number(startingAmount);
    if (!target || target <= starting || !targetDate) return null;
    const months = Math.max(1, monthsBetween(new Date(), new Date(targetDate)));
    const remaining = target - starting;
    return Math.ceil(remaining / months);
  }, [targetAmount, startingAmount, targetDate]);

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const currency = (selectedAccount?.currency ?? defaultCurrency) as SupportedCurrency;

  return (
    <form action={action} className="flex flex-col gap-6">
      <Input
        name="name"
        label={t('fields.name')}
        placeholder={t('fields.namePlaceholder')}
        required
        error={fieldError(state, 'name')}
      />

      <Input
        name="targetAmount"
        type="number"
        label={t('fields.targetAmount', { currency })}
        value={targetAmount}
        onChange={(e) => setTargetAmount(e.target.value)}
        inputMode="numeric"
        step="any"
        min={0}
        required
        error={fieldError(state, 'targetAmount')}
      />

      <Input
        name="targetDate"
        type="date"
        label={t('fields.targetDate')}
        value={targetDate}
        onChange={(e) => setTargetDate(e.target.value)}
        required
        error={fieldError(state, 'targetDate')}
      />

      <Input
        name="startingAmount"
        type="number"
        label={t('fields.startingAmount', { currency })}
        value={startingAmount}
        onChange={(e) => setStartingAmount(e.target.value)}
        inputMode="numeric"
        step="any"
        min={0}
        hint={t('fields.startingHint')}
      />

      {/* Contribution mensuelle calculée */}
      {monthly ? (
        <div className="rounded-[10px] border border-[color:var(--ochre)]/50 bg-[color:var(--ochre)]/8 px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--ochre)]">
            {t('monthlyCalc.overline')}
          </p>
          <p className="mt-1 text-sm text-foreground">
            {t('monthlyCalc.body', {
              amount: formatAmount(monthly, currency, { locale }),
            })}
          </p>
        </div>
      ) : null}

      {/* Bucket */}
      <fieldset>
        <legend className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {t('fields.bucket')}
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {BUCKETS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBucket(b)}
              aria-pressed={bucket === b}
              className={cn(
                'rounded-[10px] border px-3 py-2 text-sm transition-colors',
                bucket === b
                  ? 'border-[color:var(--forest)] bg-[color:var(--surface)]'
                  : 'border-border text-muted-foreground hover:bg-[color:var(--surface)]',
              )}
            >
              {labels[b].long}
            </button>
          ))}
        </div>
        <input type="hidden" name="strategyBucket" value={bucket} />
      </fieldset>

      {/* Account */}
      {accounts.length > 0 ? (
        <fieldset>
          <legend className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {t('fields.account')}
          </legend>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAccountId('')}
              aria-pressed={accountId === ''}
              className={cn(
                'rounded-[10px] border px-3 py-2 text-sm transition-colors',
                accountId === ''
                  ? 'border-[color:var(--forest)] bg-[color:var(--surface)]'
                  : 'border-border text-muted-foreground hover:bg-[color:var(--surface)]',
              )}
            >
              {t('fields.noAccount')}
            </button>
            {accounts.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAccountId(a.id)}
                aria-pressed={accountId === a.id}
                className={cn(
                  'inline-flex items-center gap-2 rounded-[10px] border px-3 py-2 text-sm transition-colors',
                  accountId === a.id
                    ? 'border-[color:var(--forest)] bg-[color:var(--surface)]'
                    : 'border-border text-muted-foreground hover:bg-[color:var(--surface)]',
                )}
              >
                <span
                  className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ background: a.color }}
                  aria-hidden
                />
                <span>{a.label}</span>
              </button>
            ))}
          </div>
          <input type="hidden" name="accountId" value={accountId} />
        </fieldset>
      ) : null}

      {globalError(state) ? (
        <p className="rounded-[10px] border border-[color:var(--terracotta)] bg-[color:var(--terracotta)]/10 px-4 py-3 text-sm text-[color:var(--terracotta)]">
          {globalError(state)}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? t('submitting') : t('submit')}
      </Button>
    </form>
  );
}

function defaultTargetDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

function monthsBetween(from: Date, to: Date): number {
  return Math.max(0, (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()));
}
