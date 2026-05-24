import { useQuery } from '@tanstack/react-query';
import { Panel, PanelSection, SummaryPill } from './Panel';
import { StatTrio } from '../charts/StatTrio';
import { MiniLineChart } from '../charts/MiniLineChart';
import { InsightCard } from '../charts/InsightCard';
import { listReviews } from '../../api/structure';
import { format } from 'date-fns';
import type { DailySummary, Review } from '../../types/db';

interface Props {
  rows: DailySummary[];
  startDate: Date;
}

export function DailyPlansPanel({ rows, startDate }: Props) {
  const reviewsQ = useQuery({ queryKey: ['reviews'], queryFn: () => listReviews(100) });
  const reviews = (reviewsQ.data ?? []) as Review[];

  const startIso = format(startDate, 'yyyy-MM-dd');
  const reviewsInRange = reviews.filter((r) => r.review_date >= startIso);
  const evening = reviewsInRange.filter((r) => r.kind === 'daily');

  const daysPlanned = rows.filter((r) => r.blocks_total > 0).length;
  const shutdownsDone = evening.length;

  const completionRates = rows
    .filter((r) => r.blocks_total > 0)
    .map((r) => Math.round((r.blocks_done / r.blocks_total) * 100));
  const avgCompletion = completionRates.length === 0 ? 0 : Math.round(completionRates.reduce((s, v) => s + v, 0) / completionRates.length);

  // Recent wins from highlights
  const recentWins = evening
    .slice(0, 3)
    .map((r) => r.highlights)
    .filter((h): h is string => Boolean(h && h.trim()));

  const noData = daysPlanned === 0 && shutdownsDone === 0;

  return (
    <Panel
      emoji="📋"
      title="Daily Plans"
      summary={daysPlanned > 0 ? <SummaryPill value={`${daysPlanned} planned`} color="accent" /> : undefined}
    >
      {noData ? (
        <div className="text-hint text-[13px] text-center py-3">Add a time block or run an evening shutdown to see this fill in.</div>
      ) : (
        <>
          <StatTrio items={[
            { label: 'days planned', value: daysPlanned, color: 'accent' },
            { label: 'shutdowns', value: shutdownsDone, color: 'accent' },
            { label: 'plan complete', value: `${avgCompletion}%`, color: avgCompletion >= 70 ? 'success' : 'warn' },
          ]} />

          {completionRates.length > 1 && (
            <PanelSection title="Plan completion rate">
              <MiniLineChart values={completionRates} target={100} color="var(--color-accent)" showZero height={42} />
            </PanelSection>
          )}

          {recentWins.length > 0 && (
            <PanelSection title="Recent wins">
              <div className="space-y-1.5">
                {recentWins.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-[13px]">
                    <span className="text-green-400 shrink-0">✓</span>
                    <span className="leading-snug">{w}</span>
                  </div>
                ))}
              </div>
            </PanelSection>
          )}

          {daysPlanned >= 5 && avgCompletion >= 75 && (
            <InsightCard>Strong rhythm — <strong>{daysPlanned}</strong> planned days, completing <strong>{avgCompletion}%</strong>. Planning is your edge.</InsightCard>
          )}
          {shutdownsDone === 0 && daysPlanned >= 3 && (
            <InsightCard>You're planning days but not closing them. Try a 2-min evening shutdown to lock progress.</InsightCard>
          )}
        </>
      )}
    </Panel>
  );
}
