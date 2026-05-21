import type { WeightLog } from '../types/db';

interface Props {
  logs: WeightLog[];
  width?: number;
  height?: number;
  color?: string;
}

// Simple SVG sparkline of weight over time.
export function WeightSparkline({ logs, width = 280, height = 60, color = 'var(--color-accent)' }: Props) {
  if (logs.length < 2) {
    return <div className="text-[11px] text-hint text-center py-4">Log at least 2 days to see a trend.</div>;
  }

  const values = logs.map((l) => Number(l.weight_kg));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(0.1, max - min);
  const padX = 4;
  const padY = 6;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const points = values.map((v, i) => {
    const x = padX + (i / (values.length - 1)) * innerW;
    const y = padY + (1 - (v - min) / range) * innerH;
    return { x, y };
  });

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = `${path} L ${points[points.length - 1].x.toFixed(1)} ${height - padY} L ${points[0].x.toFixed(1)} ${height - padY} Z`;

  const last = points[points.length - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
      <defs>
        <linearGradient id="weight-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#weight-area)" />
      <path d={path} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x} cy={last.y} r="3" fill={color} />
    </svg>
  );
}
