'use client';

import * as React from 'react';
import {
  BUCKETS,
  BUCKET_COLORS,
  BUCKET_LABELS_FR,
  BUCKET_LABELS_EN,
  DEFAULT_STRATEGY,
  type BucketKey,
  validateStrategy,
} from '@/lib/strategy/buckets';
import { cn } from '@/lib/utils';

type Props = {
  locale?: 'fr' | 'en';
  initial?: Partial<Record<BucketKey, number>>;
};

type State = Record<BucketKey, number>;

export function StrategySlider({ locale = 'fr', initial }: Props) {
  const [values, setValues] = React.useState<State>({
    ...DEFAULT_STRATEGY,
    ...initial,
  });
  const labels = locale === 'fr' ? BUCKET_LABELS_FR : BUCKET_LABELS_EN;
  const { total, ok } = validateStrategy(values);

  const updateBucket = (key: BucketKey, next: number) => {
    setValues((prev) => ({ ...prev, [key]: Math.max(0, Math.min(100, next)) }));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Barre segmentée — aperçu proportionnel */}
      <div>
        <div className="flex h-3 w-full overflow-hidden rounded-[4px] border border-border">
          {BUCKETS.map((k) => {
            const pct = Math.max(0, values[k]);
            if (pct === 0) return null;
            return (
              <span
                key={k}
                title={`${labels[k].long} ${pct}%`}
                style={{ width: `${pct}%`, background: BUCKET_COLORS[k] }}
                className="h-full"
              />
            );
          })}
        </div>
        <p
          className={cn(
            'mt-2 font-mono text-[11px] uppercase tracking-[0.18em]',
            ok ? 'text-muted-foreground' : 'text-[color:var(--terracotta)]',
          )}
          aria-live="polite"
        >
          {locale === 'fr' ? 'Total' : 'Total'} <span data-numeric>{total}%</span>
          {!ok ? ` · ${locale === 'fr' ? 'doit faire 100' : 'must equal 100'}` : ''}
        </p>
      </div>

      {/* Sliders par bucket */}
      <ul className="flex flex-col gap-4">
        {BUCKETS.map((k) => (
          <li key={k} className="flex items-center gap-4">
            <span className="flex w-28 items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: BUCKET_COLORS[k] }}
                aria-hidden
              />
              {labels[k].long}
            </span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={values[k]}
              onChange={(e) => updateBucket(k, Number(e.target.value))}
              className="monetika-range flex-1"
              aria-label={labels[k].long}
            />
            <output className="w-12 text-right font-display tabular-nums text-sm text-foreground">
              {values[k]}%
            </output>
            <input type="hidden" name={k.toLowerCase()} value={values[k]} />
          </li>
        ))}
      </ul>
    </div>
  );
}
