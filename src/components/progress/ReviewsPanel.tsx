import { useQuery } from '@tanstack/react-query';
import { Panel, PanelSection, SummaryPill } from './Panel';
import { listReviews } from '../../api/structure';
import { format } from 'date-fns';
import type { Review } from '../../types/db';

interface Props {
  startDate: Date;
}

export function ReviewsPanel({ startDate }: Props) {
  const q = useQuery({ queryKey: ['reviews'], queryFn: () => listReviews(50) });
  const reviews = (q.data ?? []) as Review[];

  const startIso = format(startDate, 'yyyy-MM-dd');
  const inRange = reviews.filter((r) => r.review_date >= startIso);
  const newest = reviews[0];
  const weekly = inRange.filter((r) => r.kind === 'weekly');
  const daily = inRange.filter((r) => r.kind === 'daily');

  return (
    <Panel
      emoji="📊"
      title="Reviews"
      summary={inRange.length > 0 ? <SummaryPill value={String(inRange.length)} color="accent" /> : undefined}
    >
      {inRange.length === 0 ? (
        <div className="text-hint text-[13px] text-center py-3">Run an evening shutdown or weekly review to start a record.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-bg-3 rounded-2xl p-3 text-center">
              <div className="text-[20px] font-bold tabular-nums">{daily.length} <span className="text-[12px] text-hint">daily</span></div>
              <div className="text-[10px] text-hint tracking-wider uppercase">evenings closed</div>
            </div>
            <div className="bg-bg-3 rounded-2xl p-3 text-center">
              <div className="text-[20px] font-bold tabular-nums">{weekly.length} <span className="text-[12px] text-hint">weekly</span></div>
              <div className="text-[10px] text-hint tracking-wider uppercase">resets</div>
            </div>
          </div>

          {weekly[0] && (
            <PanelSection title={`Last weekly · ${format(new Date(weekly[0].review_date), 'EEE, MMM d')}`}>
              {weekly[0].highlights && (
                <div className="bg-bg-3 rounded-2xl p-3 text-[13px] mb-1">
                  <div className="text-[10px] text-green-400 tracking-wider uppercase font-semibold mb-1">🏆 Highlights</div>
                  <div className="whitespace-pre-wrap leading-snug">{weekly[0].highlights}</div>
                </div>
              )}
              {weekly[0].next_focus && (
                <div className="bg-bg-3 rounded-2xl p-3 text-[13px]">
                  <div className="text-[10px] text-accent tracking-wider uppercase font-semibold mb-1">🎯 Next focus</div>
                  <div className="whitespace-pre-wrap leading-snug">{weekly[0].next_focus}</div>
                </div>
              )}
            </PanelSection>
          )}

          {newest && newest.kind !== 'weekly' && (
            <PanelSection title={`Last review · ${format(new Date(newest.review_date), 'EEE, MMM d')}`}>
              {newest.highlights && <div className="text-[13px] bg-bg-3 rounded-2xl p-3 whitespace-pre-wrap">{newest.highlights}</div>}
            </PanelSection>
          )}
        </>
      )}
    </Panel>
  );
}
