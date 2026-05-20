import { useState } from 'react';
import { Sheet } from './Sheet';
import { TextField } from './Input';
import { addExpense } from '../api/daily';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tg } from '../lib/telegram';

const CATEGORIES = [
  { key: 'food', label: 'Food', emoji: '🍔' },
  { key: 'transport', label: 'Transport', emoji: '🚗' },
  { key: 'home', label: 'Home', emoji: '🏠' },
  { key: 'fun', label: 'Fun', emoji: '🎉' },
  { key: 'health', label: 'Health', emoji: '💊' },
  { key: 'other', label: 'Other', emoji: '🧾' },
];

interface Props { open: boolean; onClose: () => void }

export function AddExpenseSheet({ open, onClose }: Props) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [note, setNote] = useState('');
  const qc = useQueryClient();

  const m = useMutation({
    mutationFn: () => addExpense({
      amount: Number(amount),
      category,
      note: note.trim() || undefined,
      emoji: CATEGORIES.find((c) => c.key === category)?.emoji,
    }),
    onSuccess: () => {
      tg.notify('success');
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
      qc.invalidateQueries({ queryKey: ['score'] });
      setAmount('');
      setNote('');
      setCategory('food');
      onClose();
    },
  });

  return (
    <Sheet open={open} onClose={onClose} title="New expense">
      <div className="space-y-3 pt-2">
        <div>
          <div className="text-xs text-hint mb-1 tracking-wider uppercase">Amount</div>
          <TextField
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            type="number"
            inputMode="decimal"
          />
        </div>
        <div>
          <div className="text-xs text-hint mb-2 tracking-wider uppercase">Category</div>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => { tg.selection(); setCategory(c.key); }}
                className={`py-3 rounded-2xl ${category === c.key ? 'bg-accent/20 ring-2 ring-accent' : 'bg-bg-3'}`}
              >
                <div className="text-lg">{c.emoji}</div>
                <div className="text-[11px] mt-1">{c.label}</div>
              </button>
            ))}
          </div>
        </div>
        <TextField value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" />
        <button
          onClick={() => m.mutate()}
          disabled={!amount || Number(amount) <= 0 || m.isPending}
          className="w-full py-3.5 rounded-full bg-accent text-white font-semibold disabled:opacity-50"
        >
          {m.isPending ? 'Saving…' : 'Add expense'}
        </button>
      </div>
    </Sheet>
  );
}
