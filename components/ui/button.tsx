import * as React from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ' +
  'transition-colors duration-[var(--dur-fast)] ease-[var(--ease-monetika)] ' +
  'disabled:opacity-50 disabled:pointer-events-none ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ochre)] focus-visible:ring-offset-2 focus-visible:ring-offset-background';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-[color:var(--primary)] text-[color:var(--primary-foreground)] hover:bg-[color:var(--primary-hover)]',
  secondary:
    'border border-border bg-transparent text-foreground hover:bg-[color:var(--surface)]',
  ghost: 'bg-transparent text-foreground hover:bg-[color:var(--surface)]',
  danger:
    'bg-[color:var(--destructive)] text-[color:var(--paper)] hover:bg-[color:var(--clay)]',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 rounded-[8px] px-3 text-sm',
  md: 'h-11 rounded-[10px] px-5 text-base',
  lg: 'h-14 rounded-[10px] px-6 text-lg',
};

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export const Button = React.forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = 'primary', size = 'md', type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      {...rest}
    />
  );
});
