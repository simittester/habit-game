import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { Section } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Sheet } from '../components/Sheet';
import { TextField, TextArea } from '../components/Input';
import { listProjects, createProject, completeProject, deleteProject } from '../api/structure';
import { tg } from '../lib/telegram';
import type { Project } from '../types/db';

export default function ProjectsScreen() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const q = useQuery({ queryKey: ['projects'], queryFn: listProjects });

  const addM = useMutation({
    mutationFn: () => createProject({ name: name.trim(), description: desc.trim() || undefined }),
    onSuccess: () => { tg.notify('success'); setName(''); setDesc(''); setOpen(false); qc.invalidateQueries({ queryKey: ['projects'] }); },
  });
  const doneM = useMutation({ mutationFn: completeProject, onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }) });
  const delM = useMutation({ mutationFn: deleteProject, onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }) });

  const projects = (q.data ?? []) as Project[];

  return (
    <div className="pb-6">
      <Section title="">
        <div className="mt-2 flex items-start justify-between">
          <div>
            <h1 className="text-[28px] font-bold leading-tight">Projects</h1>
            <div className="text-[14px] text-hint">Track bigger outcomes.</div>
          </div>
          <button onClick={() => setOpen(true)} className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center active:scale-95">
            <Plus size={20} />
          </button>
        </div>
      </Section>

      {projects.length === 0 ? (
        <EmptyState emoji="📁" title="No projects yet." hint="Group goals into projects to make progress visible." />
      ) : (
        <div className="px-4 space-y-2">
          {projects.map((p) => (
            <div key={p.id} className="bg-bg-2 rounded-2xl p-4 flex items-center gap-3">
              <div className="text-2xl">{p.emoji}</div>
              <div className="flex-1">
                <div className={`text-[15px] font-semibold ${p.status === 'completed' ? 'line-through opacity-60' : ''}`}>{p.name}</div>
                {p.description && <div className="text-[12px] text-hint">{p.description}</div>}
                <div className="text-[11px] text-hint mt-1 capitalize">{p.status}</div>
              </div>
              {p.status !== 'completed' && (
                <button onClick={() => { tg.haptic('medium'); doneM.mutate(p.id); }} className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center active:opacity-60">
                  <Check size={16} />
                </button>
              )}
              <button onClick={async () => { if (await tg.showConfirm('Delete project?')) delM.mutate(p.id); }} className="text-hint text-xs">✕</button>
            </div>
          ))}
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="New project">
        <div className="space-y-3 pt-2">
          <TextField autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name…" />
          <TextArea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optional)" />
          <button onClick={() => addM.mutate()} disabled={!name.trim() || addM.isPending} className="w-full py-3 rounded-full bg-accent text-white font-semibold disabled:opacity-50">
            {addM.isPending ? 'Saving…' : 'Add project'}
          </button>
        </div>
      </Sheet>
    </div>
  );
}
