'use client';

import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { PinPad } from '@/components/ui/pin-pad';
import { savePinAction, type ActionResult } from '@/server/actions/onboarding';
import { fieldError, globalError } from '@/lib/utils';

type Props = {
  hasPin: boolean;
};

const initial: ActionResult | undefined = undefined;

export function PinStep({ hasPin }: Props) {
  const t = useTranslations('onboarding.steps.IV');
  const [stage, setStage] = useState<'first' | 'confirm'>('first');
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [state, action, pending] = useActionState(savePinAction, initial);

  const canProceedFirst = pin.length === 6;
  const canSubmit = pin.length === 6 && confirm.length === 6;

  if (hasPin && !state) {
    return (
      <div>
        <p className="mb-6 text-sm text-muted-foreground">{t('alreadySet')}</p>
        <Button size="lg" onClick={() => setStage('first')}>
          {t('reset')}
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-8">
      {stage === 'first' ? (
        <>
          <PinPad
            id="pin"
            name="pin"
            value={pin}
            onChange={setPin}
            label={t('enterPin')}
            autoFocus
            error={fieldError(state, 'pin')}
          />
          <Button
            type="button"
            size="lg"
            disabled={!canProceedFirst}
            onClick={() => setStage('confirm')}
          >
            {t('next')}
          </Button>
        </>
      ) : (
        <>
          <PinPad
            id="pinConfirm"
            name="pinConfirm"
            value={confirm}
            onChange={setConfirm}
            label={t('confirmPin')}
            autoFocus
            error={fieldError(state, 'pinConfirm')}
          />
          {/* Le PIN initial est réinjecté pour que l'action serveur puisse valider l'égalité. */}
          <input type="hidden" name="pin" value={pin} />
          {globalError(state) ? (
            <p className="rounded-[10px] border border-[color:var(--terracotta)] bg-[color:var(--terracotta)]/10 px-4 py-3 text-sm text-[color:var(--terracotta)]">
              {globalError(state)}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => {
                setConfirm('');
                setStage('first');
              }}
            >
              {t('back')}
            </Button>
            <Button type="submit" size="lg" disabled={pending || !canSubmit} className="flex-1">
              {pending ? t('submitting') : t('submit')}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
