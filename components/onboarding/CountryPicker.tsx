'use client';

import * as React from 'react';
import { COUNTRIES } from '@/lib/countries';
import { Flag } from '@/components/marks/Flag';
import { cn } from '@/lib/utils';

type Props = {
  name: string;
  value?: string;
  onChange?: (code: string) => void;
  locale?: 'fr' | 'en';
};

export function CountryPicker({ name, value, onChange, locale = 'fr' }: Props) {
  const [selected, setSelected] = React.useState<string>(value ?? '');

  const handle = (code: string) => {
    setSelected(code);
    onChange?.(code);
  };

  return (
    <div>
      <input type="hidden" name={name} value={selected} />
      <ul className="grid grid-cols-2 gap-3">
        {COUNTRIES.map((c) => {
          const isActive = c.code === selected;
          const label = locale === 'fr' ? c.name : c.nameEn;
          return (
            <li key={c.code}>
              <button
                type="button"
                onClick={() => handle(c.code)}
                aria-pressed={isActive}
                className={cn(
                  'flex w-full items-center gap-3 rounded-[10px] border px-4 py-3 text-left transition-colors',
                  isActive
                    ? 'border-[color:var(--forest)] bg-[color:var(--surface)]'
                    : 'border-border hover:bg-[color:var(--surface)]',
                )}
              >
                <Flag country={c.code} className="h-6 w-9 flex-shrink-0" title={label} />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">{label}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {c.currency} · {c.dialCode}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
