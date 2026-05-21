import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sheet } from './Sheet';
import { TextField } from './Input';
import { upsertWeight } from '../api/body';
import { tg } from '../lib/telegram';

interface Props { open: boolean; onClose: () => void; initial?: number }

export function LogWeightSheet({ open, onClose, initial }: Props) {
  const qc = useQueryClient();
  const [value, setValue] = useState(initial ? String(initial) : '');
  const [note, setNote] = useState('');

  const m = useMutation({
    mutationFn: () => upsertWeight(Number(value), note.trim() || undefined),
    onSuccess: () => {
      tg.notify('success');
      qc.invalidateQueries({ queryKey: ['weight'] });
      setValue('');
      setNote('');
      onClose();
    },
  });

  return (
    <Sheet open={open} onClose={onClose} title="Log weight">
      <div className="space-y-3 pt-2">
        <div>
          <div className="text-xs text-hint mb-1 tracking-wider uppercase">Weight (kg)</div>
          <TextField
            autoFocus
            type="number"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. 75.2"
          />
        </div>
        <TextField value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" />
        <button
          onClick={() => m.mutate()}
          disabled={!value || Number(value) <= 0 || Number(value) > 500 || m.isPending}
          className="w-full py-3.5 rounded-full bg-accent text-white font-semibold disabled:opacity-50"
        >
          {m.isPending ? 'Saving…' : 'Save'}
        </button>
        <div className="text-[11px] text-hint text-center">Logged for today. Logging again overwrites today's entry.</div>
      </div>
    </Sheet>
  );
}
