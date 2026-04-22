'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type PinPadProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  label?: string;
  error?: string;
  autoFocus?: boolean;
  id?: string;
  name?: string;
};

const KEYS: Array<string | null> = [
  '1', '2', '3',
  '4', '5', '6',
  '7', '8', '9',
  null, '0', 'backspace',
];

export function PinPad({
  value,
  onChange,
  length = 6,
  label,
  error,
  autoFocus,
  id,
  name,
}: PinPadProps) {
  const press = React.useCallback(
    (key: string) => {
      if (key === 'backspace') {
        onChange(value.slice(0, -1));
        return;
      }
      if (value.length >= length) return;
      onChange(value + key);
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(6);
      }
    },
    [value, length, onChange],
  );

  React.useEffect(() => {
    if (!autoFocus) return;
    const handler = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) {
        e.preventDefault();
        press(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        press('backspace');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [autoFocus, press]);

  return (
    <div className="flex flex-col gap-6" aria-describedby={error ? `${id}-err` : undefined}>
      {label ? (
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      ) : null}

      {/* Pastilles — affichage du PIN saisi */}
      <div className="flex items-center justify-center gap-3" role="status" aria-live="polite">
        {Array.from({ length }).map((_, i) => {
          const filled = i < value.length;
          return (
            <span
              key={i}
              className={cn(
                'h-3.5 w-3.5 rounded-full transition-all duration-[var(--dur-fast)] ease-[var(--ease-monetika)]',
                filled
                  ? 'bg-[color:var(--forest)] scale-110'
                  : 'bg-transparent border border-border',
              )}
              aria-hidden="true"
            />
          );
        })}
      </div>

      {/* Champ caché pour l'envoi formulaire */}
      <input type="hidden" id={id} name={name} value={value} />

      {/* Pavé numérique */}
      <div className="mx-auto grid w-full max-w-[320px] grid-cols-3 gap-3">
        {KEYS.map((key, i) => {
          if (key === null) return <span key={`spacer-${i}`} />;
          const isBack = key === 'backspace';
          return (
            <button
              key={key}
              type="button"
              onClick={() => press(key)}
              aria-label={isBack ? 'Effacer' : `Chiffre ${key}`}
              className={cn(
                'h-16 rounded-[10px] border border-border bg-background font-display text-2xl font-medium text-foreground',
                'transition-colors hover:bg-[color:var(--surface)] active:bg-[color:var(--surface-hover)]',
              )}
            >
              {isBack ? '⌫' : key}
            </button>
          );
        })}
      </div>

      {error ? (
        <p id={`${id}-err`} role="alert" className="text-center text-xs text-[color:var(--terracotta)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
