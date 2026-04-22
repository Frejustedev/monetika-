'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { PinPad } from '@/components/ui/pin-pad';
import { Button } from '@/components/ui/button';
import { changePinAction, type ActionResult } from '@/server/actions/settings';
import { fieldError, globalError } from '@/lib/utils';

const initial: ActionResult | undefined = undefined;

export function PinChangeForm() {
  const t = useTranslations('settings.security');
  const [state, action, pending] = useActionState(changePinAction, initial);
  const [open, setOpen] = React.useState(false);
  const [current, setCurrent] = React.useState('');
  const [next, setNext] = React.useState('');
  const [confirm, setConfirm] = React.useState('');

  React.useEffect(() => {
    if (state?.ok) {
      setOpen(false);
      setCurrent('');
      setNext('');
      setConfirm('');
    }
  }, [state]);

  if (!open) {
    return (
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{t('pinBody')}</p>
        <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(true)}>
          {t('changePin')}
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="mt-4 flex flex-col gap-6 rounded-[10px] border border-border p-5">
      <PinPad id="currentPin" name="currentPin" value={current} onChange={setCurrent} label={t('currentPin')} autoFocus error={fieldError(state, 'currentPin')} />
      <PinPad id="newPin" name="newPin" value={next} onChange={setNext} label={t('newPin')} error={fieldError(state, 'newPin')} />
      <PinPad id="confirmPin" name="confirmPin" value={confirm} onChange={setConfirm} label={t('confirmPin')} error={fieldError(state, 'confirmPin')} />

      {globalError(state) ? <p className="text-xs text-[color:var(--terracotta)]">{globalError(state)}</p> : null}

      <div className="flex gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(false)}>
          {t('cancel')}
        </Button>
        <Button type="submit" size="sm" disabled={pending || current.length !== 6 || next.length !== 6 || confirm.length !== 6} className="flex-1">
          {pending ? t('saving') : t('save')}
        </Button>
      </div>
    </form>
  );
}
