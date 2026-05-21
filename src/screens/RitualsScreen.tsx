import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { Section } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Sheet } from '../components/Sheet';
import { TextField } from '../components/Input';
import { listRituals, createRitual, updateRitual, deleteRitual } from '../api/structure';
import { tg } from '../lib/telegram';
import type { Ritual, RitualKind } from '../types/db';

type RitualStep = { id: string; text: string };
const mkSteps = (texts: string[]): RitualStep[] => texts.map((t, i) => ({ id: `s${i}`, text: t }));
const TEMPLATES: Array<{ kind: RitualKind; name: string; steps: RitualStep[] }> = [
  { kind: 'morning', name: 'Morning kickstart', steps: mkSteps(['Drink water', 'Write 3 priorities', '5-minute stretch']) },
  { kind: 'evening', name: 'Evening shutdown', steps: mkSteps(['Review what got done', 'Plan tomorrow', 'Phone away by 22:00']) },
  { kind: 'weekly_review', name: 'Weekly review', steps: mkSteps(['Clear inbox', 'Review projects', 'Pick a focus for next week']) },
];

export default function RitualsScreen() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<RitualKind>('morning');

  const q = useQuery({ queryKey: ['rituals'], queryFn: listRituals });

  const addM = useMutation({
    mutationFn: () => createRitual({
      kind,
      name: name.trim(),
      steps: [],
    }),
    onSuccess: () => { tg.notify('success'); setName(''); setOpen(false); qc.invalidateQueries({ queryKey: ['rituals'] }); },
  });

  const completeM = useMutation({
    mutationFn: (r: Ritual) => updateRitual(r.id, {
      last_completed_at: new Date().toISOString(),
      streak: (r.streak ?? 0) + 1,
    }),
    onSuccess: () => { tg.notify('success'); qc.invalidateQueries({ queryKey: ['rituals'] }); },
  });

  const delM = useMutation({ mutationFn: deleteRitual, onSuccess: () => qc.invalidateQueries({ queryKey: ['rituals'] }) });

  const items = (q.data ?? []) as Ritual[];

  return (
    <div className="pb-6">
      <Section title="">
        <div className="mt-2 flex items-start justify-between">
          <div>
            <h1 className="text-[28px] font-bold leading-tight">Rituals</h1>
            <div className="text-[14px] text-hint">Repeatable routines you do on autopilot — morning kickstart, evening shutdown, weekly review.</div>
          </div>
          <button onClick={() => setOpen(true)} className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center active:scale-95">
            <Plus size={20} />
          </button>
        </div>
      </Section>

      {items.length === 0 ? (
        <>
          <EmptyState
            emoji="🔁"
            title="No rituals yet."
            hint="A ritual is a short checklist you run on autopilot (e.g. before bed, every Sunday). Start with a tested template:"
          />
          <div className="px-4 space-y-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.name}
                onClick={() => createRitual(t).then(() => qc.invalidateQueries({ queryKey: ['rituals'] }))}
                className="w-full bg-bg-2 rounded-2xl p-4 text-left active:opacity-70"
              >
                <div className="font-semibold text-[15px]">{t.name}</div>
                <div className="text-[12px] text-hint capitalize">{t.kind.replace('_', ' ')} · {t.steps.length} steps</div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="px-4 space-y-2">
          {items.map((r) => (
            <div key={r.id} className="bg-bg-2 rounded-2xl p-4 flex items-center gap-3">
              <div className="flex-1">
                <div className="font-semibold text-[15px]">{r.name}</div>
                <div className="text-[12px] text-hint capitalize">{r.kind.replace('_', ' ')} · streak {r.streak ?? 0}</div>
              </div>
              <button onClick={() => completeM.mutate(r)} className="w-9 h-9 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center active:opacity-60">
                <Check size={18} />
              </button>
              <button onClick={async () => { if (await tg.showConfirm('Delete ritual?')) delM.mutate(r.id); }} className="text-hint text-xs">✕</button>
            </div>
          ))}
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="New ritual">
        <div className="space-y-3 pt-2">
          <TextField autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ritual name…" />
          <div className="flex gap-2 flex-wrap">
            {(['morning', 'evening', 'weekly_review', 'custom'] as RitualKind[]).map((k) => (
              <button key={k} onClick={() => setKind(k)} className={`px-3 py-2 rounded-full text-[13px] capitalize ${kind === k ? 'bg-accent text-white' : 'bg-bg-3'}`}>
                {k.replace('_', ' ')}
              </button>
            ))}
          </div>
          <button onClick={() => addM.mutate()} disabled={!name.trim()} className="w-full py-3 rounded-full bg-accent text-white font-semibold disabled:opacity-50">Add ritual</button>
        </div>
      </Sheet>
    </div>
  );
}
