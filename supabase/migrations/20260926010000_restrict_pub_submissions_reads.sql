-- Migration: stop public reads of pub_submissions
-- Apply manually via the Supabase SQL editor after the app change that moves
-- the rate-limit lookup to the service role is live (see below).
--
-- Context
-- -------
-- pub_submissions holds submitter_email and ip_hash. The original
-- "Allow anonymous select" policy (TO anon USING (true), from
-- 20260227060129_create_pub_submissions_table.sql) let anyone with the public
-- anon key read every row through the REST API, which the privacy rule in
-- AGENTS.md forbids. This is the same fix as
-- 20260926000000_restrict_price_reports_reads.sql.
--
-- After this change the anon key can still INSERT submissions ("Allow
-- anonymous inserts" is untouched) but cannot SELECT them. Server code that
-- reads submissions uses the service role, which bypasses RLS:
--   - POST /api/pub-submission daily rate-limit lookup
--   - admin review/stats and the price-check cron (already service role)
-- No view reads pub_submissions.
--
-- Reversible: create policy "Allow anonymous select" on pub_submissions
--             for select to anon using (true);
-- Idempotent: re-running is a no-op.

begin;

drop policy if exists "Allow anonymous select" on public.pub_submissions;

commit;

-- Verify with the anon key (expect zero rows):
--   GET /rest/v1/pub_submissions?select=id
