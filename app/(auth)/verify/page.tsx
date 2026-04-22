import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { verifyMagicLinkAction } from '@/server/actions/auth';

type Props = {
  searchParams: Promise<{ token?: string; email?: string }>;
};

export default async function VerifyPage({ searchParams }: Props) {
  const t = await getTranslations('auth.verify');
  const { token, email } = await searchParams;

  // Page d'attente (pas de paramètres) : l'utilisateur vient du signup ou du login.
  if (!token || !email) {
    return (
      <section>
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          {t('overline')}
        </p>
        <h1
          className="mt-4 font-display font-medium leading-[1.05] tracking-[-0.02em]"
          style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}
        >
          {t('waitTitle')}
        </h1>
        <p className="mt-4 max-w-md text-base leading-[1.65] text-muted-foreground">{t('waitBody')}</p>
      </section>
    );
  }

  const result = await verifyMagicLinkAction({ token, email });
  if (result.ok) {
    redirect(result.redirectTo);
  }

  const reason = result.error;
  return (
    <section>
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
        {t('overline')}
      </p>
      <h1
        className="mt-4 font-display font-medium leading-[1.05] tracking-[-0.02em]"
        style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}
      >
        {reason === 'expired' ? t('expiredTitle') : t('invalidTitle')}
      </h1>
      <p className="mt-4 max-w-md text-base leading-[1.65] text-muted-foreground">
        {reason === 'expired' ? t('expiredBody') : t('invalidBody')}
      </p>
      <div className="rule-ochre mt-6" />
      <a
        href="/login"
        className="mt-8 inline-flex items-center gap-3 rounded-[10px] border border-border px-5 py-3 text-foreground transition-colors hover:bg-[color:var(--surface)]"
      >
        <span className="font-display italic" aria-hidden>
          ←
        </span>
        {t('retry')}
      </a>
    </section>
  );
}
