create table if not exists counselor_apps (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  position    text,
  sessions    text,
  focus_area  text,
  email       text,
  notes       text,
  submitted_at timestamptz,
  created_at  timestamptz default now()
);
