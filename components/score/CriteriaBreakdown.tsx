import type { CriterionKey } from '@/lib/scoring/nef';
import { cn } from '@/lib/utils';

const LABELS_FR: Record<CriterionKey, string> = {
  regularity: 'Régularité de saisie',
  strategyAdherence: 'Adhérence stratégique',
  budgetDiscipline: 'Discipline budgétaire',
  savingsRate: 'Taux d\u2019épargne',
  goalProgress: 'Progression des objectifs',
  diversification: 'Diversification',
  trend: 'Tendance du patrimoine',
};

const LABELS_EN: Record<CriterionKey, string> = {
  regularity: 'Logging regularity',
  strategyAdherence: 'Strategy adherence',
  budgetDiscipline: 'Budget discipline',
  savingsRate: 'Savings rate',
  goalProgress: 'Goal progress',
  diversification: 'Diversification',
  trend: 'Net-worth trend',
};

type Props = {
  breakdown: Record<CriterionKey, { score: number; weight: number }>;
  locale?: 'fr' | 'en';
};

export function CriteriaBreakdown({ breakdown, locale = 'fr' }: Props) {
  const labels = locale === 'fr' ? LABELS_FR : LABELS_EN;
  const entries = Object.entries(breakdown) as Array<[CriterionKey, { score: number; weight: number }]>;

  // Trie par contribution absolue au score total (score × weight / 100), décroissante.
  entries.sort((a, b) => {
    const contribA = (a[1].score * a[1].weight) / 100;
    const contribB = (b[1].score * b[1].weight) / 100;
    return contribB - contribA;
  });

  return (
    <ul className="space-y-4">
      {entries.map(([key, { score, weight }]) => {
        const contribution = Math.round((score * weight) / 100);
        const pct = score / 100;
        const tone = score >= 70 ? 'bg-[color:var(--forest)]' : score >= 40 ? 'bg-[color:var(--ochre)]' : 'bg-[color:var(--terracotta)]';
        return (
          <li key={key} className="border-b border-border pb-3 last:border-b-0">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm text-foreground">{labels[key]}</span>
              <span className="font-display tabular-nums text-sm text-foreground" data-numeric>
                {score}
                <span className="ml-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  / 100
                </span>
              </span>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-[color:var(--bone)]">
                <span
                  className={cn('block h-full transition-[width] duration-[var(--dur-normal)]', tone)}
                  style={{ width: `${pct * 100}%` }}
                  aria-hidden
                />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {locale === 'fr' ? 'contribue ' : 'contributes '} +{contribution}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
