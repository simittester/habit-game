interface Props {
  values: number[];
  height?: number;
  color?: string;
  /** Optional second series rendered as the "filled" portion stacked under the main bar */
  completedValues?: number[];
  showZero?: boolean;
}

// Stacked bar chart: main bar = planned/total, inner bar = completed/done.
// If only `values` provided, simple solid bars.
export function MiniBarChart({
  values,
  height = 48,
  color = 'var(--color-accent)',
  completedValues,
  showZero = true,
}: Props) {
  if (!values.length) return <div className="text-[11px] text-hint">No data yet.</div>;
  const max = Math.max(1, ...(showZero ? [0, ...values] : values));
  const W = 100;
  const N = values.length;
  const gap = N > 14 ? 0.6 : 1.2;
  const barW = (W - gap * (N - 1)) / N;

  return (
    <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" className="w-full block" style={{ height }}>
      {values.map((v, i) => {
        const x = i * (barW + gap);
        const fullH = (v / max) * (height - 4);
        const y = height - fullH;
        const completed = completedValues?.[i] ?? 0;
        const completedH = (completed / max) * (height - 4);
        const completedY = height - completedH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={Math.max(0.6, fullH)} rx="0.8" fill={color} opacity="0.45" />
            {completed > 0 && (
              <rect x={x} y={completedY} width={barW} height={Math.max(0.6, completedH)} rx="0.8" fill="var(--color-success)" opacity="0.85" />
            )}
          </g>
        );
      })}
    </svg>
  );
}
