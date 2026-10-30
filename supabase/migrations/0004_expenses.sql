-- Expenses: card charges (fields match the Amex statement export), remarks per
-- charge, and which projects/people use each service.
-- Run in Supabase SQL Editor after 0003_project_workspace.sql.

create table public.expenses (
  id                uuid primary key default gen_random_uuid(),
  occurred_on       date not null,
  service_name      text not null check (btrim(service_name) <> ''),
  -- Groups charges into one service regardless of case/spacing ("AWS" = "aws ").
  service_key       text generated always as (lower(btrim(service_name))) stored,
  statement_name    text,
  address           text,
  city_state        text,
  zip_code          text,
  country           text,
  -- Unique so re-importing the same statement skips charges already in.
  reference_number  text unique,
  category          text,
  amount            numeric(12, 2) not null,
  remarks           text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index expenses_occurred_on_idx on public.expenses (occurred_on);
create index expenses_service_key_idx on public.expenses (service_key);

-- Which projects / people use a service, keyed by the grouped service name.
create table public.expense_service_projects (
  service_key  text not null,
  project_id   uuid not null references public.projects (id) on delete cascade,
  primary key (service_key, project_id)
);

create table public.expense_service_people (
  service_key  text not null,
  person_id    uuid not null references public.people (id) on delete cascade,
  primary key (service_key, person_id)
);

create trigger expenses_set_updated_at before update on public.expenses
  for each row execute function public.set_updated_at();

alter table public.expenses enable row level security;
alter table public.expense_service_projects enable row level security;
alter table public.expense_service_people enable row level security;

create policy "authenticated full access" on public.expenses
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.expense_service_projects
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.expense_service_people
  for all to authenticated using (true) with check (true);
