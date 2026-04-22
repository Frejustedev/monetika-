import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

type Props = {
  year: number;
  data: Array<{ month: number; income: number; expense: number }>;
  locale?: 'fr' | 'en';
  className?: string;
};

const WIDTH = 720;
const HEIGHT = 220;
const PADDING = { top: 20, right: 12, bottom: 32, left: 12 };

export function MonthlyBars({ year, data, locale = 'fr', className }: Props) {
  const dateLocale = locale === 'fr' ? fr : enUS;
  const max = Math.max(...data.map((d) => Math.max(d.income, d.expense)));
  if (max <= 0) {
    return (
      <div className="rounded-[10px] border border-border bg-[color:var(--surface)] px-4 py-6 text-center text-sm text-muted-foreground">
        {locale === 'fr' ? 'Aucune donnée pour cette année.' : 'No data this year.'}
      </div>
    );
  }

  const chartW = WIDTH - PADDING.left - PADDING.right;
  const chartH = HEIGHT - PADDING.top - PADDING.bottom;
  const groupW = chartW / data.length;
  const barW = Math.min(16, (groupW - 4) / 2);

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={className} role="img" aria-label={`Revenus et dépenses ${year}`}>
      {/* Base line */}
      <line
        x1={PADDING.left}
        y1={HEIGHT - PADDING.bottom}
        x2={WIDTH - PADDING.right}
        y2={HEIGHT - PADDING.bottom}
        stroke="var(--bone)"
        strokeWidth={0.5}
      />

      {data.map((d, i) => {
        const groupX = PADDING.left + i * groupW;
        const incomeH = (d.income / max) * chartH;
        const expenseH = (d.expense / max) * chartH;
        const monthLabel = format(new Date(year, d.month, 1), 'MMM', { locale: dateLocale });

        return (
          <g key={d.month}>
            {/* Revenus à gauche, forest */}
            <rect
              x={groupX + groupW / 2 - barW - 1}
              y={HEIGHT - PADDING.bottom - incomeH}
              width={barW}
              height={incomeH}
              fill="var(--forest)"
              rx={1.5}
            />
            {/* Dépenses à droite, terracotta */}
            <rect
              x={groupX + groupW / 2 + 1}
              y={HEIGHT - PADDING.bottom - expenseH}
              width={barW}
              height={expenseH}
              fill="var(--terracotta)"
              opacity={0.85}
              rx={1.5}
            />
            <text
              x={groupX + groupW / 2}
              y={HEIGHT - PADDING.bottom + 14}
              textAnchor="middle"
              fontSize={9}
              fontFamily="ui-monospace, monospace"
              fill="var(--muted)"
            >
              {monthLabel.slice(0, 3).toUpperCase()}
            </text>
          </g>
        );
      })}

      {/* Légende */}
      <g transform={`translate(${PADDING.left}, ${PADDING.top - 4})`}>
        <rect x="0" y="0" width="10" height="10" fill="var(--forest)" rx={1.5} />
        <text x="16" y="9" fontSize={10} fontFamily="ui-monospace, monospace" fill="var(--muted)">
          {locale === 'fr' ? 'REVENUS' : 'INCOME'}
        </text>
        <rect x="90" y="0" width="10" height="10" fill="var(--terracotta)" opacity={0.85} rx={1.5} />
        <text x="106" y="9" fontSize={10} fontFamily="ui-monospace, monospace" fill="var(--muted)">
          {locale === 'fr' ? 'DÉPENSES' : 'EXPENSES'}
        </text>
      </g>
    </svg>
  );
}
