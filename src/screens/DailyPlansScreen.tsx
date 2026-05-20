import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Section, Card } from '../components/Card';
import { TimeBlockRow } from '../components/TimeBlockRow';
import { AddTimeBlockSheet } from '../components/AddTimeBlockSheet';
import { listBlocksForDate, toggleBlock } from '../api/timeblocks';
import { todayIso, format, addDays, subDays } from '../lib/dates';
import { tg } from '../lib/telegram';
import type { TimeBlock } from '../types/db';

export default function DailyPlansScreen() {
  const qc = useQueryClient();
  const [date, setDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const dateIso = date.toISOString().slice(0, 10);

  const q = useQuery({ queryKey: ['blocks', dateIso], queryFn: () => listBlocksForDate(dateIso) });

  const toggleM = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) => toggleBlock(id, completed),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blocks'] }),
  });

  return (
    <div className="pb-6">
      <Section title="">
        <h1 className="text-[28px] font-bold leading-tight mt-2">Daily Plans</h1>
        <div className="text-[14px] text-hint">Plan tomorrow tonight.</div>
      </Section>

      <Section title="">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => { tg.selection(); setDate((d) => subDays(d, 1)); }} className="px-3 py-2 rounded-full bg-bg-3 text-[13px]">←</button>
          <div className="font-semibold text-[15px]">{dateIso === todayIso() ? 'Today' : format(date, 'EEE, MMM d')}</div>
          <button onClick={() => { tg.selection(); setDate((d) => addDays(d, 1)); }} className="px-3 py-2 rounded-full bg-bg-3 text-[13px]">→</button>
        </div>

        {(q.data ?? []).length === 0 ? (
          <Card><div className="text-hint text-sm text-center py-4">No blocks for this day.</div></Card>
        ) : (
          <div className="rounded-2xl overflow-hidden">
            {(q.data ?? []).map((b: TimeBlock) => (
              <TimeBlockRow key={b.id} block={b} onToggle={() => toggleM.mutate({ id: b.id, completed: !b.completed })} />
            ))}
          </div>
        )}

        <button onClick={() => setOpen(true)} className="mt-3 w-full py-3 rounded-full bg-accent text-white font-semibold flex items-center justify-center gap-1">
          <Plus size={16} /> Add time block
        </button>
      </Section>

      <AddTimeBlockSheet open={open} onClose={() => setOpen(false)} date={dateIso} />
    </div>
  );
}
