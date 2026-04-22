-- Adds season goals + coach notes to the roster row, next to offseason_goals
-- which was added earlier. Run once in the Supabase SQL editor.

alter table roster
  add column if not exists season_goals text,
  add column if not exists coach_notes  text,
  add column if not exists height       text,
  add column if not exists weight       text,
  add column if not exists photo_url    text;
