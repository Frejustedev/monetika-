'use client';

import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { CaretLeft, CaretRight } from '@phosphor-icons/react/dist/ssr';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

type Props = {
  year: number;
  month: number; // 0-11
  locale?: 'fr' | 'en';
  className?: string;
};

export function MonthSelector({ year, month, locale = 'fr', className }: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  const go = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    const params = new URLSearchParams(sp?.toString() ?? '');
    params.set('year', String(d.getFullYear()));
    params.set('month', String(d.getMonth()));
    router.push(`?${params.toString()}`);
  };

  const dateLocale = locale === 'fr' ? fr : enUS;
  const label = format(new Date(year, month, 1), 'MMMM yyyy', { locale: dateLocale });
  const isCurrent = year === new Date().getFullYear() && month === new Date().getMonth();

  return (
    <div className={cn('flex items-center justify-center gap-3', className)}>
      <button
        type="button"
        onClick={() => go(-1)}
        aria-label={locale === 'fr' ? 'Mois précédent' : 'Previous month'}
        className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-[color:var(--surface)] hover:text-foreground"
      >
        <CaretLeft size={18} />
      </button>
      <p className="editorial-title text-foreground" style={{ fontSize: '1.375rem' }}>
        {label}
      </p>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label={locale === 'fr' ? 'Mois suivant' : 'Next month'}
        disabled={isCurrent}
        className={cn(
          'rounded-full p-1.5 transition-colors',
          isCurrent
            ? 'text-muted-foreground/30'
            : 'text-muted-foreground hover:bg-[color:var(--surface)] hover:text-foreground',
        )}
      >
        <CaretRight size={18} />
      </button>
    </div>
  );
}
