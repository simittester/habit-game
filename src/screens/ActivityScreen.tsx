import { useQuery } from '@tanstack/react-query';
import { Section, Card } from '../components/Card';
import { fetchSummary } from '../api/daily';
import { format } from 'date-fns';
import type { DailySummary } from '../types/db';

export default function ActivityScreen() {
  const q = useQuery({ queryKey: ['summary', 30], queryFn: () => fetchSummary(30) });
  const rows = ((q.data ?? []) as DailySummary[]).filter(
    (r) => r.tasks_done + r.habits_done + r.blocks_done + r.meals_logged + r.water_glasses > 0,
  ).reverse();

  return (
    <div className="pb-6">
      <Section title="">
        <h1 className="text-[28px] font-bold leading-tight mt-2">Activity</h1>
        <div className="text-[14px] text-hint">Last 30 days · {rows.length} active days.</div>
      </Section>

      <Section title="">
        {rows.length === 0 ? (
          <Card><div className="text-hint text-sm text-center py-4">No activity yet. Start with one habit or task.</div></Card>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <Card key={r.day}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[15px] font-semibold">{format(new Date(r.day), 'EEE, MMM d')}</div>
                    <div className="text-[12px] text-hint">
                      {r.tasks_done} tasks · {r.habits_done} habits · {r.blocks_done} blocks
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] text-hint">water</div>
                    <div className="text-[15px] font-semibold">{r.water_glasses}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
