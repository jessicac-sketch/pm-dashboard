-- Capacity is planned per 2-week sprint (80h full time), not per week (40h).
-- Existing weekly hours are doubled.

alter table public.people drop constraint if exists people_weekly_capacity_hours_check;
alter table public.people rename column weekly_capacity_hours to sprint_capacity_hours;
update public.people set sprint_capacity_hours = sprint_capacity_hours * 2;
alter table public.people alter column sprint_capacity_hours set default 80;
alter table public.people add constraint people_sprint_capacity_hours_check
  check (sprint_capacity_hours > 0 and sprint_capacity_hours <= 120);
