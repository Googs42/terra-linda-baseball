-- Adds a league/non-league flag to every game. Default true because most
-- games on this team's schedule are league games. Run once against Supabase:
--   supabase db push   (if using CLI)
-- or paste into the Supabase SQL editor.

alter table schedule
  add column if not exists is_league boolean not null default true;

-- Backfill: if an existing row's notes column mentions "league" explicitly,
-- leave it true; otherwise mark non-league rows that clearly say so.
update schedule
   set is_league = false
 where coalesce(notes,'') ilike '%non-league%'
    or coalesce(notes,'') ilike '%non league%'
    or coalesce(notes,'') ilike '%preseason%'
    or coalesce(notes,'') ilike '%scrimmage%';
