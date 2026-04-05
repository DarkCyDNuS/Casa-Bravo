create table if not exists public.app_state (
  id text primary key,
  customers jsonb not null default '[]'::jsonb,
  orders jsonb not null default '[]'::jsonb,
  audit_log jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

drop policy if exists "public can read app_state" on public.app_state;
create policy "public can read app_state"
on public.app_state
for select
to anon
using (true);

drop policy if exists "public can insert app_state" on public.app_state;
create policy "public can insert app_state"
on public.app_state
for insert
to anon
with check (true);

drop policy if exists "public can update app_state" on public.app_state;
create policy "public can update app_state"
on public.app_state
for update
to anon
using (true)
with check (true);
