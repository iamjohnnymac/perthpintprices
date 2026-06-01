-- Add structured report-level provenance for every pending price candidate.
-- Canonical pub price provenance still lives on public.pubs and is populated
-- only when an admin approves a report.

alter table public.price_reports
  add column if not exists submission_source text default 'manual',
  add column if not exists source_url text,
  add column if not exists evidence_text text,
  add column if not exists observed_at timestamptz,
  add column if not exists raw_extraction jsonb,
  add column if not exists extractor_version text;

update public.price_reports
set submission_source = case
  when report_type = 'outdated_flag' then 'stale_flag'
  when lower(coalesce(notes, '')) like '%menu scan%' then 'menu_scan'
  when lower(coalesce(notes, '')) like '%[source:tier-c-report-hero]%' then 'tier_c_report_hero'
  when lower(coalesce(notes, '')) like '%[source:tier_c_report_hero]%' then 'tier_c_report_hero'
  else 'manual'
end
where submission_source is null
   or submission_source = 'manual';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'price_reports_submission_source_check'
      and conrelid = 'public.price_reports'::regclass
  ) then
    alter table public.price_reports
      add constraint price_reports_submission_source_check
      check (
        submission_source in (
          'manual',
          'menu_scan',
          'tier_c_report_hero',
          'official_menu',
          'venue_submission',
          'community_bounty',
          'aggregator_lead',
          'stale_flag'
        )
      );
  end if;
end $$;
