-- Migration: RLS lockdown for server-only tables
-- Applied: 2026-05-30 (run manually via the Supabase SQL editor; recorded here so the
--          database policy change is tracked in the repo and reproducible).
--
-- Context
-- -------
-- A security audit found public-role (anon) WRITE and READ policies on three
-- server-only tables. The application code that reads/writes these tables was moved
-- to the service-role key in PR #48 (service-role BYPASSES RLS), so the public
-- policies are no longer needed. Dropping them locks the tables to service-role
-- access only. RLS stays ENABLED on every table.
--
-- Deliberately NOT touched: the public-submission INSERT policies on
-- price_reports / pub_submissions / crowd_reports (the public report forms), and
-- every SELECT policy the public website relies on (pubs, price_history,
-- price_snapshots, etc.). The `pubs` and `agent_activity` ALL policies already
-- restrict writes to `auth.role() = 'service_role'` and were left in place.
--
-- This script is idempotent (DROP POLICY IF EXISTS) and safe to re-run.

begin;

-- Keep RLS on (no-op if already enabled).
alter table public.pub_price_cache    enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.agent_activity     enable row level security;

-- pub_price_cache — internal price cache; written + read only by cron/price-check.
drop policy if exists "Service insert/update" on public.pub_price_cache;  -- was: ALL to {public} USING (true) -- wide open
drop policy if exists "Public read"           on public.pub_price_cache;  -- anon SELECT

-- push_subscriptions — written + read only by the push API routes.
drop policy if exists "Allow insert subscriptions" on public.push_subscriptions;
drop policy if exists "Allow update subscriptions" on public.push_subscriptions;  -- was USING (true): anyone could edit any sub
drop policy if exists "Allow delete subscriptions" on public.push_subscriptions;  -- was USING (true): anyone could delete any sub
drop policy if exists "Allow select subscriptions" on public.push_subscriptions;  -- exposed every push endpoint

-- agent_activity — internal activity log; written + read only by admin/stats.
drop policy if exists "Allow anon to insert agent_activity" on public.agent_activity;
drop policy if exists "Allow anon to read agent_activity"   on public.agent_activity;  -- exposed failed-login IPs
-- Kept: "Service role full access" (ALL ... USING auth.role() = 'service_role').

commit;

-- End state (verified 2026-05-30):
--   pub_price_cache     -> 0 policies  (service-role only)
--   push_subscriptions  -> 0 policies  (service-role only)
--   agent_activity      -> 1 policy    ("Service role full access")
-- All three remain RLS-enabled; reachable only by service-role code.
