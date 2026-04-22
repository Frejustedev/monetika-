'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

type Props = {
  view: 'month' | 'year';
  labels: { month: string; year: string };
};

export function TabSwitcher({ view, labels }: Props) {
  const pathname = usePathname();
  const sp = useSearchParams();

  const hrefFor = (next: 'month' | 'year') => {
    const params = new URLSearchParams(sp?.toString() ?? '');
    params.set('view', next);
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div className="inline-flex gap-1 rounded-[10px] border border-border bg-[color:var(--surface)] p-1">
      {(['month', 'year'] as const).map((v) => (
        <Link
          key={v}
          href={hrefFor(v)}
          className={cn(
            'rounded-[8px] px-4 py-1.5 text-sm transition-colors',
            view === v
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {labels[v]}
        </Link>
      ))}
    </div>
  );
}
