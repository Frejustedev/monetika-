'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type SelectableAccount = {
  id: string;
  label: string;
  institution: string;
  currency: string;
  color: string;
  isBlocked: boolean;
};

type Props = {
  accounts: SelectableAccount[];
  value?: string;
  onChange: (id: string) => void;
  label?: string;
  excludeId?: string;
};

export function AccountSelector({ accounts, value, onChange, label, excludeId }: Props) {
  const filtered = accounts.filter((a) => a.id !== excludeId && !a.isBlocked);

  return (
    <div>
      {label ? (
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      ) : null}
      <div className="flex snap-x gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none]">
        {filtered.map((a) => {
          const isActive = a.id === value;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onChange(a.id)}
              aria-pressed={isActive}
              className={cn(
                'flex snap-start items-center gap-2 rounded-[10px] border px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'border-[color:var(--forest)] bg-[color:var(--surface)]'
                  : 'border-border text-muted-foreground hover:bg-[color:var(--surface)]',
              )}
            >
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ background: a.color }}
                aria-hidden
              />
              <span className="max-w-[10rem] truncate text-left">{a.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
