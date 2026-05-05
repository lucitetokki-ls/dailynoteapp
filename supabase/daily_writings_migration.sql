create table if not exists daily_writings (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists daily_writings_date_idx on daily_writings(date desc);

drop trigger if exists daily_writings_set_updated_at on daily_writings;
create trigger daily_writings_set_updated_at
before update on daily_writings
for each row execute function set_updated_at();

alter table daily_writings enable row level security;

drop policy if exists "Allow public read daily_writings" on daily_writings;
create policy "Allow public read daily_writings"
on daily_writings for select
using (true);

drop policy if exists "Allow public insert daily_writings" on daily_writings;
create policy "Allow public insert daily_writings"
on daily_writings for insert
with check (true);

drop policy if exists "Allow public update daily_writings" on daily_writings;
create policy "Allow public update daily_writings"
on daily_writings for update
using (true)
with check (true);

drop policy if exists "Allow public delete daily_writings" on daily_writings;
create policy "Allow public delete daily_writings"
on daily_writings for delete
using (true);
