'use client';

import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { CountryPicker } from '@/components/onboarding/CountryPicker';
import { saveCountryAction, type ActionResult } from '@/server/actions/onboarding';

type Props = {
  user: {
    countryCode: string | null;
    locale: string | null;
  };
};

const initial: ActionResult | undefined = undefined;

export function CountryStep({ user }: Props) {
  const t = useTranslations('onboarding.steps.II');
  const [state, action, pending] = useActionState(saveCountryAction, initial);
  const [selected, setSelected] = useState<string>(user.countryCode ?? '');

  return (
    <form action={action} className="flex flex-col gap-8">
      <CountryPicker
        name="countryCode"
        value={selected}
        onChange={setSelected}
        locale={(user.locale as 'fr' | 'en') ?? 'fr'}
      />
      {state?.ok === false ? (
        <p className="rounded-[10px] border border-[color:var(--terracotta)] bg-[color:var(--terracotta)]/10 px-4 py-3 text-sm text-[color:var(--terracotta)]">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={pending || !selected}>
        {pending ? t('submitting') : t('continue')}
      </Button>
    </form>
  );
}
