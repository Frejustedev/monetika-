'use client';

import * as React from 'react';
import { useActionState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { deleteAccountAction, type ActionResult } from '@/server/actions/settings';
import { fieldError, globalError } from '@/lib/utils';

const initial: ActionResult | undefined = undefined;

export function DangerZone({ email }: { email: string }) {
  const t = useTranslations('settings.danger');
  const [deleting, setDeleting] = React.useState(false);
  const [state, action, pending] = useActionState(deleteAccountAction, initial);
  const [, start] = useTransition();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-foreground">{t('exportTitle')}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t('exportBody')}</p>
        </div>
        <a
          href="/settings/export-all"
          download
          className="inline-flex shrink-0 items-center gap-2 rounded-[10px] border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-[color:var(--surface)]"
        >
          <span aria-hidden>↓</span> {t('exportButton')}
        </a>
      </div>

      <div className="rounded-[10px] border border-[color:var(--terracotta)]/50 p-4">
        <p className="text-sm font-medium text-[color:var(--terracotta)]">{t('deleteTitle')}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t('deleteBody', { email })}</p>

        {!deleting ? (
          <Button
            type="button"
            size="sm"
            variant="danger"
            className="mt-3"
            onClick={() => setDeleting(true)}
          >
            {t('deleteStart')}
          </Button>
        ) : (
          <form
            action={(fd) => {
              start(() => action(fd));
            }}
            className="mt-3 flex flex-col gap-3"
          >
            <Input
              name="confirmation"
              label={t('confirmationLabel')}
              hint={t('confirmationHint')}
              required
              error={fieldError(state, 'confirmation')}
            />
            {globalError(state) ? <p className="text-xs text-[color:var(--terracotta)]">{globalError(state)}</p> : null}
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => setDeleting(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit" size="sm" variant="danger" disabled={pending} className="flex-1">
                {pending ? t('deleting') : t('deleteConfirm')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
