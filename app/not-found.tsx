import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Wordmark } from '@/components/layout/Wordmark';

export default async function NotFound() {
  const t = await getTranslations('errors.notFound');

  return (
    <main className="min-h-[100dvh] bg-background text-foreground">
      <div className="mx-auto flex min-h-[100dvh] max-w-2xl flex-col px-6 py-10 md:px-10 md:py-16">
        <header>
          <Wordmark variant="mark" tone="forest" className="h-10 w-10" />
        </header>

        <section className="my-auto">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            {t('overline')} · 404
          </p>
          <h1
            className="mt-4 font-display font-medium leading-[1.05] tracking-[-0.02em]"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}
          >
            {t('title')}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-[1.7] text-muted-foreground">
            {t('body')}
          </p>

          <div className="mt-10 rule-ochre" />

          <Link
            href="/"
            className="mt-8 inline-flex items-center rounded-[10px] border border-border px-5 py-3 text-foreground transition-colors hover:bg-[color:var(--surface)]"
          >
            <span className="font-display italic" aria-hidden="true">
              ←
            </span>
            <span className="ml-3">{t('cta')}</span>
          </Link>
        </section>
      </div>
    </main>
  );
}
