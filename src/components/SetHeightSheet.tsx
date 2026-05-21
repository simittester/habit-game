import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sheet } from './Sheet';
import { TextField } from './Input';
import { upsertSettings } from '../api/settings';
import { tg } from '../lib/telegram';

const MIN_CM = 50;
const MAX_CM = 250;

interface Props { open: boolean; onClose: () => void; initial?: number | null }

export function SetHeightSheet({ open, onClose, initial }: Props) {
  const qc = useQueryClient();
  const [value, setValue] = useState(initial ? String(initial) : '');

  const num = value === '' ? NaN : Number(value);
  const inRange = Number.isFinite(num) && num >= MIN_CM && num <= MAX_CM;
  const showError = value !== '' && !inRange;

  const m = useMutation({
    mutationFn: () => upsertSettings({ height_cm: num }),
    onSuccess: () => {
      tg.notify('success');
      qc.invalidateQueries({ queryKey: ['settings'] });
      onClose();
    },
  });

  return (
    <Sheet open={open} onClose={onClose} title="Your height">
      <div className="space-y-3 pt-2">
        <div>
          <div className="text-xs text-hint mb-1 tracking-wider uppercase">Height (cm)</div>
          <TextField
            autoFocus
            type="number"
            inputMode="numeric"
            min={MIN_CM}
            max={MAX_CM}
            step={1}
            maxLength={3}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`${MIN_CM}–${MAX_CM}`}
            className={showError ? 'ring-2 ring-red-500/60' : ''}
          />
          {showError && (
            <div className="text-[12px] text-red-400 mt-1.5">
              Enter a value between {MIN_CM} and {MAX_CM} cm.
            </div>
          )}
          {!showError && (
            <div className="text-[11px] text-hint mt-1.5">Range: {MIN_CM}–{MAX_CM} cm.</div>
          )}
        </div>
        <button
          onClick={() => m.mutate()}
          disabled={!inRange || m.isPending}
          className="w-full py-3.5 rounded-full bg-accent text-white font-semibold disabled:opacity-50"
        >
          {m.isPending ? 'Saving…' : 'Save'}
        </button>
        <div className="text-[11px] text-hint text-center">Saved once. Edit any time from this card.</div>
      </div>
    </Sheet>
  );
}
