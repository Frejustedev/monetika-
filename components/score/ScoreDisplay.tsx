// Grande note Fraunces 120pt centrée, ligne horizontale 0-1000 avec marqueur.
// Aucun gauge arc-en-ciel — minimaliste FT-style.

type Props = {
  score: number; // 0-1000
  level: 'excellent' | 'good' | 'average' | 'building';
  locale?: 'fr' | 'en';
};

const LEVEL_LABELS_FR: Record<Props['level'], string> = {
  excellent: 'Excellent',
  good: 'Bon',
  average: 'Moyen',
  building: 'À construire',
};
const LEVEL_LABELS_EN: Record<Props['level'], string> = {
  excellent: 'Excellent',
  good: 'Good',
  average: 'Average',
  building: 'Building',
};

export function ScoreDisplay({ score, level, locale = 'fr' }: Props) {
  const labels = locale === 'fr' ? LEVEL_LABELS_FR : LEVEL_LABELS_EN;
  const pct = Math.max(0, Math.min(1000, score)) / 1000;

  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="amount-xl font-semibold text-foreground"
        style={{ fontSize: 'clamp(4rem, 14vw, 7.5rem)', lineHeight: 0.95 }}
        data-numeric
      >
        {score}
      </div>
      <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
        / 1000 · {labels[level]}
      </p>

      {/* Ligne 0-1000 avec marqueur */}
      <div className="relative mt-8 w-full max-w-md">
        <div className="h-px w-full bg-[color:var(--bone)]" />
        <div
          className="absolute -top-1 h-3 w-px bg-[color:var(--forest)]"
          style={{ left: `${pct * 100}%` }}
          aria-hidden
        />
        <div className="mt-3 flex justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <span>0</span>
          <span>250</span>
          <span>500</span>
          <span>750</span>
          <span>1000</span>
        </div>
      </div>
    </div>
  );
}
