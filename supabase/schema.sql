-- Daily Note App Supabase schema draft
-- Run after creating a Supabase project. Auth/user ownership can be added later.

create extension if not exists pgcrypto;

create table if not exists daily_logs (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  daily_mood text not null default 'steady',
  daily_reflection text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists daily_actions (
  id uuid primary key default gen_random_uuid(),
  daily_log_id uuid not null references daily_logs(id) on delete cascade,
  slot text check (slot in ('diet', 'fitness', 'vibe_coding', 'writing')),
  category text not null check (category in ('diet_fitness', 'vibe_coding', 'writing')),
  title text not null,
  description text not null default '',
  status text not null check (status in ('done', 'partial', 'skipped')),
  satisfaction int not null default 3 check (satisfaction between 1 and 5),
  reflection text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists weekly_reflections (
  id uuid primary key default gen_random_uuid(),
  week_key text not null unique,
  wins text not null default '',
  blockers text not null default '',
  next_focus text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists action_templates (
  id text primary key,
  category text not null check (category in ('diet_fitness', 'vibe_coding', 'writing')),
  title text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists daily_actions_daily_log_id_idx on daily_actions(daily_log_id);
create unique index if not exists daily_actions_daily_log_id_slot_idx on daily_actions(daily_log_id, slot) where slot is not null;
create index if not exists daily_actions_category_idx on daily_actions(category);
create index if not exists daily_actions_status_idx on daily_actions(status);
create index if not exists daily_logs_date_idx on daily_logs(date desc);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists daily_logs_set_updated_at on daily_logs;
create trigger daily_logs_set_updated_at
before update on daily_logs
for each row execute function set_updated_at();

drop trigger if exists daily_actions_set_updated_at on daily_actions;
create trigger daily_actions_set_updated_at
before update on daily_actions
for each row execute function set_updated_at();

drop trigger if exists weekly_reflections_set_updated_at on weekly_reflections;
create trigger weekly_reflections_set_updated_at
before update on weekly_reflections
for each row execute function set_updated_at();

drop trigger if exists action_templates_set_updated_at on action_templates;
create trigger action_templates_set_updated_at
before update on action_templates
for each row execute function set_updated_at();
