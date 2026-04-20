-- Adds a coach-editable offseason goals note per player. Run once:
--   paste into the Supabase SQL editor (or run via `supabase db push`).
alter table roster
  add column if not exists offseason_goals text;
