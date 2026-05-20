import { useState } from 'react';
import { Sheet } from './Sheet';
import { TextField, TextArea, Chip } from './Input';
import { createTask } from '../api/tasks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todayIso } from '../lib/dates';
import { tg } from '../lib/telegram';

interface Props { open: boolean; onClose: () => void; defaultPriority?: number }

export function AddTaskSheet({ open, onClose, defaultPriority = 1 }: Props) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState(defaultPriority);
  const [forToday, setForToday] = useState(true);
  const qc = useQueryClient();

  const m = useMutation({
    mutationFn: () => createTask({
      title: title.trim(),
      notes: notes.trim() || null,
      priority,
      scheduled_for: forToday ? todayIso() : null,
    }),
    onSuccess: () => {
      tg.notify('success');
      qc.invalidateQueries();
      setTitle(''); setNotes('');
      onClose();
    },
  });

  return (
    <Sheet open={open} onClose={onClose} title="New task">
      <div className="space-y-3 pt-2">
        <TextField autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title…" />
        <TextArea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" />
        <div className="flex gap-2 flex-wrap">
          <Chip active={priority === 0} onClick={() => setPriority(0)}>Normal</Chip>
          <Chip active={priority === 1} onClick={() => setPriority(1)}>⭐ Priority</Chip>
          <Chip active={priority === 2} onClick={() => setPriority(2)}>🔥 Urgent</Chip>
        </div>
        <div className="flex gap-2">
          <Chip active={forToday} onClick={() => setForToday(true)}>Today</Chip>
          <Chip active={!forToday} onClick={() => setForToday(false)}>Someday</Chip>
        </div>
        <button
          onClick={() => m.mutate()}
          disabled={!title.trim() || m.isPending}
          className="w-full py-3.5 rounded-full bg-accent text-white font-semibold disabled:opacity-50"
        >
          {m.isPending ? 'Saving…' : 'Add task'}
        </button>
      </div>
    </Sheet>
  );
}
