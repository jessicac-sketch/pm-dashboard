-- Each charge belongs to the monthly statement it was imported from, not the
-- calendar month of its date: a January statement also carries charges from
-- Dec 29–31, and those must count as January when comparing months.

alter table public.expenses add column if not exists statement_month date;

update public.expenses
set statement_month = date_trunc('month', occurred_on)::date
where statement_month is null;

-- Rows inserted without a statement month (e.g. by hand) fall back to their date's month.
create or replace function public.set_expense_statement_month()
returns trigger
language plpgsql
as $$
begin
  if new.statement_month is null then
    new.statement_month := date_trunc('month', new.occurred_on)::date;
  else
    new.statement_month := date_trunc('month', new.statement_month)::date;
  end if;
  return new;
end;
$$;

drop trigger if exists expenses_statement_month on public.expenses;
create trigger expenses_statement_month
before insert or update of statement_month, occurred_on on public.expenses
for each row execute function public.set_expense_statement_month();

alter table public.expenses alter column statement_month set not null;
create index if not exists expenses_statement_month_idx on public.expenses (statement_month);
