import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Archive, RotateCcw, Trash2 } from 'lucide-react';
import { Section, Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { listArchivedHabits, unarchiveHabit, deleteHabit } from '../api/habits';
import { format } from 'date-fns';
import { tg } from '../lib/telegram';
import type { Habit } from '../types/db';

export default function ArchivedHabitsScreen() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const q = useQuery({ queryKey: ['habits', 'archived'], queryFn: listArchivedHabits });

  const restoreM = useMutation({
    mutationFn: (id: string) => unarchiveHabit(id),
    onSuccess: () => {
      tg.notify('success');
      qc.invalidateQueries({ queryKey: ['habits'] });
      qc.invalidateQueries({ queryKey: ['habit-streaks'] });
    },
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteHabit(id),
    onSuccess: () => {
      tg.notify('success');
      qc.invalidateQueries({ queryKey: ['habits'] });
    },
  });

  const items = (q.data ?? []) as Habit[];

  return (
    <div className="pb-6">
      <Section title="">
        <div className="mt-2 flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-bg-3 flex items-center justify-center">
            <Archive size={20} className="text-amber-300" />
          </div>
          <div className="flex-1">
            <h1 className="text-[24px] font-bold leading-tight">Archived habits</h1>
            <div className="text-[13px] text-hint">Restore one to bring it back, or delete forever to clear the history.</div>
          </div>
        </div>
      </Section>

      {items.length === 0 ? (
        <EmptyState
          emoji="📭"
          title="Nothing archived."
          hint="When you archive a habit, it lives here. The history stays — you can restore it any time."
          action={
            <button
              onClick={() => navigate('/habits')}
              className="px-5 py-2.5 rounded-full bg-accent text-white text-sm font-semibold"
            >
              Back to habits
            </button>
          }
        />
      ) : (
        <div className="px-4 space-y-2">
          {items.map((h) => (
            <Card key={h.id}>
              <div className="flex items-center gap-3">
                <div className="text-2xl">{h.emoji || '🔥'}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold truncate">{h.name}</div>
                  <div className="text-[11px] text-hint">
                    {h.frequency} · archived {format(new Date(h.updated_at), 'MMM d')}
                  </div>
                </div>
                <button
                  onClick={() => { tg.haptic('medium'); restoreM.mutate(h.id); }}
                  className="flex items-center gap-1 px-3 py-2 rounded-full bg-accent/15 text-accent text-[12px] font-semibold active:opacity-60"
                  aria-label="Restore habit"
                >
                  <RotateCcw size={13} /> Restore
                </button>
                <button
                  onClick={async () => {
                    if (await tg.showConfirm(`Delete "${h.name}" and ALL its history? Cannot be undone.`)) {
                      deleteM.mutate(h.id);
                    }
                  }}
                  className="w-8 h-8 rounded-full bg-bg-3 text-red-400 flex items-center justify-center active:opacity-60"
                  aria-label="Delete forever"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
