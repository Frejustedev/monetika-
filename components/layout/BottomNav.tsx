'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { NAV_ITEMS, type NavItem } from './nav-items';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const t = useTranslations('navBottom');
  const pathname = usePathname();

  return (
    <nav
      aria-label={t('label')}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between">
        {NAV_ITEMS.map((item) => (
          <NavTab key={item.key} item={item} currentPath={pathname} label={t(`items.${item.key}`)} />
        ))}
      </ul>
    </nav>
  );
}

function NavTab({ item, currentPath, label }: { item: NavItem; currentPath: string; label: string }) {
  const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);

  if (item.accent) {
    return (
      <li className="flex flex-1 items-center justify-center">
        <Link
          href={item.href}
          aria-label={label}
          className="relative -mt-4 flex h-14 w-14 items-center justify-center rounded-[20px] bg-[color:var(--forest)] text-[color:var(--paper)] shadow-sm transition-transform active:scale-95"
        >
          <NavIcon kind={item.key} />
        </Link>
      </li>
    );
  }

  return (
    <li className="flex flex-1">
      <Link
        href={item.href}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'flex w-full flex-col items-center justify-center gap-1 py-2.5 transition-colors',
          isActive ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        <NavIcon kind={item.key} />
        <span className="font-mono text-[10px] uppercase tracking-[0.14em]">{label}</span>
        {isActive ? <span className="mt-0.5 h-0.5 w-6 rounded-full bg-[color:var(--ochre)]" aria-hidden /> : null}
      </Link>
    </li>
  );
}

// Icônes SVG inline sobres (24px). Pas de dépendance Phosphor au runtime bottom nav.
function NavIcon({ kind }: { kind: NavItem['key'] }) {
  const base = 'h-5 w-5';
  const common = {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (kind) {
    case 'home':
      return (
        <svg className={base} {...common}>
          <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-8.5Z" />
        </svg>
      );
    case 'accounts':
      return (
        <svg className={base} {...common}>
          <rect x="3" y="6" width="18" height="14" rx="2" />
          <path d="M3 10h18" />
          <path d="M7 16h4" />
        </svg>
      );
    case 'add':
      return (
        <svg className="h-6 w-6" {...common} strokeWidth={2}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case 'insights':
      return (
        <svg className={base} {...common}>
          <path d="M4 19V5" />
          <path d="M9 19v-7" />
          <path d="M14 19V9" />
          <path d="M19 19v-4" />
        </svg>
      );
    case 'more':
      return (
        <svg className={base} {...common}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="8" r="3" />
          <path d="M6 20a6 6 0 0 1 12 0" />
        </svg>
      );
  }
}
