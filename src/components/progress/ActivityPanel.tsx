import { useQuery } from '@tanstack/react-query';
import { Panel, PanelSection, SummaryPill } from './Panel';
import { listInbox } from '../../api/inbox';
import { listReviews } from '../../api/structure';
import { listTasksInRange } from '../../api/tasks';
import { listAllHabitLogsInRange } from '../../api/habits';
import { listBlocksForDate } from '../../api/timeblocks';
import { format } from 'date-fns';
import type { DailySummary, InboxItem, Review, Task, HabitLog } from '../../types/db';

interface Props {
  rows: DailySummary[];
  startDate: Date;
  endDate: Date;
}

type Event = { kind: string; label: string; emoji: string; date: string };

export function ActivityPanel({ rows, startDate, endDate }: Props) {
  const startIso = format(startDate, 'yyyy-MM-dd');
  const endIso = format(endDate, 'yyyy-MM-dd');

  const inboxQ = useQuery({ queryKey: ['inbox'], queryFn: listInbox });
  const reviewsQ = useQuery({ queryKey: ['reviews'], queryFn: () => listReviews(100) });
  const tasksQ = useQuery({ queryKey: ['progress', 'tasks', startIso, endIso], queryFn: () => listTasksInRange(startIso, endIso) });
  const habitLogsQ = useQuery({ queryKey: ['progress', 'habit-logs', startIso, endIso], queryFn: () => listAllHabitLogsInRange(startIso, endIso) });
  const todayBlocksQ = useQuery({ queryKey: ['blocks', format(new Date(), 'yyyy-MM-dd')], queryFn: () => listBlocksForDate() });

  const inbox = (inboxQ.data ?? []) as InboxItem[];
  const reviews = (reviewsQ.data ?? []) as Review[];
  const tasks = (tasksQ.data ?? []) as Task[];
  const habitLogs = (habitLogsQ.data ?? []) as HabitLog[];
  const todayBlocks = todayBlocksQ.data ?? [];

  // Aggregate event counts
  const tasksDoneTotal = rows.reduce((s, r) => s + r.tasks_done, 0);
  const habitsLoggedTotal = rows.reduce((s, r) => s + r.habits_done, 0);
  const blocksDoneTotal = rows.reduce((s, r) => s + r.blocks_done, 0);
  const reviewsInRange = reviews.filter((r) => r.review_date >= startIso);
  const inboxInRange = inbox.filter((i) => i.created_at.slice(0, 10) >= startIso);

  const eventCounts = [
    { kind: 'Task completed', count: tasksDoneTotal, emoji: '✅' },
    { kind: 'Habit logged', count: habitsLoggedTotal, emoji: '🔥' },
    { kind: 'Capture created', count: inboxInRange.length, emoji: '💡' },
    { kind: 'Block completed', count: blocksDoneTotal, emoji: '📋' },
    { kind: 'Review done', count: reviewsInRange.length, emoji: '📊' },
  ].filter((e) => e.count > 0);

  // Recent events timeline
  const recent: Event[] = [
    ...tasks
      .filter((t) => t.status === 'done' && t.completed_at)
      .map((t) => ({ kind: 'task', label: `Task done: ${t.title}`, emoji: '✅', date: t.completed_at! })),
    ...habitLogs.map((l) => ({ kind: 'habit', label: 'Habit logged', emoji: '🔥', date: l.created_at })),
    ...inboxInRange.map((i) => ({ kind: 'capture', label: `Captured: ${i.content.slice(0, 40)}${i.content.length > 40 ? '…' : ''}`, emoji: '💡', date: i.created_at })),
    ...reviewsInRange.map((r) => ({ kind: 'review', label: `${r.kind === 'weekly' ? 'Weekly' : 'Evening'} review`, emoji: r.kind === 'weekly' ? '🔁' : '🌙', date: r.created_at })),
    ...todayBlocks.filter((b) => b.completed).map((b) => ({ kind: 'block', label: `Block completed: ${b.title}`, emoji: '📋', date: b.created_at })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  const totalEvents = eventCounts.reduce((s, e) => s + e.count, 0);

  return (
    <Panel
      emoji="⚡"
      title="Activity"
      summary={totalEvents > 0 ? <SummaryPill value={String(totalEvents)} color="accent" /> : undefined}
    >
      {totalEvents === 0 ? (
        <div className="text-hint text-[13px] text-center py-3">No events tracked yet.</div>
      ) : (
        <>
          <PanelSection title="Event summary">
            <div className="space-y-1.5">
              {eventCounts.map((e) => (
                <div key={e.kind} className="flex items-center gap-2 text-[13px] py-1.5">
                  <span className="text-base">{e.emoji}</span>
                  <span className="flex-1">{e.kind}</span>
                  <span className="text-hint tabular-nums">×{e.count}</span>
                </div>
              ))}
            </div>
          </PanelSection>

          {recent.length > 0 && (
            <PanelSection title="Recent events">
              <div className="space-y-1.5">
                {recent.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 bg-bg-3 rounded-xl px-3 py-2">
                    <span className="text-base shrink-0">{e.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] truncate">{e.label}</div>
                      <div className="text-[10px] text-hint">{format(new Date(e.date), 'EEE, MMM d, HH:mm')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </PanelSection>
          )}
        </>
      )}
    </Panel>
  );
}
