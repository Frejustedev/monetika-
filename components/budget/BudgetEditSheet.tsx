'use client';

import * as React from 'react';
import { useActionState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { X } from '@phosphor-icons/react/dist/ssr';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { upsertBudgetAction, type ActionResult } from '@/server/actions/budgets';
import { globalError } from '@/lib/utils';

type Props = {
  categoryId: string;
  categoryLabel: string;
  monthlyLimit: number;
  currency: string;
  alertAt70: boolean;
  alertAt90: boolean;
  blockAt100: boolean;
  locale?: 'fr' | 'en';
  onClose: () => void;
};

const initial: ActionResult | undefined = undefined;

export function BudgetEditSheet({
  categoryId,
  categoryLabel,
  monthlyLimit,
  currency,
  alertAt70,
  alertAt90,
  blockAt100,
  onClose,
}: Props) {
  const t = useTranslations('budget.edit');
  const [state, action, pending] = useActionState(upsertBudgetAction, initial);
  const [, start] = useTransition();

  // Ferme automatiquement après succès.
  React.useEffect(() => {
    if (!state?.ok) return undefined;
    const id = setTimeout(() => onClose(), 250);
    return () => clearTimeout(id);
  }, [state, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[color:var(--background)]/60 backdrop-blur-sm md:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-t-[20px] border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:rounded-[20px] md:border">
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <p className="editorial-title text-lg text-foreground">{categoryLabel}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-[color:var(--surface)] hover:text-foreground"
          >
            <X size={18} />
          </button>
        </header>

        <form
          action={(formData) => {
            start(() => action(formData));
          }}
          className="flex flex-col gap-4 px-5 py-5"
        >
          <input type="hidden" name="categoryId" value={categoryId} />
          <Input
            name="monthlyLimit"
            type="number"
            label={t('monthlyLimit', { currency })}
            defaultValue={monthlyLimit > 0 ? String(monthlyLimit) : ''}
            placeholder="0"
            inputMode="numeric"
            step="any"
            min={0}
            hint={t('limitHint')}
            autoFocus
          />

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {t('alerts')}
            </legend>
            <Toggle name="alertAt70" label={t('alert70')} defaultChecked={alertAt70} />
            <Toggle name="alertAt90" label={t('alert90')} defaultChecked={alertAt90} />
            <Toggle name="blockAt100" label={t('block100')} defaultChecked={blockAt100} />
          </fieldset>

          {globalError(state) ? (
            <p className="rounded-[10px] border border-[color:var(--terracotta)] bg-[color:var(--terracotta)]/10 px-4 py-3 text-sm text-[color:var(--terracotta)]">
              {globalError(state)}
            </p>
          ) : null}
          {state?.ok ? (
            <p className="text-xs text-[color:var(--forest)]">{state.message}</p>
          ) : null}

          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button type="submit" size="md" disabled={pending} className="flex-1">
              {pending ? t('saving') : t('save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Toggle({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  const [checked, setChecked] = React.useState(defaultChecked);
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
      <span className="text-foreground">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => setChecked((c) => !c)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border transition-colors ${
          checked
            ? 'border-[color:var(--forest)] bg-[color:var(--forest)]'
            : 'border-border bg-[color:var(--surface)]'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-[color:var(--paper)] transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      {/* Valeur form serialisée via le checked state */}
      {checked ? <input type="hidden" name={name} value="on" /> : null}
    </label>
  );
}
