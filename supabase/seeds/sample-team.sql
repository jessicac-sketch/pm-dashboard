-- OPTIONAL starter data so the allocation board has something to show.
-- Run in Supabase SQL Editor after 0011_allocation_hours.sql. Safe to re-run.
-- The allocation hours (per 2-week sprint) below are placeholders; adjust them on the board.

insert into public.projects (name, code, color, status, required_fte) values
  ('Dashboard V2',      'NTV', 'magenta', 'active', 2.5),
  ('Prospect Analyzer', 'PA',  'blue',    'active', 2.0),
  ('Proposal Builder',  'PB',  'teal',    'active', 1.5),
  ('Chronos',           'CHR', 'amber',   'active', 1.5),
  ('Flyers Dashboard',  'FLY', 'violet',  'active', 1.5)
on conflict (code) do nothing;

insert into public.people (full_name, email, title, role, employment_type, sprint_capacity_hours) values
  ('Jeremicah Licup',     'jeremicahl@n-compass.biz', 'Technical Lead',     'developer', 'regular', 80),
  ('Lester Vitor',        'lesterv@n-compass.biz',    'Technical Lead',     'developer', 'regular', 80),
  ('Mark Anthony Pandac', 'markp@n-compass.biz',      'Frontend Developer', 'developer', 'regular', 80),
  ('Dean Barquio',        'deanb@n-compass.biz',      'Frontend Developer', 'developer', 'regular', 80),
  ('Adrian Alenjandrino', 'adriana@n-compass.biz',    'Backend Developer',  'developer', 'regular', 80)
on conflict (email) do nothing;

insert into public.allocations (person_id, project_id, hours)
select p.id, pr.id, v.hours
from (values
  ('jeremicahl@n-compass.biz', 'NTV', 40), ('jeremicahl@n-compass.biz', 'PA', 24), ('jeremicahl@n-compass.biz', 'CHR', 16),
  ('lesterv@n-compass.biz',    'PB',  40), ('lesterv@n-compass.biz',    'FLY', 32), ('lesterv@n-compass.biz',   'PA',  16),
  ('markp@n-compass.biz',      'NTV', 48), ('markp@n-compass.biz',      'FLY', 32),
  ('deanb@n-compass.biz',      'PB',  40), ('deanb@n-compass.biz',      'PA',  20),
  ('adriana@n-compass.biz',    'PA',  40), ('adriana@n-compass.biz',    'CHR', 32)
) as v(email, code, hours)
join public.people p on p.email = v.email
join public.projects pr on pr.code = v.code
on conflict (person_id, project_id) do nothing;
