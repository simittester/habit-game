import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { tg } from '../../lib/telegram';

interface Props {
  emoji: string;
  title: string;
  /** Right-side summary chip shown next to the header (always visible) */
  summary?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function Panel({ emoji, title, summary, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-bg-2 rounded-2xl mb-2 overflow-hidden">
      <button
        onClick={() => { tg.selection(); setOpen((v) => !v); }}
        className="w-full flex items-center px-4 py-3 text-left active:opacity-80"
      >
        <div className="text-lg mr-2 shrink-0">{emoji}</div>
        <div className="flex-1 font-semibold text-[15px]">{title}</div>
        {summary && (
          <div className="text-[12px] mr-2 text-hint">{summary}</div>
        )}
        <ChevronDown
          size={18}
          className={clsx('text-hint transition-transform shrink-0', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

export function PanelSection({ title, action, children }: { title?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="mt-3 first:mt-0">
      {(title || action) && (
        <div className="flex items-center justify-between mb-2">
          {title && <div className="text-[10px] tracking-wider text-hint uppercase font-semibold">{title}</div>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function SummaryPill({ value, color = 'accent' }: { value: string | number; color?: 'accent' | 'success' | 'warn' | 'danger' }) {
  const map = {
    accent: 'bg-accent/15 text-accent',
    success: 'bg-green-500/15 text-green-400',
    warn: 'bg-amber-400/15 text-amber-300',
    danger: 'bg-red-500/15 text-red-400',
  };
  return (
    <span className={clsx('text-[11px] font-semibold px-2 py-0.5 rounded-full tabular-nums', map[color])}>
      {value}
    </span>
  );
}
