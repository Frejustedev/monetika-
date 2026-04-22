import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function VerifyPage({ searchParams }: Props) {
  const t = await getTranslations('auth.verify');
  const { error } = await searchParams;

  const isError = error === 'expired' || error === 'invalid';
  const title = isError
    ? error === 'expired'
      ? t('expiredTitle')
      : t('invalidTitle')
    : t('waitTitle');
  const body = isError
    ? error === 'expired'
      ? t('expiredBody')
      : t('invalidBody')
    : t('waitBody');

  return (
    <section>
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
        {t('overline')}
      </p>
      <h1
        className="mt-4 font-display font-medium leading-[1.05] tracking-[-0.02em]"
        style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}
      >
        {title}
      </h1>
      <p className="mt-4 max-w-md text-base leading-[1.65] text-muted-foreground">{body}</p>
      <div className="rule-ochre mt-6" />

      {isError ? (
        <Link
          href="/login"
          className="mt-8 inline-flex items-center gap-3 rounded-[10px] border border-border px-5 py-3 text-foreground transition-colors hover:bg-[color:var(--surface)]"
        >
          <span className="font-display italic" aria-hidden>
            ←
          </span>
          {t('retry')}
        </Link>
      ) : null}
    </section>
  );
}
