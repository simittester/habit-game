import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Panel, PanelSection, SummaryPill } from './Panel';
import { StatTrio } from '../charts/StatTrio';
import { MiniBarChart } from '../charts/MiniBarChart';
import { ProgressRow } from '../charts/ProgressRow';
import { InsightCard } from '../charts/InsightCard';
import { listTasksInRange } from '../../api/tasks';
import { listProjects, listAreas } from '../../api/structure';
import { format, eachDayOfInterval } from 'date-fns';
import type { DailySummary, Task, Project, Area } from '../../types/db';

interface Props {
  rows: DailySummary[];
  startDate: Date;
  endDate: Date;
}

export function TasksPanel({ rows, startDate, endDate }: Props) {
  const startIso = format(startDate, 'yyyy-MM-dd');
  const endIso = format(endDate, 'yyyy-MM-dd');
  const todayIso = format(new Date(), 'yyyy-MM-dd');

  const tasksQ = useQuery({
    queryKey: ['progress', 'tasks', startIso, endIso],
    queryFn: () => listTasksInRange(startIso, endIso),
  });
  const projectsQ = useQuery({ queryKey: ['projects'], queryFn: listProjects });
  const areasQ = useQuery({ queryKey: ['areas'], queryFn: listAreas });

  const tasks = (tasksQ.data ?? []) as Task[];
  const projects = (projectsQ.data ?? []) as Project[];
  const areas = (areasQ.data ?? []) as Area[];

  // Aggregate from the per-day summary (most reliable)
  const totals = rows.reduce((acc, r) => ({
    done: acc.done + r.tasks_done,
    total: acc.total + r.tasks_total,
  }), { done: 0, total: 0 });

  const completionRate = totals.total === 0 ? 0 : Math.round((totals.done / totals.total) * 100);
  const created = tasks.length;
  const overdue = tasks.filter((t) => t.status === 'open' && t.due_date && t.due_date < todayIso).length;

  // Build daily bars (created vs completed per day)
  const days = useMemo(() => eachDayOfInterval({ start: startDate, end: endDate }), [startDate, endDate]);
  const createdPerDay = days.map((d) => {
    const iso = format(d, 'yyyy-MM-dd');
    return tasks.filter((t) => t.created_at.slice(0, 10) === iso).length;
  });
  const donePerDay = days.map((d) => {
    const iso = format(d, 'yyyy-MM-dd');
    return tasks.filter((t) => t.status === 'done' && t.completed_at && t.completed_at.slice(0, 10) === iso).length;
  });

  // Breakdowns: priority
  const doneTasks = tasks.filter((t) => t.status === 'done');
  const priorityCounts = { 0: 0, 1: 0, 2: 0 } as Record<number, number>;
  doneTasks.forEach((t) => { priorityCounts[t.priority] = (priorityCounts[t.priority] ?? 0) + 1; });
  const maxPri = Math.max(1, ...Object.values(priorityCounts));

  // By area
  const areaCounts = new Map<string, { done: number; total: number }>();
  tasks.forEach((t) => {
    if (!t.area_id) return;
    const c = areaCounts.get(t.area_id) ?? { done: 0, total: 0 };
    c.total += 1;
    if (t.status === 'done') c.done += 1;
    areaCounts.set(t.area_id, c);
  });

  // By project
  const projectCounts = new Map<string, { done: number; total: number }>();
  tasks.forEach((t) => {
    if (!t.project_id) return;
    const c = projectCounts.get(t.project_id) ?? { done: 0, total: 0 };
    c.total += 1;
    if (t.status === 'done') c.done += 1;
    projectCounts.set(t.project_id, c);
  });

  const rolledOver = tasks.filter((t) =>
    t.status === 'open' && t.scheduled_for && t.scheduled_for < todayIso,
  ).length;
  const topPriorityDone = doneTasks.filter((t) => t.priority >= 1).length;

  const noData = totals.done === 0 && totals.total === 0 && tasks.length === 0;

  return (
    <Panel
      emoji="✅"
      title="Tasks"
      summary={completionRate > 0 ? <SummaryPill value={`${completionRate}%`} color={completionRate >= 70 ? 'success' : completionRate >= 40 ? 'warn' : 'danger'} /> : undefined}
    >
      {noData ? (
        <div className="text-hint text-[13px] text-center py-3">No tasks tracked in this range yet.</div>
      ) : (
        <>
          <StatTrio items={[
            { label: 'Completed', value: totals.done, color: 'success' },
            { label: 'Created', value: created, color: 'accent' },
            { label: 'Overdue', value: overdue, color: overdue > 0 ? 'danger' : 'default' },
          ]} />

          <PanelSection title="Daily completions">
            <MiniBarChart values={createdPerDay} completedValues={donePerDay} height={48} />
            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-hint">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-accent opacity-45" /> created</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500/85" /> done</span>
            </div>
          </PanelSection>

          {(priorityCounts[2] + priorityCounts[1] + priorityCounts[0]) > 0 && (
            <PanelSection title="Done by priority">
              <ProgressRow label="Urgent" emoji="🔥" value={priorityCounts[2] / maxPri} rightText={String(priorityCounts[2])} color="danger" />
              <ProgressRow label="Priority" emoji="⭐" value={priorityCounts[1] / maxPri} rightText={String(priorityCounts[1])} color="warn" />
              <ProgressRow label="Normal" value={priorityCounts[0] / maxPri} rightText={String(priorityCounts[0])} color="accent" />
            </PanelSection>
          )}

          {areaCounts.size > 0 && (
            <PanelSection title="By area">
              {Array.from(areaCounts.entries()).map(([id, c]) => {
                const area = areas.find((a) => a.id === id);
                if (!area) return null;
                return (
                  <ProgressRow
                    key={id}
                    label={area.name}
                    emoji={area.emoji}
                    value={c.total === 0 ? 0 : c.done / c.total}
                    rightText={`${c.done} / ${c.total}`}
                    color="accent"
                  />
                );
              })}
            </PanelSection>
          )}

          {projectCounts.size > 0 && (
            <PanelSection title="By project">
              {Array.from(projectCounts.entries()).map(([id, c]) => {
                const p = projects.find((pp) => pp.id === id);
                if (!p) return null;
                return (
                  <ProgressRow
                    key={id}
                    label={p.name}
                    emoji={p.emoji}
                    value={c.total === 0 ? 0 : c.done / c.total}
                    rightText={`${c.done} / ${c.total}`}
                    color="accent"
                  />
                );
              })}
            </PanelSection>
          )}

          <PanelSection>
            <div className="flex items-center justify-between text-[12px] py-2 border-t border-divider">
              <span className="text-hint">Rolled over</span>
              <span className="font-semibold tabular-nums">{rolledOver} task{rolledOver === 1 ? '' : 's'}</span>
            </div>
            <div className="flex items-center justify-between text-[12px] py-2 border-t border-divider">
              <span className="text-hint">Top priority done</span>
              <span className="font-semibold tabular-nums text-amber-300">{topPriorityDone} ⭐</span>
            </div>
          </PanelSection>

          {completionRate >= 70 && (
            <InsightCard>You're closing <strong>{completionRate}%</strong> of what you take on — that's a strong signal you're sizing tasks right.</InsightCard>
          )}
          {completionRate > 0 && completionRate < 40 && created > 5 && (
            <InsightCard>Closing less than half of created tasks. Try taking on fewer per day, or break them down smaller.</InsightCard>
          )}
        </>
      )}
    </Panel>
  );
}
