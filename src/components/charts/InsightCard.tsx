import type { ReactNode } from 'react';
import { Lightbulb } from 'lucide-react';

export function InsightCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 bg-accent/10 rounded-2xl px-3 py-2.5 mt-2">
      <Lightbulb size={14} className="text-accent shrink-0 mt-0.5" />
      <div className="text-[12px] text-text/90 leading-snug">{children}</div>
    </div>
  );
}
