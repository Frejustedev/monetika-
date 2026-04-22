import { cn } from '@/lib/utils';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const;
export type StepKey = (typeof ROMAN)[number];

type Props = {
  current: StepKey;
  className?: string;
};

// Indicateur éditorial — chiffres romains en Fraunces italique, filet ocre sous l'actif.
export function StepProgress({ current, className }: Props) {
  return (
    <nav aria-label="Progression de l'onboarding" className={cn('flex gap-3 text-lg', className)}>
      {ROMAN.map((key) => {
        const isCurrent = key === current;
        const isPast = ROMAN.indexOf(key) < ROMAN.indexOf(current);
        return (
          <span
            key={key}
            aria-current={isCurrent ? 'step' : undefined}
            className={cn(
              'font-display italic',
              isCurrent
                ? 'text-[color:var(--ochre)] border-b border-[color:var(--ochre)]'
                : isPast
                  ? 'text-muted-foreground'
                  : 'text-muted-foreground/50',
            )}
          >
            {key}
          </span>
        );
      })}
    </nav>
  );
}
