import Link from 'next/link';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { Amount } from '@/components/money/Amount';
import type { SupportedCurrency, SupportedLocale } from '@/lib/money/currency';
import { cn } from '@/lib/utils';

type Props = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  targetDate: Date;
  isAchieved: boolean;
  progressPct: number;
  monthsLeft: number;
  monthlyContributionNeeded: number;
  locale?: SupportedLocale;
};

export function GoalRow({
  id,
  name,
  targetAmount,
  currentAmount,
  currency,
  targetDate,
  isAchieved,
  progressPct,
  monthsLeft,
  monthlyContributionNeeded,
  locale = 'fr',
}: Props) {
  const dateLocale = locale === 'fr' ? fr : enUS;
  const dateLabel = format(targetDate, 'MMM yyyy', { locale: dateLocale });

  return (
    <Link
      href={`/goals/${id}`}
      className="block border-b border-border py-4 transition-colors last:border-b-0 hover:bg-[color:var(--surface)]"
    >
      <div className="flex items-baseline justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium text-foreground">{name}</p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {isAchieved
              ? locale === 'fr'
                ? 'Objectif atteint'
                : 'Goal achieved'
              : locale === 'fr'
                ? `${monthsLeft} mois · ${dateLabel}`
                : `${monthsLeft} months · ${dateLabel}`}
          </p>
        </div>
        <div className="text-right">
          <Amount
            value={currentAmount}
            currency={currency as SupportedCurrency}
            locale={locale}
            size="sm"
            className="font-medium"
          />
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            /{' '}
            <Amount
              value={targetAmount}
              currency={currency as SupportedCurrency}
              locale={locale}
              size="sm"
              className="font-normal"
            />
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-[color:var(--bone)]">
          <span
            className={cn(
              'block h-full transition-[width] duration-[var(--dur-normal)] ease-[var(--ease-monetika)]',
              isAchieved ? 'bg-[color:var(--ochre)]' : 'bg-[color:var(--forest)]',
            )}
            style={{ width: `${Math.max(0, Math.min(1, progressPct)) * 100}%` }}
            aria-hidden
          />
        </div>
        <span className="font-display tabular-nums text-sm text-foreground" data-numeric>
          {Math.round(progressPct * 100)}%
        </span>
      </div>

      {!isAchieved && monthlyContributionNeeded > 0 ? (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {locale === 'fr' ? 'Contribution mensuelle recommandée : ' : 'Recommended monthly: '}
          <Amount
            value={monthlyContributionNeeded}
            currency={currency as SupportedCurrency}
            locale={locale}
            size="sm"
            className="font-medium normal-case text-foreground"
          />
        </p>
      ) : null}
    </Link>
  );
}
