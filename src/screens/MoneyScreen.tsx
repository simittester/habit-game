import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Section, Card } from '../components/Card';
import { Sheet } from '../components/Sheet';
import { TextField } from '../components/Input';
import { listRecentExpenses, addExpense, deleteExpense } from '../api/daily';
import { format } from 'date-fns';
import { tg } from '../lib/telegram';
import { useGate } from '../hooks/useGate';
import type { Expense } from '../types/db';

const CATEGORIES = [
  { key: 'food', label: 'Food', emoji: '🍔' },
  { key: 'transport', label: 'Transport', emoji: '🚗' },
  { key: 'home', label: 'Home', emoji: '🏠' },
  { key: 'fun', label: 'Fun', emoji: '🎉' },
  { key: 'health', label: 'Health', emoji: '💊' },
  { key: 'other', label: 'Other', emoji: '🧾' },
];

export default function MoneyScreen() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [note, setNote] = useState('');
  const { gate } = useGate();

  const q = useQuery({ queryKey: ['expenses', 'recent'], queryFn: () => listRecentExpenses(30) });

  const addM = useMutation({
    mutationFn: () => addExpense({
      amount: Number(amount),
      category,
      note: note.trim() || undefined,
      emoji: CATEGORIES.find((c) => c.key === category)?.emoji,
    }),
    onSuccess: () => { tg.notify('success'); setAmount(''); setNote(''); setOpen(false); qc.invalidateQueries({ queryKey: ['expenses'] }); qc.invalidateQueries({ queryKey: ['score'] }); },
  });

  const delM = useMutation({ mutationFn: deleteExpense, onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }) });

  const items = (q.data ?? []) as Expense[];
  const total = items.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="pb-6">
      <Section title="">
        <div className="mt-2 flex items-start justify-between">
          <div>
            <h1 className="text-[28px] font-bold leading-tight">Money</h1>
            <div className="text-[14px] text-hint">Expenses last 30 days.</div>
          </div>
          <button onClick={gate(() => setOpen(true))} className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center active:scale-95">
            <Plus size={20} />
          </button>
        </div>
      </Section>

      <Section title="">
        <Card>
          <div className="text-[11px] tracking-wider text-hint uppercase">Total spent</div>
          <div className="text-3xl font-bold">${total.toFixed(2)}</div>
          <div className="text-[12px] text-hint mt-1">{items.length} expenses</div>
        </Card>
      </Section>

      <Section title="History">
        {items.length === 0 ? (
          <Card><div className="text-hint text-sm text-center py-4">No expenses yet. Tap + to add.</div></Card>
        ) : (
          <div className="rounded-2xl overflow-hidden">
            {items.map((e) => (
              <div key={e.id} className="bg-bg-2 px-3 py-3 flex items-center gap-3 border-b border-divider last:border-b-0">
                <div className="text-xl">{e.emoji ?? '💸'}</div>
                <div className="flex-1">
                  <div className="text-[15px] font-medium">{e.note || e.category}</div>
                  <div className="text-[12px] text-hint">{format(new Date(e.log_date), 'MMM d')} · {e.category}</div>
                </div>
                <div className="text-[15px] font-semibold text-red-400">-${Number(e.amount).toFixed(2)}</div>
                <button onClick={gate(() => delM.mutate(e.id))} className="text-hint p-1"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Sheet open={open} onClose={() => setOpen(false)} title="New expense">
        <div className="space-y-3 pt-2">
          <div>
            <div className="text-xs text-hint mb-1">Amount</div>
            <TextField autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" type="number" inputMode="decimal" />
          </div>
          <div>
            <div className="text-xs text-hint mb-2 tracking-wider uppercase">Category</div>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
                <button key={c.key} onClick={() => setCategory(c.key)} className={`py-3 rounded-2xl ${category === c.key ? 'bg-accent/20 ring-2 ring-accent' : 'bg-bg-3'}`}>
                  <div className="text-lg">{c.emoji}</div>
                  <div className="text-[11px] mt-1">{c.label}</div>
                </button>
              ))}
            </div>
          </div>
          <TextField value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" />
          <button onClick={() => addM.mutate()} disabled={!amount || addM.isPending} className="w-full py-3 rounded-full bg-accent text-white font-semibold disabled:opacity-50">Add expense</button>
        </div>
      </Sheet>
    </div>
  );
}
