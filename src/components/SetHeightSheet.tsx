import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sheet } from './Sheet';
import { TextField } from './Input';
import { upsertSettings } from '../api/settings';
import { tg } from '../lib/telegram';

interface Props { open: boolean; onClose: () => void; initial?: number | null }

export function SetHeightSheet({ open, onClose, initial }: Props) {
  const qc = useQueryClient();
  const [value, setValue] = useState(initial ? String(initial) : '');

  const m = useMutation({
    mutationFn: () => upsertSettings({ height_cm: Number(value) }),
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
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. 175"
          />
        </div>
        <button
          onClick={() => m.mutate()}
          disabled={!value || Number(value) <= 0 || Number(value) > 280 || m.isPending}
          className="w-full py-3.5 rounded-full bg-accent text-white font-semibold disabled:opacity-50"
        >
          {m.isPending ? 'Saving…' : 'Save'}
        </button>
        <div className="text-[11px] text-hint text-center">Saved once. Edit any time from this card.</div>
      </div>
    </Sheet>
  );
}
