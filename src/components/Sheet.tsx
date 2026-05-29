import type { ReactNode, PointerEvent as ReactPointerEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  fullHeight?: boolean;
}

const DISMISS_THRESHOLD_PX = 100;
const DISMISS_VELOCITY_PX_PER_MS = 0.5;

export function Sheet({ open, onClose, title, children, fullHeight }: Props) {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ y: number; t: number } | null>(null);
  const lastMove = useRef<{ y: number; t: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setDragY(0);
      setDragging(false);
      dragStart.current = null;
      lastMove.current = null;
    }
  }, [open]);

  if (!open) return null;

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    dragStart.current = { y: e.clientY, t: performance.now() };
    lastMove.current = { y: e.clientY, t: performance.now() };
    setDragging(true);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    const dy = Math.max(0, e.clientY - dragStart.current.y);
    setDragY(dy);
    lastMove.current = { y: e.clientY, t: performance.now() };
  };

  const onPointerEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    const start = dragStart.current;
    const last = lastMove.current ?? { y: e.clientY, t: performance.now() };
    const dy = Math.max(0, last.y - start.y);
    const dt = Math.max(1, last.t - start.t);
    const velocity = dy / dt; // px/ms
    dragStart.current = null;
    lastMove.current = null;
    setDragging(false);
    if (dy > DISMISS_THRESHOLD_PX || velocity > DISMISS_VELOCITY_PX_PER_MS) {
      onClose();
    } else {
      setDragY(0);
    }
  };

  const transform = dragY > 0 ? `translateY(${dragY}px)` : undefined;
  const transition = dragging ? 'none' : undefined;
  const overlayOpacity = Math.max(0, 1 - dragY / 400);

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-end fade-in">
      <div
        className="absolute inset-0 bg-black/60"
        style={{ opacity: overlayOpacity }}
        onClick={onClose}
      />
      <div
        className={`relative bg-bg-2 rounded-t-3xl ${fullHeight ? 'h-[92%]' : 'max-h-[88%]'} sheet-enter shadow-2xl`}
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
          transform,
          transition,
        }}
      >
        <div
          className="flex justify-center pt-2 pb-1 cursor-grab touch-none select-none"
          style={{ touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        {title && (
          <div className="px-4 py-2 flex items-center justify-between">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button onClick={onClose} className="text-accent text-sm">Done</button>
          </div>
        )}
        <div className="overflow-y-auto max-h-[80vh] px-4 pb-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
