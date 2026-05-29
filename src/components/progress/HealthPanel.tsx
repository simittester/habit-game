import { useQuery } from '@tanstack/react-query';
import { Panel, PanelSection, SummaryPill } from './Panel';
import { StatTrio } from '../charts/StatTrio';
import { MiniLineChart } from '../charts/MiniLineChart';
import { ProgressRow } from '../charts/ProgressRow';
import { InsightCard } from '../charts/InsightCard';
import { listMealsForDate } from '../../api/daily';
import { listWeightLogs, bmi, bmiBucket } from '../../api/body';
import { listSleepLogs } from '../../api/sleep';
import { getSettings } from '../../api/settings';
import { format } from 'date-fns';
import type { DailySummary, WeightLog, Meal, SleepLog } from '../../types/db';

interface Props {
  rows: DailySummary[];
  startDate: Date;
  endDate: Date;
}

export function HealthPanel({ rows, startDate, endDate: _endDate }: Props) {
  const weightsQ = useQuery({ queryKey: ['weight', 'logs'], queryFn: () => listWeightLogs(180) });
  const sleepQ = useQuery({ queryKey: ['sleep', 'logs'], queryFn: () => listSleepLogs(60) });
  const settingsQ = useQuery({ queryKey: ['settings'], queryFn: getSettings });

  // We don't yet have per-range meals across all days — fetch meals for today only
  // (full per-day breakdown would need a new range API; using today as a snapshot for now)
  const mealsTodayQ = useQuery({ queryKey: ['meals', 'today'], queryFn: () => listMealsForDate() });

  const weights = (weightsQ.data ?? []) as WeightLog[];
  const meals = (mealsTodayQ.data ?? []) as Meal[];
  const sleepLogs = (sleepQ.data ?? []) as SleepLog[];
  const height = settingsQ.data?.height_cm ? Number(settingsQ.data.height_cm) : null;
  const sleepTarget = settingsQ.data?.sleep_target_hours ? Number(settingsQ.data.sleep_target_hours) : 8;

  // Water trend
  const waterValues = rows.map((r) => r.water_glasses);
  const waterAvg = waterValues.length === 0 ? 0 : Math.round(waterValues.reduce((s, v) => s + v, 0) / waterValues.length);
  const waterTarget = rows[rows.length - 1]?.water_target ?? 8;
  const waterHitDays = rows.filter((r) => r.water_glasses >= r.water_target).length;
  const waterHitRate = rows.length === 0 ? 0 : Math.round((waterHitDays / rows.length) * 100);

  // Weight
  const latestWeight = weights.length > 0 ? Number(weights[weights.length - 1].weight_kg) : null;
  const oldestWeightInRange = (() => {
    const startIso = format(startDate, 'yyyy-MM-dd');
    const inRange = weights.filter((w) => w.log_date >= startIso);
    return inRange[0] ? Number(inRange[0].weight_kg) : null;
  })();
  const weightDelta = latestWeight !== null && oldestWeightInRange !== null ? latestWeight - oldestWeightInRange : null;

  // Meals breakdown (today snapshot)
  const mealsByType: Record<string, number> = {};
  meals.forEach((m) => { mealsByType[m.meal_type] = (mealsByType[m.meal_type] ?? 0) + 1; });
  const mealsLoggedTotal = rows.reduce((s, r) => s + r.meals_logged, 0);

  // Sleep stats (filter to range)
  const startIsoFilter = format(startDate, 'yyyy-MM-dd');
  const sleepInRange = sleepLogs.filter((s) => s.log_date >= startIsoFilter);
  const sleepAvg = sleepInRange.length === 0 ? 0 : sleepInRange.reduce((s, l) => s + Number(l.hours), 0) / sleepInRange.length;
  const sleepHitDays = sleepInRange.filter((s) => Number(s.hours) >= sleepTarget).length;
  const sleepHitRate = sleepInRange.length === 0 ? 0 : Math.round((sleepHitDays / sleepInRange.length) * 100);

  const noData = waterAvg === 0 && latestWeight === null && mealsLoggedTotal === 0 && sleepInRange.length === 0;

  return (
    <Panel
      emoji="❤️"
      title="Health"
      summary={waterHitRate > 0 ? <SummaryPill value={`${waterHitRate}% water`} color={waterHitRate >= 70 ? 'success' : 'accent'} /> : undefined}
    >
      {noData ? (
        <div className="text-hint text-[13px] text-center py-3">Log water, meals, or weight to see your trends.</div>
      ) : (
        <>
          <StatTrio items={[
            { label: 'avg water', value: `${waterAvg} gl`, color: 'accent' },
            { label: 'target days hit', value: `${waterHitRate}%`, color: waterHitRate >= 70 ? 'success' : 'warn' },
            { label: 'meals logged', value: mealsLoggedTotal, color: 'default' },
          ]} />

          {sleepInRange.length > 0 && (
            <PanelSection title={`Sleep · avg ${sleepAvg.toFixed(1)}h · target ${sleepTarget}h`}>
              <MiniLineChart
                values={sleepInRange.map((s) => Number(s.hours))}
                color="#a78bfa"
                target={sleepTarget}
                showZero
                height={50}
              />
              <div className="flex items-center justify-between text-[10px] text-hint mt-1">
                <span>{sleepHitRate}% of days hit target</span>
                <span>{sleepInRange.length} logged</span>
              </div>
            </PanelSection>
          )}

          {waterValues.some((v) => v > 0) && (
            <PanelSection title={`Water · target ${waterTarget} gl/day`}>
              <MiniLineChart values={waterValues} color="var(--color-water)" target={waterTarget} showZero height={50} />
            </PanelSection>
          )}

          {latestWeight !== null && (
            <PanelSection title="Weight">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-[22px] font-bold tabular-nums">{latestWeight.toFixed(1)}</span>
                <span className="text-[12px] text-hint">kg</span>
                {weightDelta !== null && weightDelta !== 0 && (
                  <span className={`text-[12px] font-semibold tabular-nums ${weightDelta < 0 ? 'text-green-400' : 'text-amber-300'}`}>
                    {weightDelta > 0 ? '+' : ''}{weightDelta.toFixed(1)} vs range start
                  </span>
                )}
                {height && (
                  <span className={`text-[11px] tabular-nums ml-auto ${bmiBucket(bmi(latestWeight, height)).color}`}>
                    BMI {bmi(latestWeight, height).toFixed(1)} · {bmiBucket(bmi(latestWeight, height)).label}
                  </span>
                )}
              </div>
              {weights.length >= 2 && (
                <MiniLineChart values={weights.map((w) => Number(w.weight_kg))} color="var(--color-accent-2)" showDot height={40} />
              )}
            </PanelSection>
          )}

          {Object.keys(mealsByType).length > 0 && (
            <PanelSection title="Meals today">
              {(['breakfast', 'lunch', 'dinner', 'snack', 'meal'] as const).map((t) => {
                const n = mealsByType[t] ?? 0;
                if (n === 0) return null;
                return (
                  <ProgressRow
                    key={t}
                    label={t}
                    value={Math.min(1, n / 3)}
                    rightText={String(n)}
                    color="accent"
                  />
                );
              })}
            </PanelSection>
          )}

          {waterHitRate >= 80 && (
            <InsightCard>You hit your water target on <strong>{waterHitRate}%</strong> of days. Your body thanks you.</InsightCard>
          )}
          {weightDelta !== null && weightDelta < -1 && (
            <InsightCard>Weight is down <strong>{Math.abs(weightDelta).toFixed(1)}kg</strong> over this range. Steady progress.</InsightCard>
          )}
        </>
      )}
    </Panel>
  );
}
