import * as React from 'react';
import { cn } from '@/lib/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  label?: string;
  hint?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, error, label, hint, id, type = 'text', ...rest },
  ref,
) {
  const autoId = React.useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        type={type}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={cn(
          'h-11 rounded-[10px] border border-border bg-background px-4 text-base text-foreground',
          'placeholder:text-muted-foreground/60',
          'transition-colors focus-visible:border-[color:var(--ochre)]',
          error ? 'border-[color:var(--terracotta)]' : '',
          className,
        )}
        {...rest}
      />
      {hint && !error ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-[color:var(--terracotta)]">
          {error}
        </p>
      ) : null}
    </div>
  );
});
