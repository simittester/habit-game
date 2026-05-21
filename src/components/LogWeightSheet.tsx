import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sheet } from './Sheet';
import { TextField } from './Input';
import { upsertWeight } from '../api/body';
import { tg } from '../lib/telegram';

const MIN_KG = 20;
const MAX_KG = 300;

interface Props { open: boolean; onClose: () => void; initial?: number }

export function LogWeightSheet({ open, onClose, initial }: Props) {
  const qc = useQueryClient();
  const [value, setValue] = useState(initial ? String(initial) : '');
  const [note, setNote] = useState('');

  const num = value === '' ? NaN : Number(value);
  const inRange = Number.isFinite(num) && num >= MIN_KG && num <= MAX_KG;
  const showError = value !== '' && !inRange;

  const m = useMutation({
    mutationFn: () => upsertWeight(num, note.trim() || undefined),
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
            min={MIN_KG}
            max={MAX_KG}
            step={0.1}
            maxLength={5}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`${MIN_KG}–${MAX_KG}`}
            className={showError ? 'ring-2 ring-red-500/60' : ''}
          />
          {showError && (
            <div className="text-[12px] text-red-400 mt-1.5">
              Enter a value between {MIN_KG} and {MAX_KG} kg.
            </div>
          )}
          {!showError && (
            <div className="text-[11px] text-hint mt-1.5">Range: {MIN_KG}–{MAX_KG} kg.</div>
          )}
        </div>
        <TextField value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" maxLength={120} />
        <button
          onClick={() => m.mutate()}
          disabled={!inRange || m.isPending}
          className="w-full py-3.5 rounded-full bg-accent text-white font-semibold disabled:opacity-50"
        >
          {m.isPending ? 'Saving…' : 'Save'}
        </button>
        <div className="text-[11px] text-hint text-center">Logged for today. Logging again overwrites today's entry.</div>
      </div>
    </Sheet>
  );
}
