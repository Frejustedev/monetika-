// Projection SVG — ligne simple forest pour l'état actuel → cible sur 12 mois.
// Points historiques (contributions réelles) superposés comme petits cercles.

type Point = { date: Date; amount: number };

type Props = {
  createdAt: Date;
  targetDate: Date;
  startingAmount: number;
  targetAmount: number;
  currentAmount: number;
  contributions: Point[];
  className?: string;
};

const WIDTH = 600;
const HEIGHT = 180;
const PADDING = { top: 12, right: 12, bottom: 24, left: 12 };

export function GoalProjection({
  createdAt,
  targetDate,
  startingAmount,
  targetAmount,
  currentAmount,
  contributions,
  className,
}: Props) {
  const now = new Date();
  const xMin = createdAt.getTime();
  const xMax = targetDate.getTime();
  const xRange = Math.max(1, xMax - xMin);

  const yMin = Math.min(startingAmount, ...contributions.map((c) => c.amount), 0);
  const yMax = Math.max(targetAmount, currentAmount);
  const yRange = Math.max(1, yMax - yMin);

  const mapX = (t: number): number =>
    PADDING.left + ((t - xMin) / xRange) * (WIDTH - PADDING.left - PADDING.right);
  const mapY = (v: number): number =>
    HEIGHT - PADDING.bottom - ((v - yMin) / yRange) * (HEIGHT - PADDING.top - PADDING.bottom);

  const projectionX1 = mapX(xMin);
  const projectionY1 = mapY(startingAmount);
  const projectionX2 = mapX(xMax);
  const projectionY2 = mapY(targetAmount);

  // Ligne actuelle : de l'origine au point "aujourd'hui" avec currentAmount.
  const actualPoints = [
    { x: mapX(xMin), y: mapY(startingAmount) },
    ...contributions.map((c) => ({ x: mapX(c.date.getTime()), y: mapY(c.amount) })),
    { x: mapX(Math.min(now.getTime(), xMax)), y: mapY(currentAmount) },
  ].sort((a, b) => a.x - b.x);

  const actualPath = actualPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={className}
      role="img"
      aria-label="Projection de l'objectif"
    >
      {/* Ligne de projection cible (pointillée ocre) */}
      <line
        x1={projectionX1}
        y1={projectionY1}
        x2={projectionX2}
        y2={projectionY2}
        stroke="var(--ochre)"
        strokeWidth={1}
        strokeDasharray="3 4"
        opacity={0.5}
      />

      {/* Ligne actuelle — forest, pleine */}
      <path d={actualPath} stroke="var(--forest)" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* Points de contribution */}
      {contributions.map((c, i) => (
        <circle
          key={i}
          cx={mapX(c.date.getTime())}
          cy={mapY(c.amount)}
          r={3}
          fill="var(--forest)"
        />
      ))}

      {/* Point actuel — pastille ocre */}
      <circle
        cx={mapX(Math.min(now.getTime(), xMax))}
        cy={mapY(currentAmount)}
        r={4.5}
        fill="var(--ochre)"
        stroke="var(--paper)"
        strokeWidth={1.5}
      />

      {/* Cible — pastille ink */}
      <circle cx={projectionX2} cy={projectionY2} r={3.5} fill="var(--ink)" />

      {/* Ligne de base */}
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
