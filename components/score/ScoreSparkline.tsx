// Sparkline 12 mois — SVG minimal, ligne forest, min/max étiquetés.

type Point = { date: Date; score: number };

type Props = {
  points: Point[];
  className?: string;
};

const WIDTH = 600;
const HEIGHT = 80;
const PADDING = { top: 12, right: 24, bottom: 16, left: 24 };

export function ScoreSparkline({ points, className }: Props) {
  if (points.length < 2) {
    return (
      <p className="text-sm text-muted-foreground">Pas encore assez d&apos;historique pour afficher une courbe.</p>
    );
  }

  const xs = points.map((p) => p.date.getTime());
  const ys = points.map((p) => p.score);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const yRange = Math.max(1, yMax - yMin);
  const xRange = Math.max(1, xMax - xMin);

  const mapX = (t: number): number =>
    PADDING.left + ((t - xMin) / xRange) * (WIDTH - PADDING.left - PADDING.right);
  const mapY = (v: number): number =>
    HEIGHT - PADDING.bottom - ((v - yMin) / yRange) * (HEIGHT - PADDING.top - PADDING.bottom);

  const coords = points.map((p) => ({ x: mapX(p.date.getTime()), y: mapY(p.score) }));
  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');

  const minIdx = ys.indexOf(yMin);
  const maxIdx = ys.indexOf(yMax);

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={className} role="img" aria-label="Historique sur 12 mois">
      <path d={path} stroke="var(--forest)" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* Marqueur min */}
      {minIdx >= 0 && coords[minIdx] ? (
        <>
          <circle cx={coords[minIdx].x} cy={coords[minIdx].y} r={3} fill="var(--terracotta)" />
          <text
            x={coords[minIdx].x}
            y={coords[minIdx].y + 16}
            textAnchor="middle"
            fontSize={9}
            fill="var(--muted)"
            fontFamily="ui-monospace, monospace"
          >
            {yMin}
          </text>
        </>
      ) : null}

      {/* Marqueur max */}
      {maxIdx >= 0 && coords[maxIdx] ? (
        <>
          <circle cx={coords[maxIdx].x} cy={coords[maxIdx].y} r={3} fill="var(--forest)" />
          <text
            x={coords[maxIdx].x}
            y={coords[maxIdx].y - 8}
            textAnchor="middle"
            fontSize={9}
            fill="var(--muted)"
            fontFamily="ui-monospace, monospace"
          >
            {yMax}
          </text>
        </>
      ) : null}

      {/* Base line */}
      <line
        x1={PADDING.left}
        y1={HEIGHT - PADDING.bottom}
        x2={WIDTH - PADDING.right}
        y2={HEIGHT - PADDING.bottom}
        stroke="var(--bone)"
        strokeWidth={0.5}
      />
    </svg>
  );
}
