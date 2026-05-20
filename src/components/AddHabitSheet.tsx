import { useState } from 'react';
import { Sheet } from './Sheet';
import { Chip, TextField } from './Input';
import { createHabit } from '../api/habits';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tg } from '../lib/telegram';
import type { Frequency } from '../types/db';

const EMOJIS = ['🔥', '💧', '🏃', '📚', '🧘', '💪', '🥗', '😴', '🧠', '✍️', '🎵', '☀️'];
const SUGGESTIONS = ['Drink 8 glasses of water', 'Morning walk', 'Read 10 pages', 'Meditate', 'No phone before bed', 'Workout'];

interface Props { open: boolean; onClose: () => void }

export function AddHabitSheet({ open, onClose }: Props) {
  const [name, setName] = useState('');
  const [freq, setFreq] = useState<Frequency>('daily');
  const [emoji, setEmoji] = useState('🔥');
  const qc = useQueryClient();

  const m = useMutation({
    mutationFn: () => createHabit({ name: name.trim(), frequency: freq, emoji }),
    onSuccess: () => {
      tg.notify('success');
      qc.invalidateQueries({ queryKey: ['habits'] });
      qc.invalidateQueries({ queryKey: ['today'] });
      setName('');
      onClose();
    },
  });

  return (
    <Sheet open={open} onClose={onClose} title="New habit">
      <div className="space-y-4 pt-2">
        <TextField
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Habit name…"
        />

        <div className="flex gap-2">
          <Chip active={freq === 'daily'} onClick={() => setFreq('daily')}>Daily</Chip>
          <Chip active={freq === 'weekdays'} onClick={() => setFreq('weekdays')}>Weekdays</Chip>
          <Chip active={freq === 'weekends'} onClick={() => setFreq('weekends')}>Weekends</Chip>
        </div>

        <div>
          <div className="text-xs text-hint mb-2 tracking-wider uppercase">Icon</div>
          <div className="grid grid-cols-6 gap-2">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => { tg.selection(); setEmoji(e); }}
                className={`text-xl py-2 rounded-xl ${emoji === e ? 'bg-accent/20 ring-2 ring-accent' : 'bg-bg-3'}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {!name && (
          <div>
            <div className="text-xs text-hint mb-2 tracking-wider uppercase">Suggestions</div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => { tg.selection(); setName(s); }}
                  className="px-3 py-2 rounded-full bg-bg-3 text-[13px]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => m.mutate()}
          disabled={!name.trim() || m.isPending}
          className="w-full py-3.5 rounded-full bg-accent text-white font-semibold disabled:opacity-50"
        >
          {m.isPending ? 'Saving…' : 'Add habit'}
        </button>
      </div>
    </Sheet>
  );
}
