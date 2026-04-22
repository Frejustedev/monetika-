'use client';

import * as React from 'react';
import { useActionState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  upsertIncomeSourceAction,
  deleteIncomeSourceAction,
  type ActionResult,
} from '@/server/actions/settings';
import { fieldError, globalError } from '@/lib/utils';

type Source = {
  id: string;
  label: string;
  kind: string;
  expectedAmount: number;
  currency: string;
  frequency: string;
  dayOfMonth: number | null;
  isActive: boolean;
};

const initial: ActionResult | undefined = undefined;

export function IncomeSourcesSection({ sources }: { sources: Source[] }) {
  const t = useTranslations('settings.income');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{t('body')}</p>

      {sources.length === 0 && !adding ? (
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      ) : null}

      <ul className="flex flex-col">
        {sources.map((s) => (
          <li key={s.id} className="border-b border-border py-3 last:border-b-0">
            {editingId === s.id ? (
              <IncomeForm
                source={s}
                onClose={() => setEditingId(null)}
              />
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{s.label}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    {t(`kinds.${s.kind}`)} · {s.expectedAmount.toLocaleString('fr-FR')} {s.currency} · {t(`frequencies.${s.frequency}`)}
                    {s.dayOfMonth ? ` · ${t('dayOfMonth', { day: s.dayOfMonth })}` : ''}
                    {!s.isActive ? ` · ${t('inactive')}` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingId(s.id)}
                    className="rounded-[8px] border border-border px-3 py-1 text-xs hover:bg-[color:var(--surface)]"
                  >
                    {t('edit')}
                  </button>
                  <DeleteButton id={s.id} />
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {adding ? (
        <IncomeForm onClose={() => setAdding(false)} />
      ) : (
        <Button type="button" size="sm" variant="secondary" className="self-start" onClick={() => setAdding(true)}>
          + {t('add')}
        </Button>
      )}
    </div>
  );
}

function IncomeForm({ source, onClose }: { source?: Source; onClose: () => void }) {
  const t = useTranslations('settings.income');
  const [state, action, pending] = useActionState(upsertIncomeSourceAction, initial);

  React.useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-[10px] border border-border p-4">
      {source ? <input type="hidden" name="id" value={source.id} /> : null}
      <Input name="label" label={t('label')} defaultValue={source?.label ?? ''} required error={fieldError(state, 'label')} />
      <div className="flex gap-2">
        <label className="flex flex-1 flex-col gap-1 text-xs">
          <span className="font-mono uppercase tracking-[0.14em] text-muted-foreground">{t('kind')}</span>
          <select
            name="kind"
            defaultValue={source?.kind ?? 'SALARY'}
            className="h-11 rounded-[10px] border border-border bg-background px-3 text-base text-foreground"
          >
            {['SALARY', 'RENT', 'DIVIDENDS', 'FREELANCE', 'REMITTANCE', 'OTHER'].map((k) => (
              <option key={k} value={k}>
                {t(`kinds.${k}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-1 flex-col gap-1 text-xs">
          <span className="font-mono uppercase tracking-[0.14em] text-muted-foreground">{t('frequency')}</span>
          <select
            name="frequency"
            defaultValue={source?.frequency ?? 'MONTHLY'}
            className="h-11 rounded-[10px] border border-border bg-background px-3 text-base text-foreground"
          >
            {['MONTHLY', 'QUARTERLY', 'ANNUAL', 'VARIABLE'].map((f) => (
              <option key={f} value={f}>
                {t(`frequencies.${f}`)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex gap-2">
        <Input
          name="expectedAmount"
          type="number"
          label={t('expectedAmount')}
          defaultValue={source?.expectedAmount?.toString() ?? ''}
          required
          inputMode="numeric"
          step="any"
          min={0}
        />
        <Input name="dayOfMonth" type="number" label={t('dayOfMonthLabel')} defaultValue={source?.dayOfMonth?.toString() ?? ''} min={1} max={28} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={source?.isActive ?? true} className="accent-[color:var(--forest)]" />
        {t('activeCheck')}
      </label>

      {globalError(state) ? <p className="text-xs text-[color:var(--terracotta)]">{globalError(state)}</p> : null}

      <div className="flex gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={onClose}>
          {t('cancel')}
        </Button>
        <Button type="submit" size="sm" disabled={pending} className="flex-1">
          {pending ? t('saving') : t('save')}
        </Button>
      </div>
    </form>
  );
}

function DeleteButton({ id }: { id: string }) {
  const t = useTranslations('settings.income');
  const [confirming, setConfirming] = React.useState(false);
  const [, action] = useActionState(deleteIncomeSourceAction, initial);
  const [pending, start] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-[8px] border border-border px-3 py-1 text-xs text-[color:var(--terracotta)] hover:bg-[color:var(--surface)]"
      >
        {t('delete')}
      </button>
    );
  }

  return (
    <form
      action={(fd) => {
        start(() => action(fd));
      }}
      className="flex items-center gap-1"
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-[8px] border border-border px-2 py-1 text-xs"
      >
        {t('cancel')}
      </button>
      <button
        type="submit"
        disabled={pending}
        className="rounded-[8px] border border-[color:var(--terracotta)] bg-[color:var(--terracotta)] px-3 py-1 text-xs text-[color:var(--paper)]"
      >
        {pending ? t('deleting') : t('confirmDelete')}
      </button>
    </form>
  );
}
