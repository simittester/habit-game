import { useState } from 'react';
import { Sheet } from './Sheet';
import { TextField } from './Input';
import { createTimeBlock } from '../api/timeblocks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todayIso } from '../lib/dates';
import { tg } from '../lib/telegram';

interface Props { open: boolean; onClose: () => void; date?: string }

export function AddTimeBlockSheet({ open, onClose, date = todayIso() }: Props) {
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('09:00');
  const [duration, setDuration] = useState(30);
  const qc = useQueryClient();

  const m = useMutation({
    mutationFn: () => createTimeBlock({
      block_date: date,
      start_time: start + ':00',
      duration_minutes: duration,
      title: title.trim(),
    }),
    onSuccess: () => {
      tg.notify('success');
      qc.invalidateQueries({ queryKey: ['blocks', date] });
      setTitle('');
      onClose();
    },
  });

  return (
    <Sheet open={open} onClose={onClose} title="New time block">
      <div className="space-y-3 pt-2">
        <TextField autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Block title…" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-hint mb-1">Start</div>
            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full bg-bg-3 rounded-2xl px-4 py-3 text-[15px] outline-none"
            />
          </div>
          <div>
            <div className="text-xs text-hint mb-1">Duration (min)</div>
            <input
              type="number"
              min={5}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full bg-bg-3 rounded-2xl px-4 py-3 text-[15px] outline-none"
            />
          </div>
        </div>
        <button
          onClick={() => m.mutate()}
          disabled={!title.trim() || m.isPending}
          className="w-full py-3.5 rounded-full bg-accent text-white font-semibold disabled:opacity-50"
        >
          {m.isPending ? 'Saving…' : 'Add block'}
        </button>
      </div>
    </Sheet>
  );
}
