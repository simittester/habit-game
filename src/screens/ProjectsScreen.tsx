import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight } from 'lucide-react';
import { Section } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Sheet } from '../components/Sheet';
import { TextField, TextArea } from '../components/Input';
import { listProjects, createProject } from '../api/structure';
import { projectTaskCounts } from '../api/tasks';
import { tg } from '../lib/telegram';
import { useGate } from '../hooks/useGate';
import type { Project } from '../types/db';

const EMOJIS = ['📂', '🎯', '🚀', '💡', '📚', '💪', '🏗️', '🎨', '💼', '🏃'];

export default function ProjectsScreen() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { gate } = useGate();

  const projectsQ = useQuery({ queryKey: ['projects'], queryFn: listProjects });
  const countsQ = useQuery({ queryKey: ['project-counts'], queryFn: projectTaskCounts });

  const projects = (projectsQ.data ?? []) as Project[];
  const counts = countsQ.data ?? new Map<string, { done: number; total: number }>();

  return (
    <div className="pb-6">
      <Section title="">
        <div className="mt-2 flex items-start justify-between">
          <div>
            <h1 className="text-[28px] font-bold leading-tight">Projects</h1>
            <div className="text-[14px] text-hint">Goals with an end. Break each one into tasks underneath.</div>
          </div>
          <button
            onClick={gate(() => { tg.haptic('medium'); setOpen(true); })}
            className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center active:scale-95"
          >
            <Plus size={20} />
          </button>
        </div>
      </Section>

      {projects.length === 0 ? (
        <EmptyState
          emoji="📂"
          title="No projects yet."
          hint="A project is a goal with an end — like 'Launch portfolio', 'Run 10k', 'Move apartments'. Tap one to add tasks under it and watch progress fill in."
        />
      ) : (
        <div className="px-4 space-y-2">
          {projects.map((p) => {
            const c = counts.get(p.id) ?? { done: 0, total: 0 };
            const pct = c.total === 0 ? 0 : c.done / c.total;
            return (
              <button
                key={p.id}
                onClick={() => { tg.haptic('light'); navigate(`/more/projects/${p.id}`); }}
                className="w-full bg-bg-2 rounded-2xl p-4 flex items-center gap-3 active:opacity-70 transition text-left"
              >
                <div className="text-2xl">{p.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className={`text-[15px] font-semibold truncate ${p.status === 'completed' ? 'line-through opacity-60' : ''}`}>{p.name}</div>
                  {p.description && <div className="text-[12px] text-hint truncate">{p.description}</div>}
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1.5 rounded-full bg-bg-4 overflow-hidden max-w-[120px]">
                      <div className="h-full bg-accent transition-all" style={{ width: `${pct * 100}%` }} />
                    </div>
                    <div className="text-[11px] text-hint tabular-nums">{c.done}/{c.total}</div>
                  </div>
                </div>
                <ChevronRight size={18} className="text-hint shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      <NewProjectSheet open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function NewProjectSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [emoji, setEmoji] = useState('📂');

  const m = useMutation({
    mutationFn: () => createProject({
      name: name.trim(),
      description: desc.trim() || undefined,
      emoji,
    }),
    onSuccess: (p) => {
      tg.notify('success');
      qc.invalidateQueries({ queryKey: ['projects'] });
      setName(''); setDesc(''); setEmoji('📂');
      onClose();
      navigate(`/more/projects/${p.id}`);
    },
  });

  return (
    <Sheet open={open} onClose={onClose} title="New project">
      <div className="space-y-3 pt-2">
        <TextField autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name (e.g. Launch portfolio)…" />
        <div>
          <div className="text-xs text-hint mb-2 tracking-wider uppercase">Icon</div>
          <div className="grid grid-cols-5 gap-2">
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
        <TextArea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What does done look like? (optional)" />
        <button
          onClick={() => m.mutate()}
          disabled={!name.trim() || m.isPending}
          className="w-full py-3.5 rounded-full bg-accent text-white font-semibold disabled:opacity-50"
        >
          {m.isPending ? 'Saving…' : 'Create & open'}
        </button>
      </div>
    </Sheet>
  );
}
