'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { completeOnboardingAction } from '@/server/actions/onboarding';

type Props = { firstName: string | null };

export function WelcomeStep({ firstName }: Props) {
  const t = useTranslations('onboarding.steps.VII');
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col gap-6">
      <p className="text-base leading-[1.65] text-foreground">
        {firstName ? t('helloName', { name: firstName }) : t('hello')}
      </p>
      <p className="text-base leading-[1.65] text-muted-foreground">{t('body')}</p>

      <Button
        size="lg"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await completeOnboardingAction();
          })
        }
      >
        {pending ? t('finishing') : t('enter')}
      </Button>
    </div>
  );
}
