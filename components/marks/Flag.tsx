// Drapeaux sobres — bandes géométriques sans détails réalistes.
// Respect les proportions 3:2, palette désaturée pour rester éditorial.

import type { CountryCode } from '@/lib/money/currency';

type FlagProps = {
  country: CountryCode;
  className?: string;
  title?: string;
};

export function Flag({ country, className, title }: FlagProps) {
  const parts = FLAGS[country];
  return (
    <svg
      viewBox="0 0 60 40"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title ?? country}
    >
      <rect x="0" y="0" width="60" height="40" fill={parts.bg} rx="2" />
      {parts.render}
      <rect x="0" y="0" width="60" height="40" fill="none" stroke="var(--border)" strokeWidth="0.5" rx="2" />
    </svg>
  );
}

// Palette sourdie — on évite les saturations fluo.
const GREEN = '#2C5E3F';
const RED = '#A63A2B';
const YELLOW = '#C89A3C';
const WHITE = '#F5F1E8';
const BLUE = '#3E5F85';
const BLACK = '#17160F';
const ORANGE = '#C96F3A';

const FLAGS: Record<CountryCode, { bg: string; render: React.ReactElement }> = {
  // Bénin : vert vertical + jaune horizontal sur rouge
  BJ: {
    bg: GREEN,
    render: (
      <>
        <rect x="0" y="0" width="20" height="40" fill={GREEN} />
        <rect x="20" y="0" width="40" height="20" fill={YELLOW} />
        <rect x="20" y="20" width="40" height="20" fill={RED} />
      </>
    ),
  },
  // Burkina : rouge / vert + étoile jaune centrale (simplifiée)
  BF: {
    bg: RED,
    render: (
      <>
        <rect x="0" y="0" width="60" height="20" fill={RED} />
        <rect x="0" y="20" width="60" height="20" fill={GREEN} />
        <circle cx="30" cy="20" r="4" fill={YELLOW} />
      </>
    ),
  },
  // Côte d'Ivoire : orange / blanc / vert
  CI: {
    bg: WHITE,
    render: (
      <>
        <rect x="0" y="0" width="20" height="40" fill={ORANGE} />
        <rect x="20" y="0" width="20" height="40" fill={WHITE} />
        <rect x="40" y="0" width="20" height="40" fill={GREEN} />
      </>
    ),
  },
  // Guinée-Bissau : rouge vertical + jaune/vert
  GW: {
    bg: GREEN,
    render: (
      <>
        <rect x="0" y="0" width="20" height="40" fill={RED} />
        <rect x="20" y="0" width="40" height="20" fill={YELLOW} />
        <rect x="20" y="20" width="40" height="20" fill={GREEN} />
        <circle cx="10" cy="20" r="3.5" fill={BLACK} />
      </>
    ),
  },
  // Mali : vert / jaune / rouge
  ML: {
    bg: YELLOW,
    render: (
      <>
        <rect x="0" y="0" width="20" height="40" fill={GREEN} />
        <rect x="20" y="0" width="20" height="40" fill={YELLOW} />
        <rect x="40" y="0" width="20" height="40" fill={RED} />
      </>
    ),
  },
  // Niger : orange / blanc / vert (simplifié)
  NE: {
    bg: WHITE,
    render: (
      <>
        <rect x="0" y="0" width="60" height="13" fill={ORANGE} />
        <rect x="0" y="13" width="60" height="14" fill={WHITE} />
        <rect x="0" y="27" width="60" height="13" fill={GREEN} />
        <circle cx="30" cy="20" r="3" fill={ORANGE} />
      </>
    ),
  },
  // Sénégal : vert / jaune / rouge + étoile centrale (simplifiée)
  SN: {
    bg: YELLOW,
    render: (
      <>
        <rect x="0" y="0" width="20" height="40" fill={GREEN} />
        <rect x="20" y="0" width="20" height="40" fill={YELLOW} />
        <rect x="40" y="0" width="20" height="40" fill={RED} />
        <circle cx="30" cy="20" r="3" fill={GREEN} />
      </>
    ),
  },
  // Togo : 5 bandes horizontales vertes/jaunes + carré rouge en chef
  TG: {
    bg: YELLOW,
    render: (
      <>
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x="0" y={i * 8} width="60" height="8" fill={i % 2 === 0 ? GREEN : YELLOW} />
        ))}
        <rect x="0" y="0" width="20" height="20" fill={RED} />
      </>
    ),
  },
  // Nigeria : vert / blanc / vert
  NG: {
    bg: GREEN,
    render: (
      <>
        <rect x="0" y="0" width="20" height="40" fill={GREEN} />
        <rect x="20" y="0" width="20" height="40" fill={WHITE} />
        <rect x="40" y="0" width="20" height="40" fill={GREEN} />
      </>
    ),
  },
  // Ghana : rouge / jaune / vert + étoile noire (simplifiée)
  GH: {
    bg: YELLOW,
    render: (
      <>
        <rect x="0" y="0" width="60" height="13" fill={RED} />
        <rect x="0" y="13" width="60" height="14" fill={YELLOW} />
        <rect x="0" y="27" width="60" height="13" fill={GREEN} />
        <circle cx="30" cy="20" r="3" fill={BLACK} />
      </>
    ),
  },
};

// Helper : unused mais on s'assure que le compilateur voit BLUE comme utilisé à défaut.
// (utile si on ajoute un drapeau bleu plus tard sans erreur eslint no-unused-vars).
export const __PALETTE = { GREEN, RED, YELLOW, WHITE, BLUE, BLACK, ORANGE };
