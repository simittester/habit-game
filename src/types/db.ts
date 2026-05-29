export type Frequency = 'daily' | 'weekdays' | 'weekends' | 'custom';
export type TaskStatus = 'open' | 'done' | 'cancelled';
export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived';
export type ReviewKind = 'daily' | 'weekly' | 'monthly';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'meal';

export interface Area {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  emoji: string;
  color: string;
  position: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  area_id: string | null;
  name: string;
  description: string | null;
  emoji: string;
  color: string;
  status: ProjectStatus;
  due_date: string | null;
  completed_at: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  area_id: string | null;
  name: string;
  description: string | null;
  emoji: string;
  color: string;
  frequency: Frequency;
  custom_days: number[] | null;
  target_per_day: number;
  unit: string;
  reminder_time: string | null;
  position: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitLog {
  id: string;
  user_id: string;
  habit_id: string;
  log_date: string;
  count: number;
  note: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  project_id: string | null;
  area_id: string | null;
  title: string;
  notes: string | null;
  status: TaskStatus;
  priority: number;
  due_date: string | null;
  scheduled_for: string | null;
  completed_at: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface InboxItem {
  id: string;
  user_id: string;
  content: string;
  processed: boolean;
  promoted_to: string | null;
  promoted_id: string | null;
  created_at: string;
}

export interface TimeBlock {
  id: string;
  user_id: string;
  block_date: string;
  start_time: string;
  duration_minutes: number;
  title: string;
  emoji: string | null;
  color: string | null;
  completed: boolean;
  task_id: string | null;
  created_at: string;
}

export interface WaterLog {
  id: string;
  user_id: string;
  log_date: string;
  glasses: number;
  target: number;
  updated_at: string;
}

export interface Meal {
  id: string;
  user_id: string;
  log_date: string;
  meal_type: MealType;
  name: string;
  calories: number | null;
  notes: string | null;
  logged_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  log_date: string;
  amount: number;
  currency: string;
  category: string;
  emoji: string | null;
  note: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  review_date: string;
  kind: ReviewKind;
  highlights: string | null;
  lowlights: string | null;
  lessons: string | null;
  next_focus: string | null;
  score: number | null;
  created_at: string;
  updated_at: string;
}

export type SubscriptionStatus = 'trial' | 'active' | 'cancelled' | 'expired';
export type SubscriptionTier = 'week' | 'month' | 'year';

export interface UserSettings {
  user_id: string;
  water_daily_target: number;
  currency: string;
  theme: string;
  start_of_week: number;
  daily_focus_count: number;
  notifications: Record<string, unknown>;
  onboarded_at: string | null;
  height_cm: number | null;
  weight_unit: 'kg' | 'lb';
  target_weight_kg: number | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  subscription_status: SubscriptionStatus;
  subscription_tier: SubscriptionTier | null;
  subscription_renews_at: string | null;
  sleep_target_hours: number | null;
  language: 'en' | 'ru' | null;
  notify_evening_shutdown: boolean;
  notify_evening_hour: number;
  notify_habit_reminders: boolean;
  updated_at: string;
}

export interface WeightLog {
  id: string;
  user_id: string;
  log_date: string;
  weight_kg: number;
  note: string | null;
  created_at: string;
}

export interface SleepLog {
  id: string;
  user_id: string;
  log_date: string;
  hours: number;
  bedtime: string | null;
  wake_time: string | null;
  quality: 1 | 2 | 3 | 4 | 5 | null;
  note: string | null;
  created_at: string;
}

export interface DailySummary {
  user_id: string;
  day: string;
  tasks_done: number;
  tasks_total: number;
  habits_done: number;
  habits_planned: number;
  water_glasses: number;
  water_target: number;
  meals_logged: number;
  expenses_total: number;
  blocks_done: number;
  blocks_total: number;
}
