-- Project Management Dashboard: initial schema
-- Run in Supabase SQL Editor, or `npx supabase db push` with the CLI.

create type project_status as enum ('planning', 'active', 'on_hold', 'completed');
create type task_status as enum ('todo', 'in_progress', 'review', 'done');
create type task_priority as enum ('low', 'medium', 'high', 'urgent');

create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  status      project_status not null default 'planning',
  start_date  date,
  due_date    date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.tasks (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  title       text not null,
  description text,
  status      task_status not null default 'todo',
  priority    task_priority not null default 'medium',
  assignee    text,
  due_date    date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index tasks_project_id_idx on public.tasks (project_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger tasks_set_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

-- Row Level Security. These policies allow any authenticated user full access;
-- tighten (e.g. per-owner or per-team) once auth/membership is designed.
alter table public.projects enable row level security;
alter table public.tasks enable row level security;

create policy "authenticated full access" on public.projects
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.tasks
  for all to authenticated using (true) with check (true);

-- DEV ONLY: uncomment to use the dashboard before login is built. Remove before production.
-- create policy "dev anon access" on public.projects for all to anon using (true) with check (true);
-- create policy "dev anon access" on public.tasks for all to anon using (true) with check (true);
