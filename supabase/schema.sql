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
  slot text check (slot in ('diet', 'fitness', 'vibe_coding', 'writing', 'organization', 'relationships')),
  category text not null check (category in ('diet_fitness', 'vibe_coding', 'writing', 'organization', 'relationships')),
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

create table if not exists daily_writings (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  title text not null default '',
  content text not null default '',
  content_markdown text not null default '',
  content_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists action_templates (
  id text primary key,
  category text not null check (category in ('diet_fitness', 'vibe_coding', 'writing', 'organization', 'relationships')),
  title text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table daily_actions drop constraint if exists daily_actions_slot_check;
alter table daily_actions add constraint daily_actions_slot_check
check (slot in ('diet', 'fitness', 'vibe_coding', 'writing', 'organization', 'relationships'));

alter table daily_actions alter column slot set not null;

alter table daily_actions drop constraint if exists daily_actions_slot_category_check;
alter table daily_actions add constraint daily_actions_slot_category_check
check (
  (slot in ('diet', 'fitness') and category = 'diet_fitness')
  or (slot = 'vibe_coding' and category = 'vibe_coding')
  or (slot = 'writing' and category = 'writing')
  or (slot = 'organization' and category = 'organization')
  or (slot = 'relationships' and category = 'relationships')
);

alter table daily_actions drop constraint if exists daily_actions_category_check;
alter table daily_actions add constraint daily_actions_category_check
check (category in ('diet_fitness', 'vibe_coding', 'writing', 'organization', 'relationships'));

alter table action_templates drop constraint if exists action_templates_category_check;
alter table action_templates add constraint action_templates_category_check
check (category in ('diet_fitness', 'vibe_coding', 'writing', 'organization', 'relationships'));

alter table daily_logs drop constraint if exists daily_logs_content_length_check;
alter table daily_logs add constraint daily_logs_content_length_check
check (
  char_length(daily_mood) <= 32
  and char_length(daily_reflection) <= 20000
);

alter table daily_actions drop constraint if exists daily_actions_content_length_check;
alter table daily_actions add constraint daily_actions_content_length_check
check (
  char_length(title) between 1 and 120
  and char_length(description) <= 10000
  and char_length(reflection) <= 10000
);

alter table weekly_reflections drop constraint if exists weekly_reflections_content_check;
alter table weekly_reflections add constraint weekly_reflections_content_check
check (
  week_key ~ '^[0-9]{4}-W(0[1-9]|[1-4][0-9]|5[0-3])$'
  and char_length(wins) <= 20000
  and char_length(blockers) <= 20000
  and char_length(next_focus) <= 20000
);

alter table daily_writings add column if not exists title text not null default '';
alter table daily_writings drop constraint if exists daily_writings_content_length_check;
alter table daily_writings add constraint daily_writings_content_length_check
check (
  char_length(title) <= 120
  and char_length(content) <= 1000000
  and char_length(content_markdown) <= 1000000
  and (content_json is null or pg_column_size(content_json) <= 2000000)
);

alter table action_templates drop constraint if exists action_templates_content_length_check;
alter table action_templates add constraint action_templates_content_length_check
check (
  char_length(id) between 1 and 128
  and char_length(title) between 1 and 120
  and char_length(description) <= 2000
);

create index if not exists daily_actions_daily_log_id_idx on daily_actions(daily_log_id);
drop index if exists daily_actions_daily_log_id_slot_idx;
alter table daily_actions drop constraint if exists daily_actions_daily_log_id_slot_key;
alter table daily_actions add constraint daily_actions_daily_log_id_slot_key unique (daily_log_id, slot);
create index if not exists daily_actions_category_idx on daily_actions(category);
create index if not exists daily_actions_status_idx on daily_actions(status);
create index if not exists daily_logs_date_idx on daily_logs(date desc);
create index if not exists daily_writings_date_idx on daily_writings(date desc);

alter table daily_writings add column if not exists content_markdown text not null default '';
alter table daily_writings add column if not exists content_json jsonb;

update daily_writings
set content_markdown = content
where content_markdown = ''
  and content <> '';

create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function clear_daily_note_data()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  delete from public.daily_logs;
  delete from public.weekly_reflections;
  delete from public.daily_writings;
end;
$$;

revoke all on function clear_daily_note_data() from public;
grant execute on function clear_daily_note_data() to anon, authenticated;

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

drop trigger if exists daily_writings_set_updated_at on daily_writings;
create trigger daily_writings_set_updated_at
before update on daily_writings
for each row execute function set_updated_at();

drop trigger if exists action_templates_set_updated_at on action_templates;
create trigger action_templates_set_updated_at
before update on action_templates
for each row execute function set_updated_at();

alter table daily_logs enable row level security;
alter table daily_actions enable row level security;
alter table weekly_reflections enable row level security;
alter table daily_writings enable row level security;
alter table action_templates enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on daily_logs to anon, authenticated;
grant select, insert, update, delete on daily_actions to anon, authenticated;
grant select, insert, update, delete on weekly_reflections to anon, authenticated;
grant select, insert, update, delete on daily_writings to anon, authenticated;
grant select, insert, update, delete on action_templates to anon, authenticated;

revoke truncate, references, trigger on daily_logs from anon, authenticated;
revoke truncate, references, trigger on daily_actions from anon, authenticated;
revoke truncate, references, trigger on weekly_reflections from anon, authenticated;
revoke truncate, references, trigger on daily_writings from anon, authenticated;
revoke truncate, references, trigger on action_templates from anon, authenticated;

-- The app currently writes directly from the browser with the publishable/anon key.
-- Replace these public policies with user-scoped policies after adding real auth.
drop policy if exists "anon full access daily_logs" on daily_logs;
drop policy if exists "Allow public access daily_logs" on daily_logs;
create policy "Allow public access daily_logs"
on daily_logs for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "anon full access daily_actions" on daily_actions;
drop policy if exists "Allow public access daily_actions" on daily_actions;
create policy "Allow public access daily_actions"
on daily_actions for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "anon full access weekly_reflections" on weekly_reflections;
drop policy if exists "Allow public access weekly_reflections" on weekly_reflections;
create policy "Allow public access weekly_reflections"
on weekly_reflections for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Allow public read daily_writings" on daily_writings;
drop policy if exists "Allow public insert daily_writings" on daily_writings;
drop policy if exists "Allow public update daily_writings" on daily_writings;
drop policy if exists "Allow public delete daily_writings" on daily_writings;
drop policy if exists "Allow public access daily_writings" on daily_writings;
create policy "Allow public access daily_writings"
on daily_writings for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "anon full access action_templates" on action_templates;
drop policy if exists "Allow public access action_templates" on action_templates;
create policy "Allow public access action_templates"
on action_templates for all
to anon, authenticated
using (true)
with check (true);
