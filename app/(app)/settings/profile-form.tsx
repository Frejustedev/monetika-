'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { updateProfileAction, type ActionResult } from '@/server/actions/settings';
import { fieldError, globalError } from '@/lib/utils';

type Props = {
  initial: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
  };
};

const initial: ActionResult | undefined = undefined;

export function ProfileForm({ initial: initialValues }: Props) {
  const t = useTranslations('settings.profile');
  const [state, action, pending] = useActionState(updateProfileAction, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input
        name="firstName"
        label={t('firstName')}
        defaultValue={initialValues.firstName}
        required
        error={fieldError(state, 'firstName')}
      />
      <Input
        name="lastName"
        label={t('lastName')}
        defaultValue={initialValues.lastName}
        required
        error={fieldError(state, 'lastName')}
      />
      <Input
        name="email"
        label={t('email')}
        defaultValue={initialValues.email}
        disabled
        hint={t('emailHint')}
      />
      <Input name="phone" type="tel" label={t('phone')} defaultValue={initialValues.phone} />
      <Input name="dateOfBirth" type="date" label={t('dateOfBirth')} defaultValue={initialValues.dateOfBirth} />

      {state?.ok ? <p className="text-xs text-[color:var(--forest)]">{state.message}</p> : null}
      {globalError(state) ? <p className="text-xs text-[color:var(--terracotta)]">{globalError(state)}</p> : null}

      <Button type="submit" size="md" disabled={pending} className="self-start">
        {pending ? t('saving') : t('save')}
      </Button>
    </form>
  );
}
