'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { StrategySlider } from '@/components/onboarding/StrategySlider';
import { Button } from '@/components/ui/button';
import { updateStrategyAction, type ActionResult } from '@/server/actions/settings';
import { globalError } from '@/lib/utils';
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

const initial: ActionResult | undefined = undefined;

export function StrategyForm({ locale, initial: init }: Props) {
  const t = useTranslations('settings.strategy');
  const [state, action, pending] = useActionState(updateStrategyAction, initial);

  const mapInit: Partial<Record<BucketKey, number>> | undefined = init
    ? {
        NECESSITIES: init.necessities,
        EMERGENCY: init.emergency,
        EDUCATION: init.education,
        INVESTMENT: init.investment,
        JOY: init.joy,
        GIVE: init.give,
      }
    : undefined;

  return (
    <form action={action} className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{t('body')}</p>
      <StrategySlider locale={locale} initial={mapInit} />

      {state?.ok ? <p className="text-xs text-[color:var(--forest)]">{state.message}</p> : null}
      {globalError(state) ? <p className="text-xs text-[color:var(--terracotta)]">{globalError(state)}</p> : null}

      <Button type="submit" size="md" disabled={pending} className="self-start">
        {pending ? t('saving') : t('save')}
      </Button>
    </form>
  );
}
