-- Jira links: which Jira Scrum board a project's sprints live on, and which
-- Jira account a person is (Jira often hides emails, so people are matched by account).

alter table public.projects add column jira_board_id integer;
alter table public.people add column jira_account_id text unique;

-- Boards confirmed for the current projects (matched on project code).
update public.projects p
set jira_board_id = v.board_id
from (values
  ('DL', 28),   -- NSP · Development
  ('GMT', 313),
  ('PB', 279),
  ('FLY', 112),
  ('CHR', 278),
  ('PA', 277),  -- Jira key PRO
  ('NTV', 46)
) as v(code, board_id)
where p.code = v.code;
