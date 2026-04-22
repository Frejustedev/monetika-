'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Wordmark } from './Wordmark';
import { cn } from '@/lib/utils';

type Section = {
  key: 'home' | 'accounts' | 'transactions' | 'budget' | 'goals' | 'insights' | 'score' | 'settings';
  href: string;
};

const SECTIONS: Section[] = [
  { key: 'home', href: '/dashboard' },
  { key: 'accounts', href: '/accounts' },
  { key: 'transactions', href: '/transactions' },
  { key: 'budget', href: '/budget' },
  { key: 'goals', href: '/goals' },
  { key: 'insights', href: '/insights' },
  { key: 'score', href: '/score' },
  { key: 'settings', href: '/settings' },
];

export function Sidebar() {
  const t = useTranslations('nav');
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-background px-6 py-8 md:flex">
      <Link href="/dashboard" className="inline-flex" aria-label="Monétika">
        <Wordmark variant="full" tone="forest" className="h-8 w-auto" />
      </Link>

      <nav aria-label={t('sidebar')} className="mt-12 flex flex-col gap-0.5">
        {SECTIONS.map((s) => {
          const isActive = pathname === s.href || pathname.startsWith(`${s.href}/`);
          return (
            <Link
              key={s.key}
              href={s.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative flex items-center rounded-[8px] px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-[color:var(--surface)] text-foreground'
                  : 'text-muted-foreground hover:bg-[color:var(--surface)] hover:text-foreground',
              )}
            >
              {isActive ? (
                <span className="absolute left-0 h-4 w-0.5 bg-[color:var(--ochre)]" aria-hidden />
              ) : null}
              <span className="ml-3">{t(s.key)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {t('tagline')}
        </p>
      </div>
    </aside>
  );
}
