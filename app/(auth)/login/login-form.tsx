'use client';

import { useActionState, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PinPad } from '@/components/ui/pin-pad';
import {
  requestMagicLinkAction,
  loginWithPinAction,
  type ActionResult,
} from '@/server/actions/auth';
import { cn, fieldError, globalError } from '@/lib/utils';

type Mode = 'magic' | 'pin';

const initial: ActionResult | undefined = undefined;

export function LoginForm() {
  const t = useTranslations('auth.login');
  const [mode, setMode] = useState<Mode>('magic');

  return (
    <div className="mt-10">
      <div className="flex gap-2" role="tablist" aria-label={t('modeLabel')}>
        {(['magic', 'pin'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              'rounded-[8px] border px-4 py-2 text-sm transition-colors',
              mode === m
                ? 'border-[color:var(--forest)] bg-[color:var(--surface)] text-foreground'
                : 'border-border text-muted-foreground hover:bg-[color:var(--surface)]',
            )}
          >
            {m === 'magic' ? t('modes.magic') : t('modes.pin')}
          </button>
        ))}
      </div>

      <div className="mt-8">{mode === 'magic' ? <MagicForm /> : <PinForm />}</div>
    </div>
  );
}

function MagicForm() {
  const t = useTranslations('auth.login');
  const [state, action, pending] = useActionState(requestMagicLinkAction, initial);

  if (state?.ok) {
    return (
      <div className="border-t border-border pt-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          {t('sent.overline')}
        </p>
        <h2 className="mt-3 font-display text-xl text-foreground">{t('sent.title')}</h2>
        <p className="mt-3 text-base leading-[1.65] text-muted-foreground">
          {state.message ?? t('sent.body')}
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <Input
        name="email"
        type="email"
        label={t('fields.email')}
        required
        autoComplete="email"
        inputMode="email"
        error={fieldError(state, 'email')}
      />
      {globalError(state) ? (
        <p className="rounded-[10px] border border-[color:var(--terracotta)] bg-[color:var(--terracotta)]/10 px-4 py-3 text-sm text-[color:var(--terracotta)]">
          {globalError(state)}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? t('sending') : t('requestMagic')}
      </Button>
    </form>
  );
}

function PinForm() {
  const t = useTranslations('auth.login');
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [state, action, pending] = useActionState(loginWithPinAction, initial);

  // Rediriger en useEffect pour éviter "Cannot update component while rendering".
  useEffect(() => {
    if (state?.ok) {
      router.refresh();
      router.replace('/');
    }
  }, [state, router]);

  return (
    <form action={action} className="flex flex-col gap-8">
      <Input
        name="email"
        type="email"
        label={t('fields.email')}
        required
        autoComplete="email"
        inputMode="email"
        error={fieldError(state, 'email')}
      />
      <PinPad
        id="login-pin"
        name="pin"
        value={pin}
        onChange={setPin}
        label={t('fields.pin')}
        error={fieldError(state, 'pin') ?? globalError(state)}
        autoFocus
      />
      <Button type="submit" size="lg" disabled={pending || pin.length !== 6}>
        {pending ? t('sending') : t('submitPin')}
      </Button>
    </form>
  );
}
