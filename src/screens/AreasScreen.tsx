import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Section } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Sheet } from '../components/Sheet';
import { TextField } from '../components/Input';
import { listAreas, createArea, deleteArea } from '../api/structure';
import { tg } from '../lib/telegram';
import type { Area } from '../types/db';

const EMOJIS = ['📁', '❤️', '💼', '💰', '🧠', '🏠', '🏃', '👨‍👩‍👧', '🎨', '✈️'];

export default function AreasScreen() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📁');

  const q = useQuery({ queryKey: ['areas'], queryFn: listAreas });

  const addM = useMutation({
    mutationFn: () => createArea({ name: name.trim(), emoji }),
    onSuccess: () => { tg.notify('success'); setName(''); setOpen(false); qc.invalidateQueries({ queryKey: ['areas'] }); },
  });
  const delM = useMutation({ mutationFn: deleteArea, onSuccess: () => qc.invalidateQueries({ queryKey: ['areas'] }) });

  const items = (q.data ?? []) as Area[];

  return (
    <div className="pb-6">
      <Section title="">
        <div className="mt-2 flex items-start justify-between">
          <div>
            <h1 className="text-[28px] font-bold leading-tight">Areas</h1>
            <div className="text-[14px] text-hint">The big buckets of your life. Group projects, habits, and tasks under them.</div>
          </div>
          <button onClick={() => setOpen(true)} className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center active:scale-95">
            <Plus size={20} />
          </button>
        </div>
      </Section>

      {items.length === 0 ? (
        <EmptyState
          emoji="🗂️"
          title="No areas yet."
          hint="Think Health, Work, Family, Money, Learning. Areas are evergreen — they don't end, you just keep them healthy. Used to group your projects and habits."
        />
      ) : (
        <div className="px-4 grid grid-cols-2 gap-3">
          {items.map((a) => (
            <div key={a.id} className="bg-bg-2 rounded-2xl p-4">
              <div className="text-2xl mb-2">{a.emoji}</div>
              <div className="font-semibold text-[15px]">{a.name}</div>
              <button onClick={async () => { if (await tg.showConfirm('Delete area?')) delM.mutate(a.id); }} className="text-hint text-[11px] mt-2">Delete</button>
            </div>
          ))}
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="New area">
        <div className="space-y-3 pt-2">
          <TextField autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Area name (e.g. Health, Work)…" />
          <div>
            <div className="text-xs text-hint mb-2 tracking-wider uppercase">Icon</div>
            <div className="grid grid-cols-5 gap-2">
              {EMOJIS.map((e) => (
                <button key={e} onClick={() => setEmoji(e)} className={`text-xl py-2 rounded-xl ${emoji === e ? 'bg-accent/20 ring-2 ring-accent' : 'bg-bg-3'}`}>{e}</button>
              ))}
            </div>
          </div>
          <button onClick={() => addM.mutate()} disabled={!name.trim()} className="w-full py-3 rounded-full bg-accent text-white font-semibold disabled:opacity-50">Add area</button>
        </div>
      </Sheet>
    </div>
  );
}
