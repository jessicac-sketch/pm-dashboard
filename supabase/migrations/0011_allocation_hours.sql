-- Allocations are planned in hours per sprint instead of a percent of capacity,
-- so a PM can say "16h on this project" directly. Existing percents are
-- converted using each person's current sprint capacity.

alter table public.allocations add column hours numeric(4, 1);

update public.allocations a
set hours = round(a.percent / 100.0 * p.sprint_capacity_hours * 2) / 2
from public.people p
where p.id = a.person_id;

alter table public.allocations
  alter column hours set not null,
  add constraint allocations_hours_check check (hours > 0 and hours <= 120),
  drop column percent;
