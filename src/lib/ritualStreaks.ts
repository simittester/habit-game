import { format, startOfWeek, subDays, subWeeks } from 'date-fns';
import type { Review } from '../types/db';

export function dailyStreak(reviews: Review[]): number {
  const dates = new Set(reviews.filter((r) => r.kind === 'daily').map((r) => r.review_date));
  let streak = 0;
  let cur = new Date();
  // If today not yet reviewed, start counting from yesterday so the streak isn't broken
  if (!dates.has(format(cur, 'yyyy-MM-dd'))) {
    cur = subDays(cur, 1);
  }
  while (dates.has(format(cur, 'yyyy-MM-dd'))) {
    streak++;
    cur = subDays(cur, 1);
  }
  return streak;
}

export function weeklyStreak(reviews: Review[]): number {
  const weeks = new Set(
    reviews
      .filter((r) => r.kind === 'weekly')
      .map((r) => format(startOfWeek(new Date(r.review_date), { weekStartsOn: 1 }), 'yyyy-MM-dd')),
  );
  let streak = 0;
  let cur = startOfWeek(new Date(), { weekStartsOn: 1 });
  if (!weeks.has(format(cur, 'yyyy-MM-dd'))) {
    cur = subWeeks(cur, 1);
  }
  while (weeks.has(format(cur, 'yyyy-MM-dd'))) {
    streak++;
    cur = subWeeks(cur, 1);
  }
  return streak;
}

export function lastReviewDaysAgo(reviews: Review[], kind: 'daily' | 'weekly'): number | null {
  const filtered = reviews.filter((r) => r.kind === kind);
  if (filtered.length === 0) return null;
  const newest = filtered[0]; // already sorted desc
  const diff = Math.floor((Date.now() - new Date(newest.review_date).getTime()) / 86400000);
  return Math.max(0, diff);
}
