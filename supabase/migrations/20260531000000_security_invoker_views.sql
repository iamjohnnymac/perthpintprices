-- Migration: enable security_invoker on two advisor-flagged views
-- Applied: 2026-05-31 (run manually via the Supabase SQL editor; recorded here so
--          the database change is tracked in the repo and reproducible).
--
-- Context
-- -------
-- The Supabase advisor flagged two CRITICAL "Security Definer View" issues:
-- public.price_reporter_leaderboard and public.pub_price_confirmations had no
-- security_invoker option set, so they ran with the view owner's (postgres)
-- privileges and BYPASSED the querying role's RLS.
--
-- Setting security_invoker = on makes each view run with the privileges + RLS of
-- the role that queries it (anon / authenticated) — what the lint wants.
--
-- Verified safe before applying:
--   - price_reporter_leaderboard aggregates public.price_reports, which already
--     has a SELECT policy ("Anyone can read price reports", USING (true)) for the
--     public/anon role. The only reader is GET /api/price-report?leaderboard=true
--     via the anon key, so it sees the same rows as before — no behaviour change.
--   - pub_price_confirmations has no application reader (codebase grep found none),
--     so flipping it has no app impact.
--
-- Reversible: alter view ... set (security_invoker = off);
-- Idempotent: re-running is a no-op.

begin;

alter view public.price_reporter_leaderboard set (security_invoker = on);
alter view public.pub_price_confirmations   set (security_invoker = on);

commit;

-- End state (verified 2026-05-31 via the SQL editor): both views report
-- reloptions {security_invoker=on}; the two "Security Definer View" advisories clear.
