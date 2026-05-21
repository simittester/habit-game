import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Section, Card } from '../components/Card';
import { TextArea } from '../components/Input';
import { listReviews, getReviewByDate, upsertReview } from '../api/structure';
import { todayIso } from '../lib/dates';
import { format } from 'date-fns';
import { tg } from '../lib/telegram';
import type { Review } from '../types/db';

export default function ReviewsScreen() {
  const qc = useQueryClient();
  const [highlights, setH] = useState('');
  const [lowlights, setL] = useState('');
  const [lessons, setLe] = useState('');
  const [next, setN] = useState('');

  const todayR = useQuery({ queryKey: ['review', 'today'], queryFn: () => getReviewByDate(todayIso(), 'daily') });
  const listQ = useQuery({ queryKey: ['reviews'], queryFn: listReviews });

  useEffect(() => {
    if (todayR.data) {
      setH(todayR.data.highlights ?? '');
      setL(todayR.data.lowlights ?? '');
      setLe(todayR.data.lessons ?? '');
      setN(todayR.data.next_focus ?? '');
    }
  }, [todayR.data?.id]);

  const saveM = useMutation({
    mutationFn: () => upsertReview({
      kind: 'daily',
      highlights: highlights.trim(),
      lowlights: lowlights.trim(),
      lessons: lessons.trim(),
      next_focus: next.trim(),
    }),
    onSuccess: () => { tg.notify('success'); qc.invalidateQueries({ queryKey: ['review'] }); qc.invalidateQueries({ queryKey: ['reviews'] }); },
  });

  return (
    <div className="pb-6">
      <Section title="">
        <h1 className="text-[28px] font-bold leading-tight mt-2">Reviews</h1>
        <div className="text-[14px] text-hint">A 60-second journal: what went well, what didn't, one focus for tomorrow.</div>
      </Section>

      <Section title="Today">
        <Card>
          <div className="space-y-3">
            <Field label="Highlights" value={highlights} onChange={setH} placeholder="What went well?" />
            <Field label="Lowlights" value={lowlights} onChange={setL} placeholder="What didn't?" />
            <Field label="Lessons" value={lessons} onChange={setLe} placeholder="What I learned…" />
            <Field label="Tomorrow's focus" value={next} onChange={setN} placeholder="One thing for tomorrow…" />
            <button onClick={() => saveM.mutate()} disabled={saveM.isPending} className="w-full py-3 rounded-full bg-accent text-white font-semibold">
              {saveM.isPending ? 'Saving…' : 'Save review'}
            </button>
          </div>
        </Card>
      </Section>

      <Section title="Past reviews">
        {(listQ.data ?? []).length === 0 ? (
          <Card><div className="text-hint text-sm text-center py-4">No past reviews yet.</div></Card>
        ) : (
          <div className="space-y-2">
            {(listQ.data ?? []).map((r: Review) => (
              <Card key={r.id}>
                <div className="text-[12px] text-hint">{format(new Date(r.review_date), 'EEE, MMM d')} · {r.kind}</div>
                {r.highlights && <div className="text-[14px] mt-1">✨ {r.highlights}</div>}
                {r.next_focus && <div className="text-[13px] text-accent mt-1">→ {r.next_focus}</div>}
              </Card>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <div className="text-[11px] tracking-wider text-hint uppercase mb-1">{label}</div>
      <TextArea rows={2} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
