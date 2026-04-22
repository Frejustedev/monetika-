'use client';

import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { adjustBalanceAction, type ActionResult } from '@/server/actions/accounts';
import { globalError } from '@/lib/utils';

type Props = {
  id: string;
  currentBalance: number;
  currency: string;
};

const initial: ActionResult | undefined = undefined;

export function AdjustBalanceForm({ id, currentBalance, currency }: Props) {
  const t = useTranslations('accounts.detail.adjust');
  const [state, action, pending] = useActionState(adjustBalanceAction, initial);
  const [open, setOpen] = useState(false);

  if (!open && !state?.ok) {
    return (
      <div className="rounded-[10px] border border-border p-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {t('overline')}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{t('body')}</p>
        <Button size="sm" variant="secondary" className="mt-4" onClick={() => setOpen(true)}>
          {t('open')}
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="rounded-[10px] border border-border p-4">
      <input type="hidden" name="id" value={id} />
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {t('overline')}
      </p>
      <div className="mt-3 flex flex-col gap-3">
        <Input
          name="newBalance"
          type="number"
          label={t('newBalance', { currency })}
          defaultValue={currentBalance.toString()}
          step="any"
          required
        />
        <Input name="note" label={t('note')} placeholder={t('notePlaceholder')} />
      </div>
      {state?.ok ? (
        <p className="mt-3 text-xs text-[color:var(--forest)]">{state.message}</p>
      ) : null}
      {globalError(state) ? (
        <p className="mt-3 text-xs text-[color:var(--terracotta)]">{globalError(state)}</p>
      ) : null}
      <div className="mt-4 flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => setOpen(false)} type="button">
          {t('cancel')}
        </Button>
        <Button size="sm" type="submit" disabled={pending} className="flex-1">
          {pending ? t('saving') : t('save')}
        </Button>
      </div>
    </form>
  );
}
