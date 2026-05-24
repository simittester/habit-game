interface Props {
  values: number[]; // positive = income, negative = expense
  height?: number;
}

// Two-tone bars: green up for positive, red down for negative.
export function CashFlowChart({ values, height = 48 }: Props) {
  if (!values.length) return <div className="text-[11px] text-hint">No data yet.</div>;
  const absMax = Math.max(1, ...values.map(Math.abs));
  const W = 100;
  const N = values.length;
  const gap = 1.2;
  const barW = (W - gap * (N - 1)) / N;
  const midY = height / 2;

  return (
    <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" className="w-full block" style={{ height }}>
      <line x1="0" x2={W} y1={midY} y2={midY} stroke="rgba(255,255,255,0.08)" strokeWidth="0.4" />
      {values.map((v, i) => {
        const x = i * (barW + gap);
        const h = (Math.abs(v) / absMax) * (height / 2 - 1);
        const y = v >= 0 ? midY - h : midY;
        const color = v === 0 ? 'rgba(255,255,255,0.18)' : v > 0 ? 'var(--color-success)' : 'var(--color-danger)';
        return <rect key={i} x={x} y={y} width={barW} height={Math.max(0.6, h)} rx="0.6" fill={color} opacity="0.9" />;
      })}
    </svg>
  );
}
