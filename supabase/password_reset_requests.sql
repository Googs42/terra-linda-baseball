-- Coach-approved password reset flow. No email service required: a user
-- submits a request from the login page, it shows up in Manage Users, and
-- the coach approves it (or denies it) and hands the user a new password.
-- Run once in the Supabase SQL editor.

create table if not exists password_reset_requests (
  id              uuid primary key default gen_random_uuid(),
  username_or_email text not null,
  matched_user_id uuid,            -- resolved server-side; null if we can't find them
  message         text,            -- optional "I'm parent of #12" hint
  status          text not null default 'pending' check (status in ('pending','approved','denied')),
  new_password    text,            -- filled in by the coach on approve
  created_at      timestamptz default now(),
  resolved_at     timestamptz
);

create index if not exists password_reset_requests_status_idx
  on password_reset_requests(status, created_at desc);

-- Service role (API routes) fully manages the table. Anonymous users never
-- read it directly — they only POST via /api/auth/forgot-password.
alter table password_reset_requests enable row level security;
create policy "Service role manages reset requests" on password_reset_requests for all using (true);
