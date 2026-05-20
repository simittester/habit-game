import type { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';
import { tg } from '../lib/telegram';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', block, className, children, onClick, ...rest }: Props) {
  return (
    <button
      onClick={(e) => { tg.haptic('light'); onClick?.(e); }}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-semibold rounded-full transition active:scale-[0.97] active:opacity-80 disabled:opacity-50',
        variant === 'primary' && 'bg-accent text-white',
        variant === 'secondary' && 'bg-bg-3 text-text',
        variant === 'ghost' && 'bg-transparent text-accent',
        variant === 'danger' && 'bg-red-500 text-white',
        size === 'sm' && 'px-3 py-1.5 text-[13px]',
        size === 'md' && 'px-4 py-2.5 text-sm',
        size === 'lg' && 'px-6 py-3.5 text-base',
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function IconButton({ onClick, children, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      onClick={(e) => { tg.haptic('light'); onClick?.(e); }}
      className={clsx(
        'w-9 h-9 rounded-full flex items-center justify-center bg-bg-3 active:opacity-70 transition',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
