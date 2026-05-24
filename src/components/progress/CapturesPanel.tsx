import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { Panel, PanelSection, SummaryPill } from './Panel';
import { StatTrio } from '../charts/StatTrio';
import { listInbox } from '../../api/inbox';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import type { InboxItem } from '../../types/db';

interface Props {
  startDate: Date;
  endDate: Date;
}

export function CapturesPanel({ startDate, endDate }: Props) {
  const q = useQuery({ queryKey: ['inbox'], queryFn: listInbox });
  const items = (q.data ?? []) as InboxItem[];

  const startIso = format(startDate, 'yyyy-MM-dd');
  const inRange = items.filter((i) => i.created_at.slice(0, 10) >= startIso);
  const processed = inRange.filter((i) => i.processed);
  const pending = inRange.filter((i) => !i.processed);

  const processingRate = inRange.length === 0 ? 0 : Math.round((processed.length / inRange.length) * 100);

  // Daily captures grid
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const dailyCounts = days.map((d) => {
    const iso = format(d, 'yyyy-MM-dd');
    return {
      processed: inRange.filter((i) => i.created_at.slice(0, 10) === iso && i.processed).length,
      pending: inRange.filter((i) => i.created_at.slice(0, 10) === iso && !i.processed).length,
    };
  });
  const maxCount = Math.max(1, ...dailyCounts.map((d) => d.processed + d.pending));

  return (
    <Panel
      emoji="💡"
      title="Captures"
      summary={pending.length > 0 ? <SummaryPill value={`${pending.length} pending`} color="warn" /> : undefined}
    >
      {inRange.length === 0 ? (
        <div className="text-hint text-[13px] text-center py-3">No captures in this range. Drop ideas into the Inbox.</div>
      ) : (
        <>
          <StatTrio items={[
            { label: 'captured', value: inRange.length, color: 'accent' },
            { label: 'processed', value: processed.length, color: 'success' },
            { label: 'pending', value: pending.length, color: pending.length > 0 ? 'warn' : 'default' },
          ]} />

          <PanelSection title={`Processing rate · ${processingRate}%`}>
            <div className="h-1.5 bg-bg-4 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${processingRate}%` }} />
            </div>
          </PanelSection>

          <PanelSection title="Daily captures">
            <div className="flex gap-[3px] items-end" style={{ height: 36 }}>
              {dailyCounts.map((d, i) => {
                const totalCells = d.processed + d.pending;
                return (
                  <div key={i} className="flex-1 flex flex-col-reverse gap-[2px]">
                    {Array.from({ length: d.processed }).map((_, j) => (
                      <div key={`p${j}`} className="h-2 rounded-[2px] bg-green-500/80" />
                    ))}
                    {Array.from({ length: d.pending }).map((_, j) => (
                      <div key={`n${j}`} className="h-2 rounded-[2px] bg-accent/70" />
                    ))}
                    {totalCells === 0 && <div className="h-1 rounded-[2px] bg-bg-3" />}
                    {Array.from({ length: Math.max(0, maxCount - totalCells) }).map((_, j) => (
                      <div key={`s${j}`} className={clsx('h-2 rounded-[2px]', 'bg-transparent')} style={{ visibility: 'hidden' }} />
                    ))}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-hint">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-accent/70" /> pending</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500/80" /> processed</span>
            </div>
          </PanelSection>

          {pending.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <div className="text-[10px] tracking-wider text-hint uppercase font-semibold">Pending</div>
              {pending.slice(0, 3).map((i) => (
                <div key={i.id} className="text-[13px] bg-bg-3 rounded-xl px-3 py-2">
                  <div className="line-clamp-2">{i.content}</div>
                  <div className="text-[10px] text-hint mt-0.5">{format(parseISO(i.created_at), 'MMM d')}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Panel>
  );
}
