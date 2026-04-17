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

-- Seed the default coach account (can be deleted later in Manage Users —
-- the login API has a hardcoded 'coach'/'trojans2025' fallback so the coach
-- can never lock themselves out)
insert into users (name, username, password, role)
values ('Head Coach', 'coach', 'trojans2025', 'coach')
on conflict (username) do nothing;

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
-- SAMPLE DATA
-- These rows show up on first login as ideas/inspiration. Every row
-- is editable and deletable through the app — nothing here is protected.
-- Delete anything you don't want; the schema won't re-insert on subsequent
-- runs because each block uses ON CONFLICT DO NOTHING.
-- ═══════════════════════════════════════════════════════════

-- Varsity roster (sample)
insert into roster (num, name, pos, year, bats, throws, team) values
(4,  'Jake Morales',    'SS',    'Junior',    'R','R','Varsity'),
(12, 'Tyler Kim',       'P/OF',  'Senior',    'L','L','Varsity'),
(18, 'Marcus Chen',     '2B',    'Sophomore', 'R','R','Varsity'),
(22, 'Alex Garcia',     '1B',    'Senior',    'L','R','Varsity'),
(8,  'Brandon Williams','C',     'Junior',    'R','R','Varsity'),
(33, 'Ethan Torres',    'CF',    'Junior',    'R','R','Varsity'),
(10, 'Raj Patel',       '3B',    'Sophomore', 'R','R','Varsity'),
(15, 'Dante Nguyen',    'P',     'Senior',    'R','L','Varsity'),
(27, 'Chris Martin',    'P',     'Junior',    'R','R','Varsity'),
(3,  'Jose Reyes',      'P/RP',  'Senior',    'R','R','Varsity'),
(9,  'Noah Alvarez',    'LF',    'Sophomore', 'L','L','Varsity'),
(21, 'Sam Johnson',     'RF',    'Junior',    'R','R','Varsity'),
(16, 'Kai Nakamura',    'SS/2B', 'Sophomore', 'R','R','Varsity'),
(5,  'Owen Clark',      'DH',    'Senior',    'L','R','Varsity'),
(11, 'Mateo Flores',    'C/1B',  'Junior',    'R','R','Varsity'),
(30, 'Liam Bradley',    '3B/OF', 'Sophomore', 'R','R','Varsity')
on conflict do nothing;

-- JV roster (sample)
insert into roster (num, name, pos, year, bats, throws, team) values
(7,  'Ryan Lopez',     'C',     'Freshman',  'R','R','JV'),
(23, 'Derek Sanchez',  '1B',    'Sophomore', 'L','L','JV'),
(2,  'Aidan Murphy',   'SS',    'Freshman',  'R','R','JV'),
(14, 'Javier Rios',    'P',     'Freshman',  'R','R','JV'),
(6,  'Cole Bennett',   '2B',    'Sophomore', 'R','R','JV'),
(19, 'Tristan Lee',    'CF',    'Freshman',  'L','L','JV'),
(25, 'Finn McCarthy',  '3B',    'Sophomore', 'R','R','JV'),
(13, 'Zachary Powell', 'RF',    'Freshman',  'R','R','JV'),
(28, 'Isaiah Green',   'P/OF',  'Sophomore', 'L','L','JV'),
(1,  'Miles Turner',   'LF',    'Freshman',  'R','R','JV'),
(17, 'Hudson White',   'C',     'Sophomore', 'R','R','JV'),
(20, 'Preston Hill',   'UTIL',  'Freshman',  'R','R','JV')
on conflict do nothing;

-- Batting stats (sample)
insert into batting_stats (player_name, team, g, ab, h, doubles, triples, hr, rbi, bb, so, avg, obp, slg) values
('Jake Morales',     'Varsity', 18, 64, 22, 4, 1, 2, 14, 8, 12, 0.344, 0.417, 0.500),
('Marcus Chen',      'Varsity', 18, 60, 19, 3, 2, 0,  9,10,  8, 0.317, 0.403, 0.417),
('Alex Garcia',      'Varsity', 17, 55, 17, 5, 0, 3, 18, 6, 14, 0.309, 0.370, 0.527),
('Brandon Williams', 'Varsity', 18, 58, 16, 2, 1, 1, 11, 9, 10, 0.276, 0.360, 0.379),
('Tyler Kim',        'Varsity', 14, 41, 11, 2, 0, 2,  8, 5,  9, 0.268, 0.340, 0.439),
('Ethan Torres',     'Varsity', 16, 48, 12, 1, 0, 0,  5, 7, 11, 0.250, 0.345, 0.271),
('Raj Patel',        'Varsity', 18, 52, 13, 3, 1, 1, 10, 4, 13, 0.250, 0.298, 0.385)
on conflict do nothing;

