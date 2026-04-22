'use client';

import { useActionState, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BUCKETS, BUCKET_LABELS_FR, BUCKET_LABELS_EN } from '@/lib/strategy/buckets';
import { AccountKind } from '@prisma/client';
import { createAccountAction, type ActionResult } from '@/server/actions/accounts';
import { cn, fieldError, globalError } from '@/lib/utils';

type Props = {
  countryCode: string;
  institutions: { banks: string[]; momo: string[]; sgi: string[] };
  defaultCurrency: string;
  locale: 'fr' | 'en';
};

const KINDS: AccountKind[] = [
  AccountKind.BANK_CHECKING,
  AccountKind.BANK_SAVINGS,
  AccountKind.BANK_TERM,
  AccountKind.BANK_PRO,
  AccountKind.MOBILE_MONEY,
  AccountKind.SECURITIES,
  AccountKind.CASH,
  AccountKind.OTHER,
];

const COLORS = ['#1F4D3F', '#C89A3C', '#B8552D', '#5B7A5E', '#4A6B8A', '#8B4A2B'];

const initial: ActionResult | undefined = undefined;

export function CreateAccountForm({ countryCode: _country, institutions, defaultCurrency, locale }: Props) {
  const t = useTranslations('accounts.create');
  const [state, action, pending] = useActionState(createAccountAction, initial);
  const [kind, setKind] = useState<AccountKind>(AccountKind.BANK_CHECKING);
  const [bucket, setBucket] = useState<(typeof BUCKETS)[number]>('NECESSITIES');
  const [color, setColor] = useState<string>('#1F4D3F');

  const instList = useMemo(() => {
    if (kind === AccountKind.MOBILE_MONEY) return institutions.momo;
    if (kind === AccountKind.SECURITIES) return institutions.sgi;
    if (kind === AccountKind.CASH || kind === AccountKind.OTHER) return [];
    return institutions.banks;
  }, [kind, institutions]);

  const bucketLabels = locale === 'fr' ? BUCKET_LABELS_FR : BUCKET_LABELS_EN;

  return (
    <form action={action} className="flex flex-col gap-6">
      {/* Type */}
      <fieldset>
        <legend className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {t('fields.kind')}
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              aria-pressed={kind === k}
              className={cn(
                'rounded-[10px] border px-3 py-2 text-sm transition-colors',
                kind === k
                  ? 'border-[color:var(--forest)] bg-[color:var(--surface)] text-foreground'
                  : 'border-border text-muted-foreground hover:bg-[color:var(--surface)]',
              )}
            >
              {t(`kinds.${k}`)}
            </button>
          ))}
        </div>
        <input type="hidden" name="kind" value={kind} />
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="institution" className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {t('fields.institution')}
        </label>
        <input
          id="institution"
          name="institution"
          list="inst-options"
          required
          placeholder={instList[0] ?? t('fields.institutionPlaceholder')}
          className="h-11 rounded-[10px] border border-border bg-background px-4 text-base text-foreground placeholder:text-muted-foreground/60"
        />
        <datalist id="inst-options">
          {instList.map((inst) => (
            <option key={inst} value={inst} />
          ))}
        </datalist>
      </div>

      <Input
        name="label"
        label={t('fields.label')}
        placeholder={t('fields.labelPlaceholder')}
        required
        error={fieldError(state, 'label')}
      />

      <Input
        name="currency"
        label={t('fields.currency')}
        defaultValue={defaultCurrency}
        required
        hint={t('fields.currencyHint')}
        maxLength={4}
      />

      <Input
        name="currentBalance"
        type="number"
        label={t('fields.balance')}
        inputMode="decimal"
        step="any"
        required
        error={fieldError(state, 'currentBalance')}
      />

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
              {bucketLabels[b].long}
            </button>
          ))}
        </div>
        <input type="hidden" name="strategyBucket" value={bucket} />
      </fieldset>

      {/* Color */}
      <fieldset>
        <legend className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {t('fields.color')}
        </legend>
        <div className="flex gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-pressed={color === c}
              aria-label={c}
              style={{ background: c }}
              className={cn(
                'h-8 w-8 rounded-full border-2 transition-transform',
                color === c ? 'border-foreground scale-110' : 'border-border',
              )}
            />
          ))}
        </div>
        <input type="hidden" name="color" value={color} />
      </fieldset>

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
