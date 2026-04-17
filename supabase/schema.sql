-- ═══════════════════════════════════════════════════════════
--  TERRA LINDA BASEBALL - SUPABASE SCHEMA
--  Run this entire file in your Supabase SQL Editor
--  Dashboard → SQL Editor → New Query → Paste → Run
-- ═══════════════════════════════════════════════════════════

-- ── USERS (portal accounts) ──────────────────────────────────
create table if not exists users (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  username    text unique not null,
  password    text not null,
  role        text not null check (role in ('coach','player','parent')),
  player_link text,                  -- links to players.name
  title       text,                  -- display title: 'Head Coach', 'Assistant Coach', 'Man of Many Costumes', etc.
  email       text,
  phone       text,
  notes       text,
  created_at  timestamptz default now()
);

-- For existing databases that were created before title/email/phone/notes existed:
alter table users add column if not exists title text;
alter table users add column if not exists email text;
alter table users add column if not exists phone text;
alter table users add column if not exists notes text;

-- No users are seeded. The login API has a hardcoded 'coach'/'trojans2025'
-- fallback so the first login always works; create real accounts via the
-- Manage Users screen after signing in.

-- ── ROSTER ────────────────────────────────────────────────────
create table if not exists roster (
  id         uuid primary key default gen_random_uuid(),
  num        integer not null,
  name       text not null,
  pos        text not null,
  year       text not null,
  bats       text not null default 'R',
  throws     text not null default 'R',
  team       text not null check (team in ('Varsity','JV')),
  status     text not null default 'Active',
  created_at timestamptz default now()
);

-- ── SCHEDULE ──────────────────────────────────────────────────
create table if not exists schedule (
  id         uuid primary key default gen_random_uuid(),
  game_date  date not null,
  opponent   text not null,
  home_away  text not null check (home_away in ('Home','Away')),
  location   text,
  game_time  time,
  result     text not null default 'Upcoming',
  score      text,
  notes      text,
  team       text not null check (team in ('Varsity','JV')),
  created_at timestamptz default now()
);

-- ── BATTING STATS ────────────────────────────────────────────
create table if not exists batting_stats (
  id          uuid primary key default gen_random_uuid(),
  player_name text not null,
  season      text not null default '2025',
  team        text not null,
  g           integer default 0,
  ab          integer default 0,
  h           integer default 0,
  doubles     integer default 0,
  triples     integer default 0,
  hr          integer default 0,
  rbi         integer default 0,
  bb          integer default 0,
  so          integer default 0,
  avg         numeric(4,3) default 0,
  obp         numeric(4,3) default 0,
  slg         numeric(4,3) default 0,
  updated_at  timestamptz default now()
);

-- ── PITCHING STATS ───────────────────────────────────────────
create table if not exists pitching_stats (
  id          uuid primary key default gen_random_uuid(),
  player_name text not null,
  season      text not null default '2025',
  team        text not null,
  g           integer default 0,
  gs          integer default 0,
  w           integer default 0,
  l           integer default 0,
  sv          integer default 0,
  ip          numeric(5,1) default 0,
  hits        integer default 0,
  er          integer default 0,
  bb          integer default 0,
  k           integer default 0,
  era         numeric(5,2) default 0,
  whip        numeric(4,2) default 0,
  updated_at  timestamptz default now()
);

-- ── FIELDING STATS ───────────────────────────────────────────
create table if not exists fielding_stats (
  id          uuid primary key default gen_random_uuid(),
  player_name text not null,
  pos         text not null,
  season      text not null default '2025',
  team        text not null,
  g           integer default 0,
  po          integer default 0,
  assists     integer default 0,
  errors      integer default 0,
  dp          integer default 0,
  fld_pct     numeric(5,3) default 0,
  updated_at  timestamptz default now()
);

-- ── FUNDRAISING ──────────────────────────────────────────────
create table if not exists fundraisers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  goal        numeric(10,2) not null,
  raised      numeric(10,2) default 0,
  event_date  date,
  location    text,
  status      text default 'Active',
  created_at  timestamptz default now()
);

