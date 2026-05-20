import type { ReactNode } from 'react';
import clsx from 'clsx';

interface Props {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-bg-2 rounded-2xl p-4',
        onClick && 'active:opacity-70 cursor-pointer',
        className,
      )}
      style={{ borderRadius: 'var(--radius-card)' }}
    >
      {children}
    </div>
  );
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="px-4 mb-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[11px] tracking-widest text-hint font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
