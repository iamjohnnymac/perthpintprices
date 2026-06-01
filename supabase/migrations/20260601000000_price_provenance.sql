-- Persist structured provenance for the current price and price-history rows.
-- last_verified remains the existing freshness/indexability timestamp; price_verified_at
-- mirrors it for the specific current price field.

alter table public.pubs
  add column if not exists price_source text,
  add column if not exists price_verified_at timestamptz,
  add column if not exists price_confidence text;

alter table public.price_history
  add column if not exists verified_at timestamptz,
  add column if not exists confidence text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'pubs_price_confidence_check'
      and conrelid = 'public.pubs'::regclass
  ) then
    alter table public.pubs
      add constraint pubs_price_confidence_check
      check (price_confidence is null or price_confidence in ('high', 'medium', 'low'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'price_history_confidence_check'
      and conrelid = 'public.price_history'::regclass
  ) then
    alter table public.price_history
      add constraint price_history_confidence_check
      check (confidence is null or confidence in ('high', 'medium', 'low'));
  end if;
end $$;

update public.pubs
set price_verified_at = last_verified
where price_verified_at is null
  and price is not null
  and last_verified is not null;

update public.price_history
set verified_at = changed_at
where verified_at is null
  and price is not null
  and changed_at is not null;
