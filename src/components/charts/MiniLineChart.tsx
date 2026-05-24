interface Props {
  values: number[];
  height?: number;
  color?: string;
  fill?: boolean;
  showDot?: boolean;
  showZero?: boolean;
  /** If provided, draws a horizontal dashed target line at this Y value */
  target?: number;
}

// Tiny inline-SVG sparkline. Width is responsive (100%).
export function MiniLineChart({
  values,
  height = 48,
  color = 'var(--color-accent)',
  fill = true,
  showDot = false,
  showZero = false,
  target,
}: Props) {
  if (!values.length) {
    return <div className="text-[11px] text-hint">No data yet.</div>;
  }
  const min = showZero ? Math.min(0, ...values) : Math.min(...values);
  const max = Math.max(...values, target ?? -Infinity);
  const range = Math.max(0.001, max - min);
  const padY = 4;
  const innerH = height - padY * 2;
  const W = 100; // viewBox width; SVG scales

  const points = values.map((v, i) => {
    const x = values.length === 1 ? W / 2 : (i / (values.length - 1)) * W;
    const y = padY + (1 - (v - min) / range) * innerH;
    return [x, y] as const;
  });

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ');
  const area = `${path} L ${points[points.length - 1][0].toFixed(2)} ${height} L ${points[0][0].toFixed(2)} ${height} Z`;
  const last = points[points.length - 1];
  const targetY = target !== undefined ? padY + (1 - (target - min) / range) * innerH : null;
  const gid = `gr-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" className="w-full block" style={{ height }}>
      {fill && (
        <defs>
          <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.32" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {fill && <path d={area} fill={`url(#${gid})`} />}
      {targetY !== null && (
        <line
          x1="0"
          x2={W}
          y1={targetY}
          y2={targetY}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="0.5"
          strokeDasharray="2 2"
        />
      )}
      <path d={path} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {showDot && <circle cx={last[0]} cy={last[1]} r="1.6" fill={color} />}
    </svg>
  );
}
