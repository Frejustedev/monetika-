import Link from 'next/link';
import { Wordmark } from '@/components/layout/Wordmark';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-[100dvh] bg-background text-foreground">
      <div className="mx-auto flex min-h-[100dvh] max-w-2xl flex-col px-6 py-10 md:px-10 md:py-16">
        <header>
          <Link href="/" aria-label="Retour à l\u2019accueil">
            <Wordmark variant="full" tone="forest" className="h-8 w-auto" />
          </Link>
        </header>
        <article className="prose mt-12 flex-1">{children}</article>
        <footer className="mt-12 border-t border-border pt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            © 2026 Monétika · Tous droits réservés
          </p>
        </footer>
      </div>
    </main>
  );
}
