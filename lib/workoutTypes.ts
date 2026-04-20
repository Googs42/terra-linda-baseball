export interface WorkoutPlan {
  id: string;
  player_id: string;
  plan_name: string;
  notes: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface WorkoutExercise {
  id: string;
  plan_id: string;
  name: string;
  day_of_week: number | null; // 0=Sun .. 6=Sat
  target_sets: number;
  target_reps: string;
  notes: string;
  order_idx: number;
  created_at: string;
}

export interface WorkoutLog {
  id: string;
  exercise_id: string;
  log_date: string; // YYYY-MM-DD
  done: boolean;
  actual_sets: number | null;
  actual_reps: string | null;
  notes: string;
  created_at: string;
}

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function todayISO(): string {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function dayOfWeekOf(dateIso: string): number {
  return new Date(dateIso + 'T12:00:00').getDay();
}
