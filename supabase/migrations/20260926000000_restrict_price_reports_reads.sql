-- Migration: stop public reads of price_reports
-- Applied: 2026-09-26 (run manually via the Supabase SQL editor after PR #283
--          deployed; recorded here so the policy change is tracked in the repo).
--
-- Context
-- -------
-- price_reports holds reporter_name, ip_hash and free-text notes. The original
-- "Anyone can read price reports" policy (USING (true)) let anyone with the
-- public anon key read every row through the REST API, which the privacy rule
-- in AGENTS.md forbids.
--
-- After this change the anon key can still INSERT reports ("Anyone can submit
-- price reports" is untouched) but cannot SELECT them. Server code that needs
-- to read reports uses the service role, which bypasses RLS:
--   - POST /api/price-report and POST /api/menu-scan rate-limit lookups
--   - admin review/stats and the price-check cron (already service role)
-- The public GET /api/price-report (?pub= / ?leaderboard=) had no caller and is
-- removed in the same change.
--
-- price_reporter_leaderboard and pub_price_confirmations are security_invoker
-- views (20260531000000_security_invoker_views.sql), so they follow this RLS
-- and return no rows to anon.
--
-- Reversible: create policy "Anyone can read price reports" on price_reports
--             for select using (true);
-- Idempotent: re-running is a no-op.

begin;

drop policy if exists "Anyone can read price reports" on public.price_reports;

commit;

-- End state (verified 2026-09-26): pg_policies lists only "Anyone can submit
-- price reports" (INSERT); the anon key reads 0 rows from all three below
-- (previously 45 reports, 3 leaderboard rows and 5 confirmation rows).
--
-- Verify with the anon key (expect zero rows from all three):
--   GET /rest/v1/price_reports?select=id
--   GET /rest/v1/price_reporter_leaderboard?select=*
--   GET /rest/v1/pub_price_confirmations?select=*
