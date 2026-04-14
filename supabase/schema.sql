create extension if not exists pgcrypto;

create table events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  room_count int not null default 4,
  created_at timestamptz default now()
);

create table teams (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  team_name text,
  team_number text,
  team_members text,
  project_description text,
  github_url text,
  demo_video text,
  partner_technologies text,
  time_submitted text,
  room_id int,
  status text default 'queue',
  queue_position int,
  original_room_id int
);

create table room_timers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  room_number int not null,
  duration_seconds int default 300,
  started_at timestamptz,
  is_running boolean default false,
  unique(event_id, room_number)
);

alter publication supabase_realtime add table teams;
alter publication supabase_realtime add table room_timers;
