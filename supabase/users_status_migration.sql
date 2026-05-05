-- ═══════════════════════════════════════════════════════════
--  USERS — Approval status
--  Adds a `status` column so coach signups can sit in a
--  "pending" state until a head coach approves them.
--  Run this in the Supabase SQL editor.
-- ═══════════════════════════════════════════════════════════

alter table users
  add column if not exists status text not null default 'active'
  check (status in ('active','pending'));

-- Anyone created before this migration is implicitly active.
update users set status = 'active' where status is null;
