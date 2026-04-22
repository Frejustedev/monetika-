'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { contributeToGoalAction, type ActionResult } from '@/server/actions/goals';
import type { SupportedCurrency, SupportedLocale } from '@/lib/money/currency';
import { fieldError, globalError } from '@/lib/utils';

type Props = {
  id: string;
  currency: SupportedCurrency;
  suggestedAmount: number;
  locale?: SupportedLocale;
};

const initial: ActionResult | undefined = undefined;

export function ContributeForm({ id, currency, suggestedAmount }: Props) {
  const t = useTranslations('goals.detail.contribute');
  const [state, action, pending] = useActionState(contributeToGoalAction, initial);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-[10px] border border-border bg-background p-4">
      <input type="hidden" name="id" value={id} />
      <Input
        name="amount"
        type="number"
        label={t('amount', { currency })}
        defaultValue={suggestedAmount > 0 ? String(suggestedAmount) : ''}
        inputMode="numeric"
        step="any"
        min={0}
        required
        error={fieldError(state, 'amount')}
      />
      <Input name="note" label={t('note')} placeholder={t('notePlaceholder')} />
      {state?.ok ? (
        <p className="text-xs text-[color:var(--forest)]">{state.message}</p>
      ) : null}
      {globalError(state) ? (
        <p className="text-xs text-[color:var(--terracotta)]">{globalError(state)}</p>
      ) : null}
      <Button type="submit" size="md" disabled={pending}>
        {pending ? t('saving') : t('save')}
      </Button>
    </form>
  );
}
