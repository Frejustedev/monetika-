import Link from 'next/link';
import { Amount } from '@/components/money/Amount';
import type { SupportedCurrency, SupportedLocale } from '@/lib/money/currency';
import { cn } from '@/lib/utils';

type Props = {
  id: string;
  label: string;
  institution: string;
  currency: string;
  currentBalance: number;
  color?: string;
  isBlocked?: boolean;
  locale?: SupportedLocale;
  className?: string;
};

export function AccountRow({
  id,
  label,
  institution,
  currency,
  currentBalance,
  color = '#1F4D3F',
  isBlocked,
  locale = 'fr',
  className,
}: Props) {
  return (
    <Link
      href={`/accounts/${id}`}
      className={cn(
        'group flex items-center gap-4 border-b border-border px-1 py-4 transition-colors last:border-b-0 hover:bg-[color:var(--surface)]',
        className,
      )}
    >
      <span
        className="h-10 w-1 flex-shrink-0 rounded-[2px]"
        style={{ background: color }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-base font-medium text-foreground">{label}</p>
          {isBlocked ? (
            <span
              className="font-mono text-[9px] uppercase tracking-[0.18em] text-[color:var(--terracotta)]"
              title={locale === 'fr' ? 'Bloqué' : 'Blocked'}
            >
              ● BLK
            </span>
          ) : null}
        </div>
        <p className="truncate font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          {institution}
        </p>
      </div>
      <Amount
        value={currentBalance}
        currency={currency as SupportedCurrency}
        locale={locale}
        size="md"
        className="flex-shrink-0 font-semibold"
      />
      <span
        className="font-display italic text-muted-foreground transition-transform group-hover:translate-x-0.5"
        aria-hidden
      >
        →
      </span>
    </Link>
  );
}
