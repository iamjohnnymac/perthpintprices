-- Migration: hide crowd_reports.ip_hash from the public key
-- Apply manually via the Supabase SQL editor (no app deploy needed first).
--
-- Context
-- -------
-- crowd_reports powers the live "how busy is it" badges. The public site reads
-- it from the browser through get_live_crowd_levels() (a security-invoker
-- plpgsql function, so it runs with the anon role's rights) and inserts with the
-- anon key. The "Anyone can read crowd reports" policy (TO anon USING (true))
-- also exposes the ip_hash column to anyone with the public key. No insert path
-- sets ip_hash today (0 of 5 rows on 26 Sep 2026), so nothing personal is
-- exposed yet, but any future write of ip_hash would be public.
--
-- The pub, level and time are not personal, so rows stay readable: this
-- replaces the anon role's table-wide SELECT privilege with a column grant that
-- leaves out ip_hash. get_live_crowd_levels() reads only pub_id, crowd_level and
-- reported_at, so it keeps working. INSERT privileges and the RLS policies are
-- untouched. Same privacy rule as 20260926000000 and 20260926010000.
--
-- Reversible: grant select on public.crowd_reports to anon;
-- Idempotent: re-running is a no-op.

begin;

revoke select on public.crowd_reports from anon;
grant select (id, pub_id, crowd_level, reported_at) on public.crowd_reports to anon;

commit;

-- Verify with the anon key:
--   GET  /rest/v1/crowd_reports?select=ip_hash                       -> 401/403 permission denied
--   GET  /rest/v1/crowd_reports?select=id,pub_id,crowd_level,reported_at -> 200
--   POST /rest/v1/rpc/get_live_crowd_levels                           -> 200
