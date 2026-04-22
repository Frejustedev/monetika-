'use client';

import { useActionState, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { COUNTRIES } from '@/lib/countries';
import { BUCKETS, BUCKET_LABELS_FR, BUCKET_LABELS_EN } from '@/lib/strategy/buckets';
import { saveFirstAccountAction, type ActionResult } from '@/server/actions/onboarding';
import { AccountKind } from '@prisma/client';
import { cn } from '@/lib/utils';

type Props = {
  countryCode: string;
  hasAccount: boolean;
};

const KINDS: AccountKind[] = [
  AccountKind.BANK_CHECKING,
  AccountKind.BANK_SAVINGS,
  AccountKind.MOBILE_MONEY,
  AccountKind.SECURITIES,
  AccountKind.CASH,
  AccountKind.OTHER,
];

const initial: ActionResult | undefined = undefined;

export function FirstAccountStep({ countryCode, hasAccount }: Props) {
  const t = useTranslations('onboarding.steps.VI');
  const [state, action, pending] = useActionState(saveFirstAccountAction, initial);
  const [kind, setKind] = useState<AccountKind>(AccountKind.BANK_CHECKING);
  const [bucket, setBucket] = useState<(typeof BUCKETS)[number]>('NECESSITIES');

  const country = useMemo(() => COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0]!, [countryCode]);
  const institutions = useMemo(() => {
    if (kind === AccountKind.MOBILE_MONEY) return country.institutions.momo;
    if (kind === AccountKind.SECURITIES) return country.institutions.sgi;
    if (kind === AccountKind.CASH || kind === AccountKind.OTHER) return [];
    return country.institutions.banks;
  }, [kind, country]);

  const locale = country.defaultLocale;
  const bucketLabels = locale === 'fr' ? BUCKET_LABELS_FR : BUCKET_LABELS_EN;

  if (hasAccount && !state) {
    return (
      <div className="rounded-[10px] border border-border bg-[color:var(--surface)] px-5 py-4 text-sm text-muted-foreground">
        {t('alreadyCreated')}
        <div className="mt-4">
          <Link href="/onboarding/VII" className="text-[color:var(--forest)] underline">
            {t('next')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      {/* Type de compte */}
      <fieldset>
        <legend className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {t('fields.kind')}
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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

      {/* Institution */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="institution" className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {t('fields.institution')}
        </label>
        <input
          id="institution"
          name="institution"
          list="institutions"
          required
          defaultValue=""
          placeholder={institutions[0] ?? ''}
          className="h-11 rounded-[10px] border border-border bg-background px-4 text-base text-foreground"
        />
        <datalist id="institutions">
          {institutions.map((inst) => (
            <option key={inst} value={inst} />
          ))}
        </datalist>
      </div>

      <Input
        name="label"
        label={t('fields.label')}
        placeholder={t('fields.labelPlaceholder')}
        required
      />

      <Input
        name="currentBalance"
        type="number"
        label={t('fields.balance')}
        hint={`${country.currency}`}
        inputMode="numeric"
        min={0}
        step="any"
        required
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

      {state?.ok === false ? (
        <p className="rounded-[10px] border border-[color:var(--terracotta)] bg-[color:var(--terracotta)]/10 px-4 py-3 text-sm text-[color:var(--terracotta)]">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? t('submitting') : t('continue')}
      </Button>
    </form>
  );
}
