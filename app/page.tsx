import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Wordmark } from '@/components/layout/Wordmark';
import { auth, signOut } from '@/auth';

export default async function HomePage() {
  const session = await auth();
  if (session?.user?.onboardedAt) {
    return <DashboardStub name={session.user.name ?? null} />;
  }
  const t = await getTranslations('home');

  return (
    <main className="min-h-[100dvh] bg-background text-foreground">
      <div className="mx-auto flex min-h-[100dvh] max-w-3xl flex-col px-6 py-10 md:px-10 md:py-16">
        {/* En-tête */}
        <header className="flex items-center justify-between">
          <Wordmark variant="full" tone="forest" className="h-9 w-auto" />
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Avril 2026
          </span>
        </header>

        {/* Avant-propos */}
        <section className="mt-24 md:mt-32">
          <p
            className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground"
            aria-hidden="true"
          >
            {t('overline')}
          </p>
          <h2
            className="mt-4 font-display font-medium leading-[1.05] tracking-[-0.02em]"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4.25rem)' }}
          >
            {t('title')}
          </h2>
          <p
            className="mt-6 max-w-2xl text-base leading-[1.7] text-muted-foreground md:text-lg"
            style={{ color: 'var(--foreground)', opacity: 0.78 }}
          >
            {t('lede')}
          </p>

          <ul className="mt-10 space-y-5 border-t border-border pt-8">
            {(['one', 'two', 'three'] as const).map((k, i) => (
              <li key={k} className="flex gap-5">
                <span className="font-display italic text-[color:var(--ochre)]">
                  {toRoman(i + 1)}
                </span>
                <span className="text-base leading-[1.6]">{t(`bullets.${k}`)}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <section className="mt-auto flex flex-col gap-3 pt-16 sm:flex-row sm:items-center">
          <Link
            href="/signup"
            className="group inline-flex items-center justify-center rounded-[10px] bg-[color:var(--primary)] px-6 py-3.5 text-[color:var(--primary-foreground)] transition-colors duration-[var(--dur-fast)] ease-[var(--ease-monetika)] hover:bg-[color:var(--primary-hover)] focus-visible:outline-none"
          >
            <span className="font-medium">{t('cta')}</span>
            <span
              className="ml-3 font-display italic transition-transform duration-[var(--dur-fast)] group-hover:translate-x-0.5"
              aria-hidden="true"
            >
              →
            </span>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-[10px] border border-border px-6 py-3.5 text-foreground transition-colors hover:bg-[color:var(--surface)]"
          >
            {t('ctaSecondary')}
          </Link>
        </section>

        {/* Pied éditorial */}
        <footer className="mt-16 border-t border-border pt-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {t('footer')}
          </p>
        </footer>
      </div>
    </main>
  );
}

function toRoman(n: number): string {
  const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  return numerals[n - 1] ?? String(n);
}

// Stub dashboard — Phase 2 le remplacera par le vrai dashboard éditorial.
function DashboardStub({ name }: { name: string | null }) {
  return (
    <main className="min-h-[100dvh] bg-background text-foreground">
      <div className="mx-auto flex min-h-[100dvh] max-w-3xl flex-col px-6 py-10 md:px-10 md:py-14">
        <header className="flex items-center justify-between">
          <Wordmark variant="full" tone="forest" className="h-8 w-auto" />
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/' });
            }}
          >
            <button
              type="submit"
              className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
            >
              Se déconnecter
            </button>
          </form>
        </header>

        <section className="mt-16 md:mt-20">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            Aujourd&rsquo;hui
          </p>
          <h1
            className="mt-3 font-display font-medium leading-[1.05] tracking-[-0.02em]"
            style={{ fontSize: 'clamp(2.25rem, 5vw, 3rem)' }}
          >
            {name ? `Bonjour, ${name}.` : 'Bonjour.'}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-[1.7] text-muted-foreground">
            Votre journal est actif. Le tableau de bord éditorial arrive en Phase 2 —
            barre stratégique, liste des comptes, mouvements récents et insight du jour.
          </p>
          <div className="rule-ochre mt-6" />
        </section>

        <footer className="mt-auto border-t border-border pt-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Phase 1 · Auth &amp; onboarding · Avril 2026
          </p>
        </footer>
      </div>
    </main>
  );
}
