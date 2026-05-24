import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Panel, PanelSection, SummaryPill } from './Panel';
import { StatTrio } from '../charts/StatTrio';
import { CashFlowChart } from '../charts/CashFlowChart';
import { ProgressRow } from '../charts/ProgressRow';
import { InsightCard } from '../charts/InsightCard';
import { listRecentExpenses } from '../../api/daily';
import { format, eachDayOfInterval, differenceInDays } from 'date-fns';
import type { Expense } from '../../types/db';

interface Props {
  startDate: Date;
  endDate: Date;
}

const CATEGORY_EMOJI: Record<string, string> = {
  food: '🍔',
  transport: '🚗',
  home: '🏠',
  fun: '🎉',
  health: '💊',
  other: '🧾',
  general: '💸',
};

export function MoneyPanel({ startDate, endDate }: Props) {
  const days = Math.max(1, differenceInDays(endDate, startDate) + 1);
  const expensesQ = useQuery({
    queryKey: ['expenses', 'recent', days],
    queryFn: () => listRecentExpenses(days),
  });

  const expenses = (expensesQ.data ?? []) as Expense[];

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const avgDaily = total / days;
  const biggest = expenses.reduce<Expense | null>((max, e) => {
    if (!max) return e;
    return Number(e.amount) > Number(max.amount) ? e : max;
  }, null);

  // Daily cash flow (expenses are negative numbers for the chart)
  const dailyValues = useMemo(() => {
    const dayList = eachDayOfInterval({ start: startDate, end: endDate });
    return dayList.map((d) => {
      const iso = format(d, 'yyyy-MM-dd');
      const dayExpenses = expenses.filter((e) => e.log_date === iso);
      return -dayExpenses.reduce((s, e) => s + Number(e.amount), 0);
    });
  }, [expenses, startDate, endDate]);

  // By category
  const byCategory = new Map<string, number>();
  expenses.forEach((e) => byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + Number(e.amount)));
  const sortedCategories = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]);
  const maxCat = sortedCategories[0]?.[1] ?? 1;

  const topCategory = sortedCategories[0];

  return (
    <Panel
      emoji="💵"
      title="Money"
      summary={total > 0 ? <SummaryPill value={`-$${total.toFixed(0)}`} color="danger" /> : undefined}
    >
      {expenses.length === 0 ? (
        <div className="text-hint text-[13px] text-center py-3">No expenses logged in this range yet.</div>
      ) : (
        <>
          <StatTrio items={[
            { label: 'spent', value: `$${total.toFixed(0)}`, color: 'danger' },
            { label: 'avg/day', value: `$${avgDaily.toFixed(0)}`, color: 'default' },
            { label: 'expenses', value: expenses.length, color: 'default' },
          ]} />

          <PanelSection title="Daily spend">
            <CashFlowChart values={dailyValues} height={48} />
          </PanelSection>

          {biggest && (
            <PanelSection>
              <div className="flex items-center justify-between text-[12px] py-2 border-t border-divider">
                <span className="text-hint">Biggest expense</span>
                <span className="font-semibold tabular-nums">${Number(biggest.amount).toFixed(2)} <span className="text-hint">· {biggest.note || biggest.category}</span></span>
              </div>
            </PanelSection>
          )}

          {sortedCategories.length > 0 && (
            <PanelSection title="Where it went">
              {sortedCategories.map(([cat, amt]) => {
                const pct = total === 0 ? 0 : (amt / total) * 100;
                return (
                  <ProgressRow
                    key={cat}
                    label={cat.charAt(0).toUpperCase() + cat.slice(1)}
                    emoji={CATEGORY_EMOJI[cat] ?? '💸'}
                    value={amt / maxCat}
                    rightText={`$${amt.toFixed(0)} · ${Math.round(pct)}%`}
                    color="accent"
                  />
                );
              })}
            </PanelSection>
          )}

          {topCategory && topCategory[1] / total > 0.5 && (
            <InsightCard>Over half your spending went to <strong>{topCategory[0]}</strong>. Set a soft cap if you want more balance.</InsightCard>
          )}
        </>
      )}
    </Panel>
  );
}
