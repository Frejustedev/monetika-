'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { StrategySlider } from '@/components/onboarding/StrategySlider';
import { saveStrategyAction, type ActionResult } from '@/server/actions/onboarding';
import type { BucketKey } from '@/lib/strategy/buckets';

type Props = {
  locale: 'fr' | 'en';
  initial?: {
    necessities: number;
    emergency: number;
    education: number;
    investment: number;
    joy: number;
    give: number;
  };
};

const initialState: ActionResult | undefined = undefined;

export function StrategyStep({ locale, initial }: Props) {
  const t = useTranslations('onboarding.steps.V');
  const [state, action, pending] = useActionState(saveStrategyAction, initialState);

  const mapInitial: Partial<Record<BucketKey, number>> | undefined = initial
    ? {
        NECESSITIES: initial.necessities,
        EMERGENCY: initial.emergency,
        EDUCATION: initial.education,
        INVESTMENT: initial.investment,
        JOY: initial.joy,
        GIVE: initial.give,
      }
    : undefined;

  return (
    <form action={action} className="flex flex-col gap-8">
      <StrategySlider locale={locale} initial={mapInitial} />
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
