'use client';

import * as React from 'react';
import { Amount } from './Amount';
import type { SupportedCurrency, SupportedLocale } from '@/lib/money/currency';

type Props = {
  value: number;
  currency: SupportedCurrency;
  locale?: SupportedLocale;
  durationMs?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  className?: string;
};

// Tick-up animation — 0 → value avec easing easeOutQuart ~600ms au premier rendu.
// Respect prefers-reduced-motion : rendu immédiat si l'utilisateur a réduit les animations.
export function AnimatedAmount({
  value,
  currency,
  locale = 'fr',
  durationMs = 600,
  size = 'xxl',
  className,
}: Props) {
  const [display, setDisplay] = React.useState(0);
  const targetRef = React.useRef(value);
  targetRef.current = value;

  React.useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setDisplay(value);
      return;
    }

    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      // easeOutQuart = 1 - (1 - t)^4
      const eased = 1 - Math.pow(1 - t, 4);
      setDisplay(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs]);

  return (
    <Amount
      value={display}
      currency={currency}
      locale={locale}
      size={size}
      className={className}
    />
  );
}
