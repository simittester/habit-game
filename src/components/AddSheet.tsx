import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Sheet } from './Sheet';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createInboxItem } from '../api/inbox';
import { createTask } from '../api/tasks';
import { tg } from '../lib/telegram';

export function GlobalAddButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => { tg.haptic('medium'); setOpen(true); }}
        className="fixed right-4 z-30 w-14 h-14 rounded-full bg-accent text-white flex items-center justify-center shadow-lg active:scale-95 transition"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}
        aria-label="Add"
      >
        <Plus size={26} strokeWidth={2.2} />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Capture something">
        <QuickCaptureForm onDone={() => setOpen(false)} />
      </Sheet>
    </>
  );
}

function QuickCaptureForm({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState('');
  const [kind, setKind] = useState<'inbox' | 'task'>('inbox');
  const qc = useQueryClient();

  const m = useMutation({
    mutationFn: async () => {
      const t = text.trim();
      if (!t) return;
      if (kind === 'inbox') await createInboxItem(t);
      else await createTask({ title: t, priority: 1, scheduled_for: new Date().toISOString().slice(0, 10) });
    },
    onSuccess: () => {
      tg.notify('success');
      qc.invalidateQueries();
      setText('');
      onDone();
    },
  });

  return (
    <div className="space-y-3 pt-2">
      <div className="flex gap-2">
        <button
          onClick={() => setKind('inbox')}
          className={`flex-1 py-2 rounded-full text-sm font-medium ${kind === 'inbox' ? 'bg-accent text-white' : 'bg-bg-3 text-text'}`}
        >
          📥 Inbox
        </button>
        <button
          onClick={() => setKind('task')}
          className={`flex-1 py-2 rounded-full text-sm font-medium ${kind === 'task' ? 'bg-accent text-white' : 'bg-bg-3 text-text'}`}
        >
          ⭐ Top Priority
        </button>
      </div>
      <textarea
        autoFocus
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={kind === 'inbox' ? "What's on your mind?" : 'A task that matters today…'}
        className="w-full bg-bg-3 rounded-2xl px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-accent resize-none"
      />
      <button
        onClick={() => m.mutate()}
        disabled={!text.trim() || m.isPending}
        className="w-full py-3 rounded-full bg-accent text-white font-semibold disabled:opacity-50"
      >
        {m.isPending ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}
