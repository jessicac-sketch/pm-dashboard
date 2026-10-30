-- Whether someone works on the frontend, the backend, or both, so the
-- allocation board can show it at a glance. Optional: not every role has one.

do $$
begin
  create type public.dev_stack as enum ('frontend', 'backend', 'fullstack');
exception
  when duplicate_object then null;
end
$$;

alter table public.people add column if not exists stack public.dev_stack;
