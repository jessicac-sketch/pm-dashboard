-- Projects an individual expense belongs to (one expense can serve several).
-- Run in Supabase SQL Editor after 0004_expenses.sql.

create table public.expense_projects (
  expense_id  uuid not null references public.expenses (id) on delete cascade,
  project_id  uuid not null references public.projects (id) on delete cascade,
  primary key (expense_id, project_id)
);
create index expense_projects_project_id_idx on public.expense_projects (project_id);

alter table public.expense_projects enable row level security;

create policy "authenticated full access" on public.expense_projects
  for all to authenticated using (true) with check (true);
