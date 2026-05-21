import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { Sheet } from './Sheet';
import { TextField } from './Input';
import { addExpense, deleteExpense, listExpensesForDate } from '../api/daily';
import { tg } from '../lib/telegram';
import type { Expense } from '../types/db';

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
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['expenses', 'today'], queryFn: () => listExpensesForDate(), enabled: open });
  const expenses = (q.data ?? []) as Expense[];

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [note, setNote] = useState('');

  const totalToday = expenses.reduce((s, e) => s + Number(e.amount), 0);

  const addM = useMutation({
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
    },
  });

  const delM = useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });

  return (
    <Sheet open={open} onClose={onClose} title="Expenses today">
      <div className="space-y-4 pt-2">
        {expenses.length > 0 && (
          <>
            <div className="bg-bg-3 rounded-2xl p-3 text-center">
              <div className="text-[11px] text-hint tracking-wider">SPENT TODAY</div>
              <div className="text-2xl font-bold text-red-400">-${totalToday.toFixed(2)}</div>
              <div className="text-[11px] text-hint">{expenses.length} expense{expenses.length === 1 ? '' : 's'}</div>
            </div>
            <div className="rounded-2xl overflow-hidden">
              {expenses.map((e) => (
                <div key={e.id} className="bg-bg-3 px-3 py-2.5 flex items-center gap-3 border-b border-divider last:border-b-0">
                  <div className="text-base">{e.emoji ?? '💸'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] truncate">{e.note || e.category}</div>
                    <div className="text-[11px] text-hint truncate">{e.category}</div>
                  </div>
                  <div className="text-[14px] font-semibold text-red-400">-${Number(e.amount).toFixed(2)}</div>
                  <button
                    onClick={() => { tg.haptic('medium'); delM.mutate(e.id); }}
                    className="text-hint p-1 active:opacity-60"
                    aria-label="Delete expense"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="space-y-3">
          <div className="text-[11px] text-hint tracking-wider uppercase">
            {expenses.length === 0 ? 'Log your first expense' : 'Add another expense'}
          </div>
          <div>
            <div className="text-xs text-hint mb-1">Amount</div>
            <TextField
              autoFocus={expenses.length === 0}
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
            onClick={() => addM.mutate()}
            disabled={!amount || Number(amount) <= 0 || addM.isPending}
            className="w-full py-3.5 rounded-full bg-accent text-white font-semibold disabled:opacity-50"
          >
            {addM.isPending ? 'Saving…' : 'Add expense'}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
