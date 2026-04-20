-- ─────────────────────────────────────────────────────────────
-- PLAYER WORKOUT PORTAL — run this once in the Supabase SQL editor
-- ─────────────────────────────────────────────────────────────

-- A player's workout plan (one coach-owned plan per player, can be edited over time)
create table if not exists workout_plans (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references roster(id) on delete cascade,
  plan_name   text not null default 'Training plan',
  notes       text default '',
  start_date  date,
  end_date    date,
  created_at  timestamptz default now()
);
create index if not exists idx_workout_plans_player on workout_plans(player_id);

-- Individual exercises inside a plan
create table if not exists workout_exercises (
  id           uuid primary key default gen_random_uuid(),
  plan_id      uuid not null references workout_plans(id) on delete cascade,
  name         text not null,
  day_of_week  int,                   -- 0=Sun .. 6=Sat, or NULL for "any day"
  target_sets  int default 0,
  target_reps  text default '',       -- free-text so "10-12" or "30s" works
  notes        text default '',
  order_idx    int default 0,
  created_at   timestamptz default now()
);
create index if not exists idx_workout_exercises_plan on workout_exercises(plan_id);

-- Player completion log — one row per exercise per date
create table if not exists workout_logs (
  id           uuid primary key default gen_random_uuid(),
  exercise_id  uuid not null references workout_exercises(id) on delete cascade,
  log_date     date not null,
  done         boolean not null default true,
  actual_sets  int,
  actual_reps  text,
  notes        text default '',
  created_at   timestamptz default now(),
  unique (exercise_id, log_date)
);
create index if not exists idx_workout_logs_exercise on workout_logs(exercise_id);
create index if not exists idx_workout_logs_date     on workout_logs(log_date);

-- RLS: mirror the pattern used by the rest of this app — anon can read,
-- service role writes (our Next.js API uses supabaseAdmin for mutations).
alter table workout_plans     enable row level security;
alter table workout_exercises enable row level security;
alter table workout_logs      enable row level security;

create policy "Public can read workout_plans"     on workout_plans     for select using (true);
create policy "Public can read workout_exercises" on workout_exercises for select using (true);
create policy "Public can read workout_logs"      on workout_logs      for select using (true);

create policy "Service role manages workout_plans"     on workout_plans     for all using (true);
create policy "Service role manages workout_exercises" on workout_exercises for all using (true);
create policy "Service role manages workout_logs"      on workout_logs      for all using (true);
