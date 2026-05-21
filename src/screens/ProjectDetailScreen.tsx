import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Pencil, Check, Trash2 } from 'lucide-react';
import { Section, Card } from '../components/Card';
import { Sheet } from '../components/Sheet';
import { TextField, TextArea } from '../components/Input';
import { TaskRow } from '../components/TaskRow';
import { AddTaskSheet } from '../components/AddTaskSheet';
import { ProgressRing } from '../components/ProgressRing';
import {
  listProjects,
  updateProject,
  completeProject,
  deleteProject,
} from '../api/structure';
import { listTasksForProject, toggleTaskDone } from '../api/tasks';
import { tg } from '../lib/telegram';
import type { Project, ProjectStatus, Task } from '../types/db';

const EMOJIS = ['📂', '🎯', '🚀', '💡', '📚', '💪', '🏗️', '🎨', '💼', '🏃'];
const STATUSES: ProjectStatus[] = ['active', 'paused', 'completed'];

export default function ProjectDetailScreen() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);

  const projectsQ = useQuery({ queryKey: ['projects'], queryFn: listProjects });
  const tasksQ = useQuery({ queryKey: ['tasks', 'project', id], queryFn: () => listTasksForProject(id), enabled: Boolean(id) });

  const project = (projectsQ.data ?? []).find((p: Project) => p.id === id);

  const toggleM = useMutation({
    mutationFn: (t: Task) => toggleTaskDone(t),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['score'] });
    },
  });

  const completeProjectM = useMutation({
    mutationFn: () => completeProject(id),
    onSuccess: () => { tg.notify('success'); qc.invalidateQueries({ queryKey: ['projects'] }); },
  });

  const deleteProjectM = useMutation({
    mutationFn: () => deleteProject(id),
    onSuccess: () => { tg.notify('success'); qc.invalidateQueries({ queryKey: ['projects'] }); navigate('/more/projects'); },
  });

  if (projectsQ.isLoading) {
    return <div className="p-6 text-hint text-center">Loading…</div>;
  }
  if (!project) {
    return (
      <div className="p-6 text-center">
        <div className="text-2xl mb-2">🤷</div>
        <div className="text-hint mb-4">Project not found.</div>
        <button onClick={() => navigate('/more/projects')} className="px-5 py-2 rounded-full bg-accent text-white text-sm font-semibold">
          Back to projects
        </button>
      </div>
    );
  }

  const tasks = (tasksQ.data ?? []) as Task[];
  const done = tasks.filter((t) => t.status === 'done').length;
  const total = tasks.length;
  const pct = total === 0 ? 0 : done / total;

  return (
    <div className="pb-6">
      <Section title="">
        <div className="mt-2 flex items-start gap-3">
          <div className="text-4xl">{project.emoji}</div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[24px] font-bold leading-tight truncate">{project.name}</h1>
            {project.description && <div className="text-[14px] text-hint mt-1">{project.description}</div>}
            <div className="text-[12px] text-hint mt-1 capitalize">{project.status}</div>
          </div>
          <button
            onClick={() => { tg.haptic('light'); setEditOpen(true); }}
            className="w-9 h-9 rounded-full bg-bg-3 flex items-center justify-center active:opacity-70"
            aria-label="Edit project"
          >
            <Pencil size={16} />
          </button>
        </div>
      </Section>

      <Section title="">
        <Card>
          <div className="flex items-center gap-4">
            <ProgressRing value={pct} size={56} stroke={5} label={`${Math.round(pct * 100)}%`} />
            <div className="flex-1">
              <div className="text-[15px] font-semibold">{done} of {total} tasks done</div>
              <div className="text-[12px] text-hint">{total === 0 ? 'Add your first task below.' : pct === 1 ? '🎉 All tasks complete!' : 'Keep chipping at it.'}</div>
            </div>
            {project.status !== 'completed' && total > 0 && pct === 1 && (
              <button
                onClick={() => completeProjectM.mutate()}
                className="px-3 py-2 rounded-full bg-green-500/20 text-green-400 text-[12px] font-semibold active:opacity-70"
              >
                <Check size={14} className="inline -mt-0.5 mr-1" /> Mark project done
              </button>
            )}
          </div>
        </Card>
      </Section>

      <Section title="Tasks" action={
        <button onClick={() => setTaskOpen(true)} className="text-accent text-[13px]">
          <Plus size={14} className="inline -mt-0.5" /> Add
        </button>
      }>
        {tasks.length === 0 ? (
          <Card><div className="text-hint text-sm text-center py-4">No tasks yet. Tap + to add the first one.</div></Card>
        ) : (
          <div className="rounded-2xl overflow-hidden">
            {tasks.map((t) => (
              <TaskRow key={t.id} task={t} onToggle={() => toggleM.mutate(t)} />
            ))}
          </div>
        )}
      </Section>

      <Section title="Danger zone">
        <button
          onClick={async () => {
            const ok = await tg.showConfirm(`Delete project "${project.name}" and all linked tasks references? (Tasks become uncategorised, not deleted.)`);
            if (ok) deleteProjectM.mutate();
          }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-bg-2 text-red-400 text-[14px] font-medium active:opacity-60"
        >
          <Trash2 size={15} />
          Delete project
        </button>
      </Section>

      <EditProjectSheet
        key={project.id}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        project={project}
      />

      <AddTaskSheet
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        defaultProjectId={id}
        lockProject
      />
    </div>
  );
}

function EditProjectSheet({ open, onClose, project }: { open: boolean; onClose: () => void; project: Project }) {
  const qc = useQueryClient();
  const [name, setName] = useState(project.name);
  const [desc, setDesc] = useState(project.description ?? '');
  const [emoji, setEmoji] = useState(project.emoji);
  const [status, setStatus] = useState<ProjectStatus>(project.status);

  const saveM = useMutation({
    mutationFn: () => updateProject(project.id, {
      name: name.trim(),
      description: desc.trim() || null,
      emoji,
      status,
    }),
    onSuccess: () => {
      tg.notify('success');
      qc.invalidateQueries({ queryKey: ['projects'] });
      onClose();
    },
  });

  return (
    <Sheet open={open} onClose={onClose} title="Edit project">
      <div className="space-y-3 pt-2">
        <TextField value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name…" />

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

        <button
          onClick={() => saveM.mutate()}
          disabled={!name.trim() || saveM.isPending}
          className="w-full py-3.5 rounded-full bg-accent text-white font-semibold disabled:opacity-50"
        >
          {saveM.isPending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </Sheet>
  );
}
