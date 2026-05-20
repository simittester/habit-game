import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';

export function TextField(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        'w-full bg-bg-3 text-text placeholder:text-hint rounded-2xl px-4 py-3.5 text-[15px] outline-none focus:ring-2 focus:ring-accent transition',
        props.className,
      )}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={clsx(
        'w-full bg-bg-3 text-text placeholder:text-hint rounded-2xl px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-accent resize-none transition',
        props.className,
      )}
    />
  );
}

export function Chip({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-4 py-2 rounded-full text-[13px] font-medium transition active:scale-95',
        active ? 'bg-accent text-white' : 'bg-bg-3 text-text',
      )}
    >
      {children}
    </button>
  );
}
