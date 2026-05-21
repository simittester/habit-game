import { useMemo } from 'react';
import {
  format,
  addMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isAfter,
  isSameDay,
  isSameMonth,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { tg } from '../lib/telegram';
import type { DailySummary } from '../types/db';

interface Props {
  summaries: DailySummary[];
  month: Date;
  onMonthChange: (d: Date) => void;
  onDayTap?: (d: Date) => void;
  selectedDay?: Date | null;
}

const WEEKDAYS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

function intensityClass(intensity: number, isCurrentDay: boolean, isFuture: boolean, isSelected: boolean): string {
  if (isFuture) return 'bg-transparent text-hint/40';
  const base = isCurrentDay
    ? 'ring-2 ring-accent'
    : isSelected
      ? 'ring-2 ring-white/30'
      : '';
  switch (intensity) {
    case 0: return `bg-bg-3 text-text/65 ${base}`;
    case 1: return `bg-green-500/15 text-green-200/90 ${base}`;
    case 2: return `bg-green-500/30 text-green-100 ${base}`;
    case 3: return `bg-green-500/55 text-white ${base}`;
    case 4: return `bg-green-500/85 text-white ${base}`;
    default: return base;
  }
}

export function CalendarMonth({ summaries, month, onMonthChange, onDayTap, selectedDay }: Props) {
  const summaryMap = useMemo(() => new Map(summaries.map((s) => [s.day, s])), [summaries]);
  const today = new Date();

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startWeekday = (getDay(monthStart) + 6) % 7; // 0 = Monday

  const canGoNext = !isSameMonth(month, today) && !isAfter(monthStart, today);

  const goPrev = () => { tg.haptic('light'); onMonthChange(addMonths(month, -1)); };
  const goNext = () => {
    if (!canGoNext) return;
    tg.haptic('light');
    onMonthChange(addMonths(month, 1));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={goPrev}
          className="w-8 h-8 rounded-full bg-bg-3 flex items-center justify-center active:opacity-60"
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="font-semibold text-[15px]">{format(month, 'MMMM yyyy')}</div>
        <button
          onClick={goNext}
          disabled={!canGoNext}
          className="w-8 h-8 rounded-full bg-bg-3 flex items-center justify-center disabled:opacity-30 active:opacity-60"
          aria-label="Next month"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-[10px] text-hint text-center mb-2">
        {WEEKDAYS.map((d) => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startWeekday }).map((_, i) => (
          <div key={`pad-${i}`} className="aspect-square" />
        ))}
        {days.map((day) => {
          const iso = format(day, 'yyyy-MM-dd');
          const s = summaryMap.get(iso);
          const isFuture = isAfter(day, today);
          const isCurrentDay = isSameDay(day, today);
          const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;

          const habitRate = s?.habits_planned ? (s.habits_done / s.habits_planned) : 0;
          const taskRate = s?.tasks_total ? (s.tasks_done / s.tasks_total) : 0;
          const blockRate = s?.blocks_total ? (s.blocks_done / s.blocks_total) : 0;
          const score = Math.max(habitRate, taskRate, blockRate);

          let intensity = 0;
          if (!isFuture && s) {
            if (score >= 1) intensity = 4;
            else if (score >= 0.67) intensity = 3;
            else if (score >= 0.34) intensity = 2;
            else if (score > 0) intensity = 1;
          }

          const cls = intensityClass(intensity, isCurrentDay, isFuture, isSelected);

          return (
            <button
              key={iso}
              onClick={() => { if (!isFuture && onDayTap) { tg.haptic('light'); onDayTap(day); } }}
              disabled={isFuture}
              className={`aspect-square rounded-lg flex items-center justify-center text-[13px] font-medium transition active:scale-95 ${cls}`}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] text-hint">
        <span>Less</span>
        <div className="w-3 h-3 rounded-[3px] bg-bg-3" />
        <div className="w-3 h-3 rounded-[3px] bg-green-500/15" />
        <div className="w-3 h-3 rounded-[3px] bg-green-500/30" />
        <div className="w-3 h-3 rounded-[3px] bg-green-500/55" />
        <div className="w-3 h-3 rounded-[3px] bg-green-500/85" />
        <span>More</span>
      </div>
    </div>
  );
}
