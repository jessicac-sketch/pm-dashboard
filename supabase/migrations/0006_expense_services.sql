-- Expenses, reworked around the monthly process:
--   * a service is set up once (expense_services) and every month's card charge
--     links to it (expenses.service_id; null = not matched yet)
--   * projects are assigned per service; projects are Product or R&D / POC
--   * remarks are per service per month (expense_remarks)
--   * each month's CEO report can be marked as sent (expense_month_reviews)
-- Existing expenses, remarks and project tags are carried over.
-- Run in Supabase SQL Editor after 0005_expense_projects.sql.

create type project_type as enum ('product', 'rnd');
alter table public.projects add column project_type project_type not null default 'product';

create table public.expense_services (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (btrim(name) <> ''),
  -- Text that identifies this service on the card statement, e.g. "AWS.AMAZON".
  statement_match  text,
  category         text,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create unique index expense_services_name_key on public.expense_services (lower(btrim(name)));

create table public.expense_service_project_links (
  service_id  uuid not null references public.expense_services (id) on delete cascade,
  project_id  uuid not null references public.projects (id) on delete cascade,
  primary key (service_id, project_id)
);

alter table public.expenses add column service_id uuid references public.expense_services (id) on delete set null;
create index expenses_service_id_idx on public.expenses (service_id);

create table public.expense_remarks (
  service_id  uuid not null references public.expense_services (id) on delete cascade,
  month       date not null check (extract(day from month) = 1),
  remark      text not null check (btrim(remark) <> ''),
  updated_at  timestamptz not null default now(),
  primary key (service_id, month)
);

create table public.expense_month_reviews (
  month           date primary key check (extract(day from month) = 1),
  report_sent_at  timestamptz,
  updated_at      timestamptz not null default now()
);

-- ---- Carry existing data over ----------------------------------------------

-- One service per grouped name, using the latest charge's name/statement/category.
insert into public.expense_services (name, statement_match, category)
select distinct on (service_key) btrim(service_name), statement_name, category
from public.expenses
order by service_key, occurred_on desc
on conflict do nothing;

update public.expenses e
set service_id = s.id
from public.expense_services s
where lower(btrim(s.name)) = e.service_key;

-- Remarks used to live on each charge; now they're per service per month.
insert into public.expense_remarks (service_id, month, remark)
select service_id, date_trunc('month', occurred_on)::date, string_agg(btrim(remarks), '; ' order by occurred_on)
from public.expenses
where service_id is not null and remarks is not null and btrim(remarks) <> ''
group by service_id, date_trunc('month', occurred_on)
on conflict do nothing;

-- Project links from the old per-service and per-charge tables, if they exist.
do $$
begin
  if to_regclass('public.expense_service_projects') is not null then
    insert into public.expense_service_project_links (service_id, project_id)
    select s.id, sp.project_id
    from public.expense_service_projects sp
    join public.expense_services s on lower(btrim(s.name)) = sp.service_key
    on conflict do nothing;
  end if;
  if to_regclass('public.expense_projects') is not null then
    insert into public.expense_service_project_links (service_id, project_id)
    select distinct e.service_id, ep.project_id
    from public.expense_projects ep
    join public.expenses e on e.id = ep.expense_id
    where e.service_id is not null
    on conflict do nothing;
  end if;
end;
$$;

drop table if exists public.expense_projects;
drop table if exists public.expense_service_projects;
drop table if exists public.expense_service_people;
alter table public.expenses drop column remarks;

-- ---- Housekeeping ---------------------------------------------------------

create trigger expense_services_set_updated_at before update on public.expense_services
  for each row execute function public.set_updated_at();
create trigger expense_remarks_set_updated_at before update on public.expense_remarks
  for each row execute function public.set_updated_at();
create trigger expense_month_reviews_set_updated_at before update on public.expense_month_reviews
  for each row execute function public.set_updated_at();

alter table public.expense_services enable row level security;
alter table public.expense_service_project_links enable row level security;
alter table public.expense_remarks enable row level security;
alter table public.expense_month_reviews enable row level security;

create policy "authenticated full access" on public.expense_services
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.expense_service_project_links
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.expense_remarks
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.expense_month_reviews
  for all to authenticated using (true) with check (true);
