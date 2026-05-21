import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Plus, Check, Trash2 } from 'lucide-react';
import { Section } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Sheet } from '../components/Sheet';
import { TextField, TextArea } from '../components/Input';
import { listProjects, createProject, completeProject, deleteProject, updateProject } from '../api/structure';
import { tg } from '../lib/telegram';
import type { Project, ProjectStatus } from '../types/db';

const EMOJIS = ['📂', '🎯', '🚀', '💡', '📚', '💪', '🏗️', '🎨', '💼', '🏃'];
const STATUSES: ProjectStatus[] = ['active', 'paused', 'completed'];

interface SheetState { open: boolean; project: Project | null }

export default function ProjectsScreen() {
  const qc = useQueryClient();
  const [sheet, setSheet] = useState<SheetState>({ open: false, project: null });

  const q = useQuery({ queryKey: ['projects'], queryFn: listProjects });
  const doneM = useMutation({ mutationFn: completeProject, onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }) });
  const delM = useMutation({ mutationFn: deleteProject, onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }) });

  const projects = (q.data ?? []) as Project[];

  return (
    <div className="pb-6">
      <Section title="">
        <div className="mt-2 flex items-start justify-between">
          <div>
            <h1 className="text-[28px] font-bold leading-tight">Projects</h1>
            <div className="text-[14px] text-hint">Track outcomes that take more than one task.</div>
          </div>
          <button
            onClick={() => { tg.haptic('medium'); setSheet({ open: true, project: null }); }}
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
          hint="A project is a goal with an end — like 'Launch portfolio', 'Run 10k', 'Clean garage'. Tap + to create one."
        />
      ) : (
        <div className="px-4 space-y-2">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => { tg.haptic('light'); setSheet({ open: true, project: p }); }}
              className="w-full bg-bg-2 rounded-2xl p-4 flex items-center gap-3 active:opacity-70 transition text-left"
            >
              <div className="text-2xl">{p.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className={`text-[15px] font-semibold truncate ${p.status === 'completed' ? 'line-through opacity-60' : ''}`}>{p.name}</div>
                {p.description && <div className="text-[12px] text-hint truncate">{p.description}</div>}
                <div className="text-[11px] text-hint mt-1 capitalize">{p.status}</div>
              </div>
              {p.status !== 'completed' && (
                <div
                  role="button"
                  onClick={(e) => { e.stopPropagation(); tg.haptic('medium'); doneM.mutate(p.id); }}
                  className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center active:opacity-60"
                >
                  <Check size={16} />
                </div>
              )}
              <div
                role="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  if (await tg.showConfirm(`Delete project "${p.name}"?`)) delM.mutate(p.id);
                }}
                className="text-hint w-7 h-7 flex items-center justify-center active:opacity-60"
              >
                <Trash2 size={14} />
              </div>
            </button>
          ))}
        </div>
      )}

      <ProjectSheet
        key={sheet.project?.id ?? 'new'}
        open={sheet.open}
        onClose={() => setSheet({ open: false, project: null })}
        project={sheet.project}
      />
    </div>
  );
}

function ProjectSheet({ open, onClose, project }: { open: boolean; onClose: () => void; project: Project | null }) {
  const qc = useQueryClient();
  const isEdit = Boolean(project);
  const [name, setName] = useState(project?.name ?? '');
  const [desc, setDesc] = useState(project?.description ?? '');
  const [emoji, setEmoji] = useState(project?.emoji ?? '📂');
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? 'active');

  useEffect(() => {
    setName(project?.name ?? '');
    setDesc(project?.description ?? '');
    setEmoji(project?.emoji ?? '📂');
    setStatus(project?.status ?? 'active');
  }, [project?.id]);

  const saveM = useMutation({
    mutationFn: async () => {
      if (project) {
        await updateProject(project.id, {
          name: name.trim(),
          description: desc.trim() || null,
          emoji,
          status,
        });
      } else {
        await createProject({ name: name.trim(), description: desc.trim() || undefined, emoji });
      }
    },
    onSuccess: () => {
      tg.notify('success');
      qc.invalidateQueries({ queryKey: ['projects'] });
      onClose();
    },
  });

  return (
    <Sheet open={open} onClose={onClose} title={isEdit ? 'Edit project' : 'New project'}>
      <div className="space-y-3 pt-2">
        <TextField autoFocus={!isEdit} value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name…" />

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

        <TextArea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What's the outcome? (optional)" />

        {isEdit && (
          <div>
            <div className="text-xs text-hint mb-2 tracking-wider uppercase">Status</div>
            <div className="flex gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`flex-1 py-2 rounded-full text-[13px] capitalize ${status === s ? 'bg-accent text-white' : 'bg-bg-3'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => saveM.mutate()}
          disabled={!name.trim() || saveM.isPending}
          className="w-full py-3.5 rounded-full bg-accent text-white font-semibold disabled:opacity-50"
        >
          {saveM.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add project'}
        </button>
      </div>
    </Sheet>
  );
}