create table if not exists contributions (
  id            uuid primary key default gen_random_uuid(),
  contributor   text not null,
  amount        numeric(10,2) not null,
  fundraiser    text not null,
  notes         text,
  created_at    timestamptz default now()
);

-- ── FIELD TASKS ──────────────────────────────────────────────
create table if not exists field_tasks (
  id          uuid primary key default gen_random_uuid(),
  task_name   text not null,
  priority    text not null check (priority in ('high','med','low')),
  assigned_to text,
  due_date    date,
  done        boolean default false,
  created_at  timestamptz default now()
);

-- ── CLINICS ──────────────────────────────────────────────────
create table if not exists clinics (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  clinic_date  date not null,
  time_start   text,
  time_end     text,
  ages         text,
  location     text,
  cost         numeric(8,2),
  max_spots    integer default 20,
  spots_filled integer default 0,
  instructor   text,
  created_at   timestamptz default now()
);

-- ── CAMP REGISTRATIONS ───────────────────────────────────────
create table if not exists camp_registrations (
  id              uuid primary key default gen_random_uuid(),
  player_name     text not null,
  age             integer,
  position        text,
  session         text not null,
  parent_name     text not null,
  email           text not null,
  phone           text,
  notes           text,
  created_at      timestamptz default now()
);

-- ── CONTACT REQUESTS ─────────────────────────────────────────
create table if not exists contact_requests (
  id              uuid primary key default gen_random_uuid(),
  org_name        text not null,
  org_type        text,
  contact_name    text not null,
  email           text not null,
  phone           text,
  program_type    text,
  preferred_dates text,
  headcount       integer,
  message         text,
  created_at      timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- Keeps data safe - only your app can read/write
-- ═══════════════════════════════════════════════════════════
alter table users               enable row level security;
alter table roster              enable row level security;
alter table schedule            enable row level security;
alter table batting_stats       enable row level security;
alter table pitching_stats      enable row level security;
alter table fielding_stats      enable row level security;
alter table fundraisers         enable row level security;
alter table contributions       enable row level security;
alter table field_tasks         enable row level security;
alter table clinics             enable row level security;
alter table camp_registrations  enable row level security;
alter table contact_requests    enable row level security;

-- Allow anon key to read public data (schedule, roster, stats, clinics)
create policy "Public can read schedule"       on schedule       for select using (true);
create policy "Public can read roster"         on roster         for select using (true);
create policy "Public can read batting stats"  on batting_stats  for select using (true);
create policy "Public can read pitching stats" on pitching_stats for select using (true);
create policy "Public can read fielding stats" on fielding_stats for select using (true);
create policy "Public can read clinics"        on clinics        for select using (true);
create policy "Public can read fundraisers"    on fundraisers    for select using (true);

-- Allow anon key to insert registrations and contact requests
create policy "Anyone can register for camp"   on camp_registrations for insert with check (true);
create policy "Anyone can send contact"        on contact_requests   for insert with check (true);

-- Users table: only service role (coach admin) can manage
create policy "Service role manages users"     on users for all using (true);

-- All write operations go through service role (API routes)
create policy "Service role manages roster"    on roster        for all using (true);
create policy "Service role manages schedule"  on schedule      for all using (true);
create policy "Service role manages batting"   on batting_stats for all using (true);
create policy "Service role manages pitching"  on pitching_stats for all using (true);
create policy "Service role manages fielding"  on fielding_stats for all using (true);
create policy "Service role manages tasks"     on field_tasks   for all using (true);
create policy "Service role manages contribs"  on contributions for all using (true);
create policy "Service role manages clinics"   on clinics       for all using (true);

-- ═══════════════════════════════════════════════════════════
-- No seed data. Every row (users, roster, schedule, stats,
-- fundraisers, field tasks, clinics) is added by the coach via
-- the app after first login.
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- Done! Your database is ready.
-- ═══════════════════════════════════════════════════════════
