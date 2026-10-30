-- Lets an increase be marked "no remark needed": it stops counting as pending
-- without a reason being typed. A dismissed row may have an empty remark.

alter table public.expense_remarks add column if not exists dismissed boolean not null default false;
alter table public.expense_remarks alter column remark set default '';

-- 0006 required a non-empty remark; now that only applies to rows not marked "no remark needed".
alter table public.expense_remarks drop constraint if exists expense_remarks_remark_check;
alter table public.expense_remarks add constraint expense_remarks_remark_check
  check (dismissed or btrim(remark) <> '');
