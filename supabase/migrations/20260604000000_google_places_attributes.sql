-- Google Places (New) attribute backfill columns.
-- Sourced from the Place Details endpoint over stored place_ids (one
-- Enterprise+Atmosphere call per pub; see scripts/backfill-place-attributes.mjs).
-- These are stored SEPARATELY from the hand-curated has_tab/kid_friendly/cozy_pub/
-- sunset_spot columns so curation always wins and Google only fills gaps.
-- google_attrs_updated_at is the provenance/freshness stamp for the whole set.

alter table public.pubs
  add column if not exists serves_beer boolean,
  add column if not exists serves_food boolean,
  add column if not exists outdoor_seating boolean,
  add column if not exists good_for_children boolean,
  add column if not exists good_for_groups boolean,
  add column if not exists good_for_watching_sports boolean,
  add column if not exists allows_dogs boolean,
  add column if not exists live_music boolean,
  add column if not exists restroom boolean,
  add column if not exists reservable boolean,
  add column if not exists google_rating numeric(2, 1),
  add column if not exists google_rating_count integer,
  add column if not exists google_price_level text,
  add column if not exists business_status text,
  add column if not exists google_editorial_summary text,
  add column if not exists google_opening_hours jsonb,
  add column if not exists google_attrs_updated_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'pubs_google_rating_check'
      and conrelid = 'public.pubs'::regclass
  ) then
    alter table public.pubs
      add constraint pubs_google_rating_check
      check (google_rating is null or (google_rating >= 0 and google_rating <= 5));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'pubs_business_status_check'
      and conrelid = 'public.pubs'::regclass
  ) then
    alter table public.pubs
      add constraint pubs_business_status_check
      check (business_status is null or business_status in (
        'OPERATIONAL', 'CLOSED_TEMPORARILY', 'CLOSED_PERMANENTLY'
      ));
  end if;
end $$;
