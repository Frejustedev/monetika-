import { Wordmark } from '@/components/layout/Wordmark';

export const dynamic = 'force-static';

export default function OfflinePage() {
  return (
    <main className="min-h-[100dvh] bg-background text-foreground">
      <div className="mx-auto flex min-h-[100dvh] max-w-xl flex-col px-6 py-10 md:px-10 md:py-16">
        <header>
          <Wordmark variant="mark" tone="forest" className="h-10 w-10" />
        </header>

        <section className="my-auto">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            Hors-ligne
          </p>
          <h1
            className="mt-4 font-display font-medium leading-[1.05] tracking-[-0.02em]"
            style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}
          >
            Connexion perdue.
          </h1>
          <p className="mt-6 max-w-md text-base leading-[1.7] text-muted-foreground">
            Votre journal continue d&rsquo;exister localement. Les pages déjà consultées restent
            accessibles. La saisie hors-ligne avec synchronisation arrive dans une prochaine livraison.
          </p>
          <div className="rule-ochre mt-8" />
        </section>
      </div>
    </main>
  );
}
