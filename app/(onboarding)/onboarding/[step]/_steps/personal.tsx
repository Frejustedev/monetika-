'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { savePersonalAction, type ActionResult } from '@/server/actions/onboarding';
import { fieldError, globalError } from '@/lib/utils';

type Props = {
  user: {
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    dateOfBirth: Date | null;
  };
};

const initial: ActionResult | undefined = undefined;

export function PersonalStep({ user }: Props) {
  const t = useTranslations('onboarding.steps.I');
  const [state, action, pending] = useActionState(savePersonalAction, initial);

  return (
    <form action={action} className="flex flex-col gap-5">
      <Input
        name="firstName"
        label={t('fields.firstName')}
        defaultValue={user.firstName ?? ''}
        required
        autoComplete="given-name"
        error={fieldError(state, 'firstName')}
      />
      <Input
        name="lastName"
        label={t('fields.lastName')}
        defaultValue={user.lastName ?? ''}
        required
        autoComplete="family-name"
        error={fieldError(state, 'lastName')}
      />
      <Input
        name="phone"
        type="tel"
        label={t('fields.phone')}
        defaultValue={user.phone ?? ''}
        autoComplete="tel"
        inputMode="tel"
      />
      <Input
        name="dateOfBirth"
        type="date"
        label={t('fields.dateOfBirth')}
        defaultValue={
          user.dateOfBirth ? user.dateOfBirth.toISOString().slice(0, 10) : ''
        }
      />

      {globalError(state) ? (
        <p className="rounded-[10px] border border-[color:var(--terracotta)] bg-[color:var(--terracotta)]/10 px-4 py-3 text-sm text-[color:var(--terracotta)]">
          {globalError(state)}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending} className="mt-2">
        {pending ? t('submitting') : t('continue')}
      </Button>
    </form>
  );
}
