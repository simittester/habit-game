import type { ReactNode } from 'react';

interface Props {
  emoji?: string;
  title: string;
  hint?: string;
  action?: ReactNode;
}

export function EmptyState({ emoji = '🧘', title, hint, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-6 fade-in">
      <div className="text-4xl mb-3">{emoji}</div>
      <h3 className="font-semibold text-base mb-1">{title}</h3>
      {hint && <p className="text-sm text-hint max-w-[260px]">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
