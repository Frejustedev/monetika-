'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { signupAction, type ActionResult } from '@/server/actions/auth';
import { fieldError, globalError } from '@/lib/utils';

const initial: ActionResult | undefined = undefined;

export function SignupForm() {
  const t = useTranslations('auth.signup');
  const [state, action, pending] = useActionState(signupAction, initial);

  if (state?.ok) {
    return (
      <div className="mt-10 border-t border-border pt-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          {t('sent.overline')}
        </p>
        <h2 className="mt-3 font-display text-xl text-foreground">{t('sent.title')}</h2>
        <p className="mt-3 text-base leading-[1.65] text-muted-foreground">{t('sent.body')}</p>
      </div>
    );
  }

  return (
    <form action={action} className="mt-10 flex flex-col gap-5">
      <Input
        name="firstName"
        label={t('fields.firstName')}
        required
        autoComplete="given-name"
        error={fieldError(state, 'firstName')}
      />
      <Input
        name="lastName"
        label={t('fields.lastName')}
        required
        autoComplete="family-name"
        error={fieldError(state, 'lastName')}
      />
      <Input
        name="email"
        type="email"
        label={t('fields.email')}
        required
        autoComplete="email"
        inputMode="email"
        error={fieldError(state, 'email')}
      />
      <Input
        name="phone"
        type="tel"
        label={t('fields.phone')}
        autoComplete="tel"
        inputMode="tel"
        hint={t('fields.phoneHint')}
      />

      {globalError(state) ? (
        <p className="rounded-[10px] border border-[color:var(--terracotta)] bg-[color:var(--terracotta)]/10 px-4 py-3 text-sm text-[color:var(--terracotta)]">
          {globalError(state)}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending} className="mt-2">
        {pending ? t('submitting') : t('submit')}
      </Button>
    </form>
  );
}
