create table if not exists roster_archive (
  id          uuid primary key default gen_random_uuid(),
  season      text not null,
  num         integer,
  name        text not null,
  pos         text,
  year        text,
  bats        text,
  throws      text,
  team        text,
  status      text,
  height      text,
  weight      text,
  photo_url   text,
  archived_at timestamptz default now()
);

create index if not exists roster_archive_season_idx on roster_archive(season);