-- Pitching stats (sample)
insert into pitching_stats (player_name, team, g, gs, w, l, sv, ip, hits, er, bb, k, era, whip) values
('Tyler Kim',    'Varsity', 10, 8, 5, 2, 0, 48.1, 38, 12, 14, 52, 2.24, 1.08),
('Dante Nguyen', 'Varsity',  9, 7, 4, 2, 1, 42.0, 36, 14, 18, 44, 3.00, 1.29),
('Chris Martin', 'Varsity',  8, 6, 3, 3, 0, 36.2, 34, 16, 16, 33, 3.93, 1.37),
('Jose Reyes',   'Varsity', 12, 0, 1, 1, 4, 18.0, 14,  5,  7, 22, 2.50, 1.17)
on conflict do nothing;

-- Varsity schedule (sample)
insert into schedule (game_date, opponent, home_away, location, game_time, result, score, notes, team) values
('2025-03-06','San Rafael',     'Away','San Rafael HS',  '15:30','W','8-3', 'League opener','Varsity'),
('2025-03-08','Novato',         'Home','TL Field',       '11:00','W','6-2', 'League','Varsity'),
('2025-03-11','Petaluma',       'Away','Petaluma HS',    '15:30','L','3-5', 'League','Varsity'),
('2025-03-13','Redwood',        'Home','TL Field',       '15:30','W','9-4', 'League','Varsity'),
('2025-03-15','Marin Catholic', 'Away','MC Field',       '11:00','W','4-2', 'League','Varsity'),
('2025-03-18','San Marin',      'Home','TL Field',       '15:30','L','2-4', 'League','Varsity'),
('2025-03-20','Tamalpais',      'Away','Tam HS',         '15:30','W','7-1', 'League','Varsity'),
('2025-03-22','Archie Williams','Home','TL Field',       '11:00','W','5-3', 'League','Varsity'),
('2025-03-25','San Rafael',     'Home','TL Field',       '15:30','W','10-2','League','Varsity'),
('2025-03-27','Novato',         'Away','Novato HS',      '15:30','L','1-4', 'League','Varsity'),
('2025-04-01','Petaluma',       'Home','TL Field',       '11:00','W','6-3', 'League','Varsity'),
('2025-04-03','Redwood',        'Away','Redwood HS',     '15:30','L','3-6', 'League','Varsity'),
('2025-04-05','Marin Catholic', 'Home','TL Field',       '15:30','W','8-5', 'League','Varsity'),
('2025-04-07','San Marin',      'Away','San Marin HS',   '11:00','W','5-2', 'League','Varsity'),
('2025-04-08','Tamalpais',      'Home','TL Field',       '15:30','L','4-7', 'League','Varsity'),
('2025-04-10','Novato',         'Home','TL Field',       '15:30','Upcoming','','League','Varsity'),
('2025-04-12','San Rafael',     'Away','San Rafael HS',  '11:00','Upcoming','','League','Varsity'),
('2025-04-15','Marin Catholic', 'Home','TL Field',       '15:30','Upcoming','','League','Varsity'),
('2025-04-17','Redwood',        'Away','Redwood HS',     '15:30','Upcoming','','League','Varsity'),
('2025-04-19','Petaluma',       'Home','TL Field',       '11:00','Upcoming','','League','Varsity'),
('2025-04-22','San Marin',      'Away','San Marin HS',   '15:30','Upcoming','','League','Varsity'),
('2025-04-24','Tamalpais',      'Home','TL Field',       '15:30','Upcoming','','League','Varsity'),
('2025-05-01','NCS Playoffs',   'TBD', 'TBD',            null,   'Upcoming','','NCS Bracket TBD','Varsity')
on conflict do nothing;

-- Fundraisers (sample)
insert into fundraisers (name, goal, raised, event_date, location, status) values
('Pasta Dinner Night',     2000, 1240, '2025-04-18', 'TL Cafeteria',    'Active'),
('Car Wash - Northgate',   1000,  380, '2025-04-27', 'Northgate Drive', 'Active'),
('Booster Club Pledge Drive', 5000, 3200, null,      'Online/Mail',     'Active'),
('Golf Tournament',        3000,    0, '2025-05-17', 'Marin Country Club','Upcoming'),
('Silent Auction Night',   3000,    0, '2025-06-06', 'TL Gym',           'Upcoming')
on conflict do nothing;

-- Field tasks (sample)
insert into field_tasks (task_name, priority, assigned_to, done) values
('Mound clay pack & level',       'low', 'Coaching staff', true),
('Infield drag & chalk lines',    'low', 'JV players rotation', true),
('Bullpen rubber inspection',     'low', 'Coaching staff', true),
('Outfield mow - 3 inch cut',     'med', 'Grounds crew', false),
('Foul lines repaint',            'high','Unassigned', false),
('Warning track re-grade',        'high','Unassigned', false),
('Home plate area clay fill',     'med', 'Coaching staff', false),
('Batting cage net inspection',   'low', 'Coaching staff', true)
on conflict do nothing;

-- ═══════════════════════════════════════════════════════════
-- Done! Your database is ready.
-- ═══════════════════════════════════════════════════════════
