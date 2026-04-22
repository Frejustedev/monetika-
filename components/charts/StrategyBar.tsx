// Barre horizontale segmentée — répartition du patrimoine par bucket.
// Version SVG sur mesure, façon journal économique, pas de donut.

import {
  BUCKETS,
  BUCKET_COLORS,
  BUCKET_LABELS_FR,
  BUCKET_LABELS_EN,
  type BucketKey,
} from '@/lib/strategy/buckets';
import { cn } from '@/lib/utils';

type Props = {
  data: Array<{ bucket: BucketKey; amount: number }>;
  locale?: 'fr' | 'en';
  showLegend?: boolean;
  className?: string;
};

export function StrategyBar({ data, locale = 'fr', showLegend = true, className }: Props) {
  const labels = locale === 'fr' ? BUCKET_LABELS_FR : BUCKET_LABELS_EN;
  const total = data.reduce((sum, d) => sum + d.amount, 0);

  // Trie par ordre canonique des buckets (cohérence visuelle).
  const byBucket = new Map(data.map((d) => [d.bucket, d.amount]));
  const ordered = BUCKETS.map((b) => ({ bucket: b, amount: byBucket.get(b) ?? 0 }));

  if (total <= 0) {
    return (
      <div className={cn('rounded-[10px] border border-border bg-[color:var(--surface)] px-4 py-6 text-center', className)}>
        <p className="text-sm text-muted-foreground">
          {locale === 'fr' ? 'Aucun solde à répartir.' : 'No balance to allocate.'}
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Barre segmentée */}
      <div
        className="flex h-3 w-full overflow-hidden rounded-[4px] border border-border"
        role="img"
        aria-label={locale === 'fr' ? 'Répartition par bucket' : 'Allocation by bucket'}
      >
        {ordered.map(({ bucket, amount }) => {
          if (amount <= 0) return null;
          const pct = (amount / total) * 100;
          return (
            <span
              key={bucket}
              style={{
                width: `${pct}%`,
                background: BUCKET_COLORS[bucket],
              }}
              title={`${labels[bucket].long} · ${pct.toFixed(1)}%`}
            />
          );
        })}
      </div>

      {showLegend ? (
        <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
          {ordered.map(({ bucket, amount }) => {
            const pct = (amount / total) * 100;
            return (
              <li key={bucket} className="flex items-center gap-2.5 text-xs">
                <span
                  className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ background: BUCKET_COLORS[bucket] }}
                  aria-hidden
                />
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {labels[bucket].short}
                </span>
                <span className="ml-auto font-display tabular-nums text-sm text-foreground">
                  {pct.toFixed(0)}%
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
