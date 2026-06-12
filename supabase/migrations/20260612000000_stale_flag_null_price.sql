-- Migration: allow null reported_price so stale-price flags can insert
-- Run manually via the Supabase SQL editor (repo convention), then record here.
--
-- Context
-- -------
-- The "Report Issue" flow (outdated price flag) has never written a row to
-- production: the API inserted reported_price = 0 as a sentinel, which
-- violates the price_reports_reported_price_check constraint, so every
-- stale flag 500'd. Confirmed 2026-06-12: zero report_type = 'outdated_flag'
-- rows exist.
--
-- The code now inserts reported_price = null for outdated flags. Check
-- constraints pass on null, so the existing reported_price check (left
-- untouched — it predates tracked migrations) no longer blocks the insert.
-- This migration only ensures the column accepts null. If reported_price is
-- already nullable, DROP NOT NULL is a no-op and this script is safe to
-- re-run.

alter table public.price_reports
  alter column reported_price drop not null;
