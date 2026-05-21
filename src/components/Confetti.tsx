import { useEffect, useState } from 'react';

interface Piece {
  id: number;
  color: string;
  cx: number;
  cy: number;
  cr: number;
  size: number;
  delay: number;
}

const COLORS = ['#fbbf24', '#34d399', '#60a5fa', '#f87171', '#a78bfa', '#fb7185'];

// One-shot confetti burst centered on parent. Renders nothing when `burst` is null.
export function Confetti({ burst }: { burst: number | null }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (burst === null) return;
    const list: Piece[] = Array.from({ length: 14 }, (_, i) => {
      const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 50 + Math.random() * 60;
      return {
        id: burst * 100 + i,
        color: COLORS[i % COLORS.length],
        cx: Math.cos(angle) * dist,
        cy: Math.sin(angle) * dist - 10,
        cr: (Math.random() - 0.5) * 540,
        size: 4 + Math.random() * 4,
        delay: Math.random() * 60,
      };
    });
    setPieces(list);
    const t = setTimeout(() => setPieces([]), 1200);
    return () => clearTimeout(t);
  }, [burst]);

  if (pieces.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible flex items-center justify-center">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece absolute rounded-sm"
          style={{
            width: p.size,
            height: p.size,
            background: p.color,
            // CSS vars consumed by the keyframes
            ['--cx' as string]: `${p.cx}px`,
            ['--cy' as string]: `${p.cy}px`,
            ['--cr' as string]: `${p.cr}deg`,
            animationDelay: `${p.delay}ms`,
          }}
        />
      ))}
    </div>
  );
}
