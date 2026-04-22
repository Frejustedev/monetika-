'use client';

import { useTranslations } from 'next-intl';
import { Wordmark } from '@/components/layout/Wordmark';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors.generic');

  return (
    <main className="min-h-[100dvh] bg-background text-foreground">
      <div className="mx-auto flex min-h-[100dvh] max-w-2xl flex-col px-6 py-10 md:px-10 md:py-16">
        <header>
          <Wordmark variant="mark" tone="forest" className="h-10 w-10" />
        </header>

        <section className="my-auto">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            {t('overline')}
          </p>
          <h1
            className="mt-4 font-display font-medium leading-[1.05] tracking-[-0.02em]"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}
          >
            {t('title')}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-[1.7] text-muted-foreground">{t('body')}</p>

          {error.digest ? (
            <p className="mt-4 font-mono text-xs text-muted-foreground">
              Ref {error.digest}
            </p>
          ) : null}

          <div className="mt-10 rule-ochre" />

          <button
            type="button"
            onClick={reset}
            className="mt-8 inline-flex items-center rounded-[10px] border border-border px-5 py-3 text-foreground transition-colors hover:bg-[color:var(--surface)]"
          >
            <span>{t('cta')}</span>
          </button>
        </section>
      </div>
    </main>
  );
}
