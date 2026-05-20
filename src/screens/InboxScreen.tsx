import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { Section } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Sheet } from '../components/Sheet';
import { TextArea } from '../components/Input';
import { listInbox, createInboxItem, deleteInboxItem, markInboxProcessed } from '../api/inbox';
import { createTask } from '../api/tasks';
import { GlobalAddButton } from '../components/AddSheet';
import { tg } from '../lib/telegram';
import { format } from 'date-fns';
import type { InboxItem } from '../types/db';

export default function InboxScreen() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  const q = useQuery({ queryKey: ['inbox'], queryFn: listInbox });

  const addM = useMutation({
    mutationFn: () => createInboxItem(text.trim()),
    onSuccess: () => { tg.notify('success'); setText(''); setOpen(false); qc.invalidateQueries({ queryKey: ['inbox'] }); },
  });

  const delM = useMutation({
    mutationFn: (id: string) => deleteInboxItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inbox'] }),
  });

  const promoteM = useMutation({
    mutationFn: async (item: InboxItem) => {
      const task = await createTask({ title: item.content, priority: 1 });
      await markInboxProcessed(item.id, { kind: 'task', id: task.id });
    },
    onSuccess: () => { tg.notify('success'); qc.invalidateQueries(); },
  });

  const items = q.data ?? [];
  const open_items = items.filter((i) => !i.processed);

  return (
    <div className="pb-6">
      <Section title="">
        <div className="px-0 mt-2 flex items-start justify-between">
          <div>
            <h1 className="text-[28px] font-bold leading-tight">Inbox</h1>
            <div className="text-[14px] text-hint">{open_items.length ? `${open_items.length} captured` : 'Your mind is clear.'}</div>
          </div>
          <button
            onClick={() => { tg.haptic('medium'); setOpen(true); }}
            className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center active:scale-95"
          >
            <Plus size={20} />
          </button>
        </div>
      </Section>

      {items.length === 0 ? (
        <EmptyState
          emoji="🧘"
          title="Your mind is clear."
          hint="Capture anything here — tasks, ideas, reminders, notes."
          action={
            <button
              onClick={() => setOpen(true)}
              className="px-5 py-2.5 rounded-full bg-accent text-white text-sm font-semibold"
            >
              Capture something
            </button>
          }
        />
      ) : (
        <div className="px-4 space-y-2">
          {items.map((i) => (
            <div key={i.id} className={`bg-bg-2 rounded-2xl p-3 ${i.processed ? 'opacity-50' : ''}`}>
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <div className="text-[15px]">{i.content}</div>
                  <div className="text-[11px] text-hint mt-1">{format(new Date(i.created_at), 'MMM d, HH:mm')}{i.processed ? ' · processed' : ''}</div>
                </div>
                {!i.processed && (
                  <button
                    onClick={() => promoteM.mutate(i)}
                    className="text-accent p-1 active:opacity-60"
                    aria-label="Promote to task"
                  >
                    <ArrowRight size={18} />
                  </button>
                )}
                <button
                  onClick={() => { tg.haptic('medium'); delM.mutate(i.id); }}
                  className="text-hint p-1 active:opacity-60"
                  aria-label="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Capture">
        <div className="space-y-3 pt-2">
          <TextArea autoFocus rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="What's on your mind?" />
          <button
            onClick={() => addM.mutate()}
            disabled={!text.trim() || addM.isPending}
            className="w-full py-3 rounded-full bg-accent text-white font-semibold disabled:opacity-50"
          >
            {addM.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </Sheet>

      <GlobalAddButton />
    </div>
  );
}
