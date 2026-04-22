'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type AmountPadProps = {
  value: string;
  onChange: (value: string) => void;
  currency: string;
  allowDecimals?: boolean;
  maxFractionDigits?: number;
  autoFocus?: boolean;
  onSubmit?: () => void;
};

const KEYS: Array<string | 'decimal' | 'backspace'> = [
  '1', '2', '3',
  '4', '5', '6',
  '7', '8', '9',
  'decimal', '0', 'backspace',
];

// Pavé numérique XXL — montant en Fraunces 72pt, symbole monétaire réduit.
// Objectif perf : ≤ 5 s / 2 taps du mount à la validation.
export function AmountPad({
  value,
  onChange,
  currency,
  allowDecimals = false,
  maxFractionDigits = 2,
  autoFocus = true,
  onSubmit,
}: AmountPadProps) {
  const press = React.useCallback(
    (key: string) => {
      if (key === 'backspace') {
        if (value.length === 0) return;
        onChange(value.slice(0, -1));
        return;
      }
      if (key === 'decimal') {
        if (!allowDecimals) return;
        if (value.includes('.') || value.includes(',')) return;
        onChange(value.length === 0 ? '0.' : `${value}.`);
        return;
      }
      // Garde-fou sur la précision décimale.
      if (value.includes('.')) {
        const parts = value.split('.');
        if (parts[1] && parts[1].length >= maxFractionDigits) return;
      }
      if (value === '0') {
        onChange(key);
        return;
      }
      if (value.length >= 12) return;
      onChange(value + key);
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(6);
      }
    },
    [value, allowDecimals, maxFractionDigits, onChange],
  );

  // Support clavier physique (desktop) — permet une saisie ultra-rapide.
  React.useEffect(() => {
    if (!autoFocus) return;
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^\d$/.test(e.key)) {
        e.preventDefault();
        press(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        press('backspace');
      } else if ((e.key === '.' || e.key === ',') && allowDecimals) {
        e.preventDefault();
        press('decimal');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSubmit?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [autoFocus, allowDecimals, press, onSubmit]);

  // Mise en forme visuelle du montant (regrouper les milliers).
  const display = formatDisplay(value);

  return (
    <div className="flex flex-col gap-5">
      {/* Montant affiché XXL */}
      <div className="flex min-h-[5rem] items-baseline justify-center text-center">
        <span
          className="mr-2 font-mono text-[0.9rem] uppercase tracking-[0.18em] text-muted-foreground"
          aria-hidden
        >
          {currency}
        </span>
        <span
          className="amount-xl font-semibold text-foreground"
          style={{ fontSize: 'clamp(3rem, 14vw, 5rem)' }}
          data-numeric
        >
          {display || '0'}
        </span>
      </div>

      {/* Pavé 3x4 */}
      <div className="grid grid-cols-3 gap-2.5">
        {KEYS.map((key) => {
          if (key === 'decimal' && !allowDecimals) {
            return <span key="nil" />;
          }
          const label = key === 'backspace' ? '⌫' : key === 'decimal' ? '.' : key;
          const ariaLabel = key === 'backspace' ? 'Effacer' : key === 'decimal' ? 'Virgule' : `Chiffre ${key}`;
          return (
            <button
              key={String(key)}
              type="button"
              onClick={() => press(String(key))}
              aria-label={ariaLabel}
              className={cn(
                'h-16 rounded-[10px] border border-border bg-background font-display text-2xl font-medium text-foreground',
                'transition-all duration-[var(--dur-fast)] hover:bg-[color:var(--surface)] active:scale-95 active:bg-[color:var(--surface-hover)]',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatDisplay(raw: string): string {
  if (!raw) return '';
  const [intPart, decPart] = raw.split('.');
  const intWithSpaces = (intPart ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
  return decPart !== undefined ? `${intWithSpaces}.${decPart}` : intWithSpaces;
}
