-- M9 migration 0001: minimal tables for optional cloud sync.
-- Apply in Supabase Dashboard (SQL editor) or `supabase db push` after linking.
-- Free-tier notes (checked 04/10/2026, re-check): 500 MB DB, project pauses
-- after ~1 week idle. Core app NEVER depends on these tables.
--
-- Manual RLS check (needs two users A and B):
--   1. As A: insert into practice_events with user_id = auth.uid() -> OK.
--   2. As B: select * from practice_events -> must NOT contain A's rows.
--   3. As anon: select/insert on any table -> denied.

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Bạn đồng hành',
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists practice_events (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id text not null,
  topic_id text not null,
  level text not null,
  qtype text not null,
  correct boolean not null,
  correct_count integer,
  duration_ms integer not null default 0,
  created_at bigint not null,
  synced_at timestamptz not null default now()
);
create index if not exists practice_events_user_created_idx
  on practice_events (user_id, created_at desc);

create table if not exists review_states (
  card_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  due timestamptz not null,
  stability double precision not null,
  difficulty double precision not null,
  reps integer not null default 0,
  lapses integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, card_id)
);

create table if not exists reports (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id text not null,
  question_version integer not null,
  category text not null,
  detail text not null,
  created_at timestamptz not null default now()
);
create index if not exists reports_question_idx on reports (question_id);

alter table profiles enable row level security;
alter table practice_events enable row level security;
alter table review_states enable row level security;
alter table reports enable row level security;

-- Owner-only policies on every table.
create policy "profiles_owner" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "practice_events_owner" on practice_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "review_states_owner" on review_states
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reports_owner" on reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
