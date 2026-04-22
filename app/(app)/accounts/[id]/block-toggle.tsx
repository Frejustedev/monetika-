'use client';

import { useActionState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toggleBlockAccountAction, type ActionResult } from '@/server/actions/accounts';
import { cn } from '@/lib/utils';

type Props = { id: string; isBlocked: boolean };

const initial: ActionResult | undefined = undefined;

export function BlockToggle({ id, isBlocked }: Props) {
  const t = useTranslations('accounts.detail.block');
  const [, action] = useActionState(toggleBlockAccountAction, initial);
  const [pending, start] = useTransition();

  return (
    <form
      action={action}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(() => action(fd));
      }}
      className="rounded-[10px] border border-border p-4"
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="blocked" value={isBlocked ? 'off' : 'on'} />
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {t('overline')}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{t('body')}</p>
      <button
        type="submit"
        disabled={pending}
        className={cn(
          'mt-4 inline-flex items-center gap-3 rounded-[10px] border px-4 py-2 text-sm transition-colors',
          isBlocked
            ? 'border-[color:var(--terracotta)] bg-[color:var(--terracotta)]/10 text-[color:var(--terracotta)]'
            : 'border-border text-foreground hover:bg-[color:var(--surface)]',
        )}
      >
        <span
          className={cn(
            'h-2.5 w-2.5 rounded-full',
            isBlocked ? 'bg-[color:var(--terracotta)]' : 'bg-[color:var(--moss)]',
          )}
          aria-hidden
        />
        {isBlocked ? t('unblock') : t('block')}
      </button>
    </form>
  );
}
