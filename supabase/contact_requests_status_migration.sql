-- Add status tracking to contact_requests
alter table contact_requests add column if not exists status text default 'pending';
alter table contact_requests add column if not exists reviewed_at timestamptz;
