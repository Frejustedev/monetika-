// Treemap squarifié — SVG sur mesure, pas de dependency (pas de d3).
// Algorithme : slice-and-dice récursif (simple, lisible, acceptable pour ≤ 20 items).

type Item = { label: string; amount: number; color: string };

type Props = {
  items: Item[];
  width?: number;
  height?: number;
  className?: string;
};

type LayoutRect = { x: number; y: number; w: number; h: number; item: Item };

export function Treemap({ items, width = 600, height = 320, className }: Props) {
  const filtered = items.filter((i) => i.amount > 0).sort((a, b) => b.amount - a.amount);
  if (filtered.length === 0) {
    return (
      <div className="rounded-[10px] border border-border bg-[color:var(--surface)] px-4 py-6 text-center text-sm text-muted-foreground">
        Pas de données sur cette période.
      </div>
    );
  }

  const rects: LayoutRect[] = layoutSliceAndDice(filtered, 0, 0, width, height);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} role="img" aria-label="Répartition par catégorie">
      {rects.map((r, i) => {
        const showLabel = r.w > 60 && r.h > 28;
        const showAmount = r.w > 80 && r.h > 44;
        return (
          <g key={i}>
            <rect
              x={r.x}
              y={r.y}
              width={Math.max(0, r.w - 1)}
              height={Math.max(0, r.h - 1)}
              fill={r.item.color}
              opacity={0.85}
              rx={4}
            />
            {showLabel ? (
              <text
                x={r.x + 8}
                y={r.y + 18}
                fontSize={11}
                fill="#F5F1E8"
                fontFamily="'Instrument Sans', system-ui, sans-serif"
                fontWeight={500}
              >
                {r.item.label.length > Math.floor(r.w / 7)
                  ? r.item.label.slice(0, Math.floor(r.w / 7) - 1) + '…'
                  : r.item.label}
              </text>
            ) : null}
            {showAmount ? (
              <text
                x={r.x + 8}
                y={r.y + 34}
                fontSize={10}
                fill="#F5F1E8"
                opacity={0.85}
                fontFamily="ui-monospace, monospace"
              >
                {compactNumber(r.item.amount)}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

// Slice-and-dice : alterne coupe horizontale / verticale selon l'orientation dominante.
function layoutSliceAndDice(items: Item[], x: number, y: number, w: number, h: number): LayoutRect[] {
  if (items.length === 0) return [];
  if (items.length === 1) {
    const firstItem = items[0]!;
    return [{ x, y, w, h, item: firstItem }];
  }

  const total = items.reduce((s, i) => s + i.amount, 0);
  if (total <= 0) return [];

  const horizontal = w >= h;
  const rects: LayoutRect[] = [];
  let offset = 0;

  if (horizontal) {
    for (const item of items) {
      const slice = (item.amount / total) * w;
      rects.push({ x: x + offset, y, w: slice, h, item });
      offset += slice;
    }
  } else {
    for (const item of items) {
      const slice = (item.amount / total) * h;
      rects.push({ x, y: y + offset, w, h: slice, item });
      offset += slice;
    }
  }

  return rects;
}

function compactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(Math.round(n));
}
