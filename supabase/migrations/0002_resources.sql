-- Resource allocation: people, their role and employment type, and how much of
-- their time goes to each project.
-- Run in Supabase SQL Editor after 0001_init.sql.

create type person_role as enum (
  'developer', 'qa', 'designer', 'devops', 'data_engineer',
  'project_manager', 'business_analyst', 'other'
);
create type employment_type as enum ('regular', 'intern', 'contractor');
create type project_color as enum ('magenta', 'blue', 'teal', 'amber', 'violet');

-- Projects get a short code (e.g. "CMS"), a board color and a staffing target.
alter table public.projects
  add column code text unique,
  add column color project_color not null default 'magenta',
  add column required_fte numeric(4, 2) check (required_fte is null or required_fte > 0);

create table public.people (
  id                    uuid primary key default gen_random_uuid(),
  full_name             text not null,
  email                 text unique,
  title                 text,
  role                  person_role not null default 'developer',
  employment_type       employment_type not null default 'regular',
  weekly_capacity_hours smallint not null default 40
                        check (weekly_capacity_hours > 0 and weekly_capacity_hours <= 60),
  is_active             boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- One row per person per project. `percent` is the share of that person's
-- weekly capacity. A person's total may exceed 100 (over-allocation is shown, not blocked).
create table public.allocations (
  id          uuid primary key default gen_random_uuid(),
  person_id   uuid not null references public.people (id) on delete cascade,
  project_id  uuid not null references public.projects (id) on delete cascade,
  percent     smallint not null check (percent between 1 and 100),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (person_id, project_id)
);

create index allocations_project_id_idx on public.allocations (project_id);

create trigger people_set_updated_at before update on public.people
  for each row execute function public.set_updated_at();
create trigger allocations_set_updated_at before update on public.allocations
  for each row execute function public.set_updated_at();

alter table public.people enable row level security;
alter table public.allocations enable row level security;

create policy "authenticated full access" on public.people
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.allocations
  for all to authenticated using (true) with check (true);
