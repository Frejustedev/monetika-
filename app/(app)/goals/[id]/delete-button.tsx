'use client';

import * as React from 'react';
import { useActionState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { deleteGoalAction, type ActionResult } from '@/server/actions/goals';

type Props = { id: string };

const initial: ActionResult | undefined = undefined;

export function DeleteGoalButton({ id }: Props) {
  const t = useTranslations('goals.detail');
  const [confirming, setConfirming] = React.useState(false);
  const [, action] = useActionState(deleteGoalAction, initial);
  const [pending, start] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm text-muted-foreground hover:text-[color:var(--terracotta)]"
      >
        {t('delete')}
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        start(() => action(formData));
      }}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="id" value={id} />
      <span className="text-xs text-muted-foreground">{t('confirmDelete')}</span>
      <Button type="button" size="sm" variant="secondary" onClick={() => setConfirming(false)}>
        {t('cancel')}
      </Button>
      <Button type="submit" size="sm" variant="danger" disabled={pending}>
        {pending ? t('deleting') : t('deleteConfirm')}
      </Button>
    </form>
  );
}
