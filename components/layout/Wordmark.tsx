// Monétika — wordmark SVG inline.
// Le logotype est « L'Accent » : le é italique de Fraunces.
// Utilise les SVG officiels depuis /public/marks/ via <Image> en production,
// mais la version inline ici évite un aller-retour réseau en SSR.

import { cn } from '@/lib/utils';

type Variant = 'full' | 'mark' | 'wordmark';
type Tone = 'forest' | 'ink' | 'paper' | 'ochre';

const TONE_TO_COLOR: Record<Tone, string> = {
  forest: '#1F4D3F',
  ink: '#17160F',
  paper: '#F5F1E8',
  ochre: '#C89A3C',
};

export function Wordmark({
  variant = 'full',
  tone = 'forest',
  className,
  ariaLabel = 'Monétika',
}: {
  variant?: Variant;
  tone?: Tone;
  className?: string;
  ariaLabel?: string;
}) {
  const color = TONE_TO_COLOR[tone];

  if (variant === 'mark') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        role="img"
        aria-label={ariaLabel}
        className={cn('inline-block', className)}
      >
        <text
          x="32"
          y="50"
          textAnchor="middle"
          fontFamily="'Fraunces', ui-serif, Georgia, serif"
          fontStyle="italic"
          fontWeight={600}
          fontSize={54}
          fill={color}
        >
          é
        </text>
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 240 64"
      role="img"
      aria-label={ariaLabel}
      className={cn('inline-block', className)}
    >
      <text
        x="0"
        y="48"
        fontFamily="'Fraunces', ui-serif, Georgia, serif"
        fontStyle="italic"
        fontWeight={500}
        fontSize={46}
        letterSpacing="-0.01em"
        fill={color}
      >
        Monétika
      </text>
    </svg>
  );
}
