-- Project workspace: lead + required roles, work breakdown structure (WBS),
-- risk register, issues, and dismissed risk suggestions.
-- Run in Supabase SQL Editor after 0002_resources.sql.

create type wbs_kind as enum ('phase', 'work_package', 'milestone');
create type risk_category as enum ('resourcing', 'technical', 'scope', 'schedule', 'compliance', 'budget', 'other');
create type risk_response as enum ('mitigate', 'avoid', 'transfer', 'accept');
create type risk_status as enum ('open', 'mitigating', 'closed');
create type issue_severity as enum ('low', 'medium', 'high', 'critical');
create type issue_status as enum ('open', 'resolved');

alter table public.projects
  add column lead_person_id uuid references public.people (id) on delete set null,
  add column required_roles person_role[] not null default '{}';

-- Gives each risk/issue a per-project number (R1, R2… / I1, I2…).
create or replace function public.set_ref_number()
returns trigger language plpgsql as $$
begin
  execute format(
    'select coalesce(max(ref_number), 0) + 1 from public.%I where project_id = $1',
    tg_table_name
  ) into new.ref_number using new.project_id;
  return new;
end;
$$;

-- Phases sit at the top; work packages and milestones always belong to a phase.
create table public.wbs_items (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects (id) on delete cascade,
  parent_id        uuid references public.wbs_items (id) on delete cascade,
  kind             wbs_kind not null,
  name             text not null,
  owner_person_id  uuid references public.people (id) on delete set null,
  start_date       date,
  end_date         date,
  estimate_days    numeric(6, 1) check (estimate_days is null or estimate_days >= 0),
  progress         smallint not null default 0 check (progress between 0 and 100),
  jira_key         text,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check ((kind = 'phase') = (parent_id is null)),
  check (start_date is null or end_date is null or start_date <= end_date)
);
create index wbs_items_project_id_idx on public.wbs_items (project_id);

create table public.risks (
  id                    uuid primary key default gen_random_uuid(),
  project_id            uuid not null references public.projects (id) on delete cascade,
  ref_number            integer not null,
  title                 text not null,
  category              risk_category not null default 'other',
  wbs_item_id           uuid references public.wbs_items (id) on delete set null,
  probability           smallint not null check (probability between 1 and 5),
  impact                smallint not null check (impact between 1 and 5),
  residual_probability  smallint not null check (residual_probability between 1 and 5),
  residual_impact       smallint not null check (residual_impact between 1 and 5),
  response              risk_response not null default 'mitigate',
  trigger_sign          text,
  response_plan         text,
  contingency           text,
  impact_note           text,
  owner_person_id       uuid references public.people (id) on delete set null,
  status                risk_status not null default 'open',
  review_date           date,
  -- Set when the risk came from an automatic suggestion, so it isn't suggested again.
  suggestion_key        text,
  previous_score        smallint,
  score_changed_at      timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (project_id, ref_number)
);
create index risks_project_id_idx on public.risks (project_id);

-- Remember the old score whenever probability or impact changes, for the trend arrow.
create or replace function public.track_risk_score()
returns trigger language plpgsql as $$
begin
  if new.probability * new.impact <> old.probability * old.impact then
    new.previous_score := old.probability * old.impact;
    new.score_changed_at := now();
  end if;
  return new;
end;
$$;

create table public.issues (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects (id) on delete cascade,
  ref_number       integer not null,
  title            text not null,
  action_plan      text,
  severity         issue_severity not null default 'medium',
  source           text,
  risk_id          uuid references public.risks (id) on delete set null,
  owner_person_id  uuid references public.people (id) on delete set null,
  raised_on        date not null default current_date,
  due_date         date,
  status           issue_status not null default 'open',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (project_id, ref_number)
);
create index issues_project_id_idx on public.issues (project_id);

create table public.dismissed_risk_suggestions (
  project_id      uuid not null references public.projects (id) on delete cascade,
  suggestion_key  text not null,
  dismissed_at    timestamptz not null default now(),
  primary key (project_id, suggestion_key)
);

create trigger risks_set_ref_number before insert on public.risks
  for each row execute function public.set_ref_number();
create trigger issues_set_ref_number before insert on public.issues
  for each row execute function public.set_ref_number();
create trigger risks_track_score before update on public.risks
  for each row execute function public.track_risk_score();

create trigger wbs_items_set_updated_at before update on public.wbs_items
  for each row execute function public.set_updated_at();
create trigger risks_set_updated_at before update on public.risks
  for each row execute function public.set_updated_at();
create trigger issues_set_updated_at before update on public.issues
  for each row execute function public.set_updated_at();

alter table public.wbs_items enable row level security;
alter table public.risks enable row level security;
alter table public.issues enable row level security;
alter table public.dismissed_risk_suggestions enable row level security;

create policy "authenticated full access" on public.wbs_items
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.risks
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.issues
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.dismissed_risk_suggestions
  for all to authenticated using (true) with check (true);
