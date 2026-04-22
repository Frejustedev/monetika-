import Link from 'next/link';
import { Wordmark } from '@/components/layout/Wordmark';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-[100dvh] bg-background text-foreground">
      <div className="mx-auto flex min-h-[100dvh] max-w-xl flex-col px-6 py-10 md:px-10 md:py-16">
        <header>
          <Link href="/" aria-label="Retour à l’accueil Monétika">
            <Wordmark variant="full" tone="forest" className="h-9 w-auto" />
          </Link>
        </header>
        <div className="my-auto">{children}</div>
      </div>
    </main>
  );
}
