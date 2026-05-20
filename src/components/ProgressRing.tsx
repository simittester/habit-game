interface Props {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  label?: string;
  color?: string;
  trackColor?: string;
}

export function ProgressRing({
  value,
  size = 56,
  stroke = 5,
  label,
  color = 'var(--color-accent)',
  trackColor = 'rgba(255,255,255,0.08)',
}: Props) {
  const v = Math.max(0, Math.min(1, value || 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - v)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(.2,.8,.2,1)' }}
      />
      {label && (
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="var(--color-text)"
          fontSize={size > 80 ? 16 : 12}
          fontWeight={600}
        >
          {label}
        </text>
      )}
    </svg>
  );
}

export function ScoreGauge({ score }: { score: number }) {
  const angle = Math.max(0, Math.min(180, (score / 100) * 180));
  const r = 56;
  const cx = 70;
  const cy = 70;
  const startX = cx - r;
  const startY = cy;
  const rad = (angle - 180) * (Math.PI / 180);
  const endX = cx + r * Math.cos(rad);
  const endY = cy + r * Math.sin(rad);
  const large = angle > 180 ? 1 : 0;
  const color =
    score >= 70 ? 'var(--color-success)' :
    score >= 40 ? 'var(--color-warn)' :
    'var(--color-danger)';

  return (
    <svg viewBox="0 0 140 90" width="140" height="90">
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} stroke="rgba(255,255,255,0.08)" strokeWidth="10" fill="none" strokeLinecap="round" />
      <path
        d={`M ${startX} ${startY} A ${r} ${r} 0 ${large} 1 ${endX} ${endY}`}
        stroke={color}
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
        style={{ transition: 'all 700ms cubic-bezier(.2,.8,.2,1)' }}
      />
      <text x="70" y="65" textAnchor="middle" fill="var(--color-text)" fontSize="22" fontWeight="700">
        {score}
      </text>
      <text x="70" y="82" textAnchor="middle" fill="var(--color-hint)" fontSize="9" letterSpacing="2">
        SCORE
      </text>
    </svg>
  );
}
