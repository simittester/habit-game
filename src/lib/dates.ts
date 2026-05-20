import { format, startOfDay, addDays, subDays, isToday, isYesterday, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

export const today = () => startOfDay(new Date());
export const isoDate = (d: Date) => format(d, 'yyyy-MM-dd');
export const todayIso = () => isoDate(today());

export const niceDate = (d: Date) => {
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEE, MMM d');
};

export const longDate = (d: Date) => format(d, 'EEEE · MMMM d').toUpperCase();

export const lastNDays = (n: number) => {
  const end = today();
  const start = subDays(end, n - 1);
  return eachDayOfInterval({ start, end });
};

export { format, addDays, subDays, isToday, isYesterday, isSameDay, startOfWeek, endOfWeek };
