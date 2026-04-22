'use client';

import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { acknowledgePrivacyAction } from '@/server/actions/onboarding';

const POINTS_KEYS = ['one', 'two', 'three'] as const;

export function PrivacyStep() {
  const t = useTranslations('onboarding.steps.III');
  const [pending, start] = useTransition();

  const handleContinue = () => {
    start(async () => {
      await acknowledgePrivacyAction();
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <ul className="flex flex-col gap-5 border-t border-border pt-6">
        {POINTS_KEYS.map((k, i) => (
          <li key={k} className="flex gap-4">
            <span className="font-display italic text-[color:var(--ochre)]">{toRoman(i + 1)}</span>
            <span className="text-base leading-[1.6]">{t(`points.${k}`)}</span>
          </li>
        ))}
      </ul>
      <Button onClick={handleContinue} disabled={pending} size="lg">
        {pending ? t('submitting') : t('continue')}
      </Button>
    </div>
  );
}

function toRoman(n: number): string {
  const numerals = ['I', 'II', 'III'];
  return numerals[n - 1] ?? String(n);
}
