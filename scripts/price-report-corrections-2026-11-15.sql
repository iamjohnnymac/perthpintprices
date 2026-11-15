-- Price report corrections, review of 15 November 2026.
--
-- STATUS: prepared for review. Not applied. Applying it is a live data write
-- and needs the owner's approval plus a read-back (AGENTS.md, Rigorous route).
--
-- Why a script: the admin Approve button cannot make these corrections.
--   - Approve on a happy-hour report writes happy_hour_price only. It leaves
--     the stored days, times and display text as they were.
--   - Approve on a stale flag only marks the report. It never touches the pub.
--   - Nothing in the admin edits a beer name.
--
-- What it does, all in one transaction:
--   1. Ocean Beach Hotel: happy hour becomes $8, Mon-Fri 6-7pm. The regular
--      price and its provenance are not touched. The pending happy-hour report
--      is marked verified.
--      Source: https://www.obh.com.au/s/OBH_Saloon-Bar_Menu_Winter-26-egml.pdf
--      (page 1: $8 pints, Mon-Fri 6pm-7pm).
--   2. Rosie O'Grady's: business_status set to CLOSED_PERMANENTLY. 205 James St
--      now trades as Johnny Fox's, which already has its own row. Price and
--      price history stay on the old row; nothing is copied to johnny-foxs.
--      The pending stale flag is marked reviewed.
--      Source: https://www.lavishhabits.com.au/venues/johnny-foxs/
--   3. The Flour Factory: business_status set to CLOSED_PERMANENTLY. 16 Queen St
--      is now The Queen's Arms, a different venue that needs its own row and its own
--      sourced price. Price and history stay on the old row. The pending stale
--      flag is marked reviewed.
--      Source: https://www.queensarmsperth.com.au/thequeensarms/
--   4. 7th Ave Bar and Restaurant: beer name "Swan Draght" becomes
--      "Swan Draught". The report row keeps the submitter's spelling.
--
-- What CLOSED_PERMANENTLY does in the app, beyond the column itself:
--   - the pub page is noindexed and dropped from the sitemap;
--   - it is removed from suburb, nearby and discover links;
--   - the pub page shows a notice that reads "Google lists <name> as
--     permanently closed" (src/app/[suburb]/[pub]/PubDetailClient.tsx).
--   No redirect is created.
--
-- OPEN BEFORE APPLY (owner decision, steps 2 and 3):
--   a. That notice names Google as the source. These two closures are sourced
--      from the operators' own sites, not Google. Either confirm Google also
--      lists both venues as permanently closed, or make the notice
--      source-neutral first. Otherwise the page states a source it does not
--      have.
--   b. business_status is refreshed from Google for every pub with a place_id
--      (scripts/backfill-place-attributes.mjs, monthly via
--      .github/workflows/places-refresh.yml). Both rows had no place_id on
--      15 November and the script requires that, so the refresh skips them
--      today. If a place_id is attached later, the next refresh can overwrite
--      the closure with whatever Google returns.
--
-- What it leaves alone, and reports as held:
--   - Ezra Pound ($6 happy hour, looks like a schooner, pint unsupported).
--   - North Beach Hotel (stale flag, venue identity unconfirmed).
--   Their pending reports are counted before and after and must not change.
--
-- Atomicity: every write happens inside one PL/pgSQL function call, which is
-- one statement and so one transaction. Any failed guard raises, and Postgres
-- rolls back every write in the call. Do not port this to separate REST or
-- supabase-js requests: those commit one at a time and can leave a pub
-- updated with its report still pending.
--
-- Guards fail closed. Each target must be exactly the row read from the public
-- site on 15 November 2026 (id, name and every field being changed; for the
-- two closures that means business_status NULL and place_id NULL), and each
-- report must be the single pending report of the expected type and price. If
-- a row has moved, the script raises and changes nothing. A target whose pub
-- AND report are both already settled is skipped, so a second run writes
-- nothing and says so. A half-applied target (pub corrected, report still
-- pending, or the reverse) raises.
--
-- How to run (Supabase SQL editor or psql, as a role that bypasses RLS):
--   Dry run: run the file as is. The last statement calls the function with
--            false.
--   Apply:   change the final call to (true) and run the whole file again.
--   psql:    use `psql -v ON_ERROR_STOP=1 -f <file>` so an error stops the run.
-- Run the whole file in one go, never the final select on its own. The file
-- drops and recreates the function each run so an edited body cannot be
-- shadowed by an older copy left in the same session. The function lives in
-- pg_temp and goes away when the session ends.
--
-- THE DRY RUN IS NOT READ-ONLY. It executes every UPDATE for real inside a
-- subtransaction, captures before and after, then rolls that subtransaction
-- back. While it runs, and in ways that survive the rollback:
--   - it locks the four pub rows and three report rows until the statement
--     ends. An admin Approve or a places refresh touching those rows waits,
--     and the dry run itself waits on anyone else holding them;
--   - every UPDATE trigger on pubs and price_reports fires. Rows and NOTIFYs
--     a trigger produces are rolled back, but sequence values it consumes
--     stay consumed, and a trigger that calls out synchronously (http,
--     dblink) is not undone. The repo migrations define no UPDATE triggers
--     on these tables; the live database has not been checked;
--   - it needs write access: it fails on a read replica or in a read-only
--     transaction.
-- The row data is unchanged afterwards. Treat a dry run as a short write
-- window on production, not as a query.
--
-- Under autocommit an apply commits when the final statement returns. Inside
-- an explicit BEGIN it commits only at your COMMIT.
--
-- Other pending reports on the four target pubs are not touched. The output
-- lists any that remain so they are not missed.
--
-- After applying: read the four pub rows and the three reports back, then
-- check the public pages. This script cannot expire the site cache, so pages
-- can lag by up to an hour (the pub and list caches both revalidate hourly).

drop function if exists pg_temp.price_report_corrections_20261115(boolean);

create function pg_temp.price_report_corrections_20261115(p_apply boolean)
returns table (step text, target text, outcome text, before_state jsonb, after_state jsonb)
language plpgsql
as $fn$
declare
  v_results jsonb := '[]'::jsonb;
  v_writes int := 0;
  v_check record;
  v_report_before jsonb;
  v_report_after jsonb;
  v_other_pending jsonb;
  v_pub pubs%rowtype;
  v_before jsonb;
  v_after jsonb;
  v_report_ids uuid[];
  v_history_before bigint;
  v_history_after bigint;
  v_held_before jsonb;
  v_held_after jsonb;
  v_closure record;
  -- Columns this script is allowed to change, per step.
  c_obh_cols constant text[] := array[
    'happy_hour', 'happy_hour_price', 'happy_hour_days', 'happy_hour_start', 'happy_hour_end', 'last_updated'];
  c_closure_cols constant text[] := array['business_status', 'last_updated'];
  c_typo_cols constant text[] := array['beer_type'];
  c_held_slugs constant text[] := array['ezra-pound', 'north-beach-hotel'];
  c_target_slugs constant text[] := array[
    'ocean-beach-hotel', 'rosie-ogradys', 'the-flour-factory', '7th-ave-bar-and-restaurant'];
  -- Recorded on the report so a scripted disposition is distinguishable from
  -- an admin clicking Approve.
  c_verified_by constant text := 'script:price-report-corrections-2026-11-15';
begin
  -- Inner block = one subtransaction. The dry run leaves it by raising PP001,
  -- which rolls its writes back while keeping the captured report.
  begin
    -- The report dispositions below need both statuses to be legal. The repo
    -- migration for price_reports only lists pending/verified/rejected, so
    -- check the live constraint and stop with a clear message if it differs.
    -- Each constraint is tested on its own, so a different check that happens
    -- to mention 'reviewed' cannot make this pass. If the shape is one this
    -- does not recognise, the UPDATEs below still fail on the constraint and
    -- everything rolls back.
    for v_check in
      select c.conname, pg_get_constraintdef(c.oid) as def
        from pg_constraint c
       where c.conrelid = 'public.price_reports'::regclass
         and c.contype = 'c'
         and pg_get_constraintdef(c.oid) ~* '(^|[^_a-z0-9])status(\)|::[a-z ]+)*\s*(=|in\M)'
    loop
      if v_check.def not ilike '%''reviewed''%' or v_check.def not ilike '%''verified''%' then
        raise exception 'price_reports constraint % does not allow both reviewed and verified: %',
          v_check.conname, v_check.def;
      end if;
    end loop;

    select coalesce(jsonb_object_agg(s.slug, s.pending), '{}'::jsonb)
      into v_held_before
      from (
        select h.slug,
               (select coalesce(jsonb_agg(jsonb_build_object(
                         'id', r.id, 'status', r.status, 'report_type', r.report_type,
                         'reported_price', r.reported_price) order by r.id), '[]'::jsonb)
                  from public.price_reports r
                 where r.pub_slug = h.slug and r.status = 'pending') as pending
          from unnest(c_held_slugs) as h(slug)
      ) s;

    -- ── 1. Ocean Beach Hotel: happy-hour price, schedule and display text ──
    select * into v_pub from public.pubs where slug = 'ocean-beach-hotel' for update;
    if not found then
      raise exception 'ocean-beach-hotel: pub row not found';
    end if;
    v_before := to_jsonb(v_pub);

    select array_agg(r.id order by r.id) into v_report_ids
      from public.price_reports r
     where r.pub_slug = 'ocean-beach-hotel'
       and r.status = 'pending'
       and r.report_type = 'happy_hour_report'
       and r.reported_price = 8.00;

    if v_pub.happy_hour_price = 8.00
       and v_pub.happy_hour_days = '{Mon,Tue,Wed,Thu,Fri}'
       and v_pub.happy_hour_start = time '18:00'
       and v_pub.happy_hour_end = time '19:00'
       and v_pub.happy_hour = 'Mon-Fri 6-7pm'
       and v_report_ids is null then
      v_results := v_results || jsonb_build_object(
        'step', '1 happy hour', 'target', 'ocean-beach-hotel',
        'outcome', 'skipped: already corrected', 'before', v_before, 'after', v_before);
    else
      if v_pub.id is distinct from 74
         or v_pub.name is distinct from 'Ocean Beach Hotel'
         or v_pub.price is distinct from 9.00
         or v_pub.happy_hour is distinct from 'Daily 4-6pm'
         or v_pub.happy_hour_price is not null
         or v_pub.happy_hour_days is distinct from '{Mon,Tue,Wed,Thu,Fri,Sat,Sun}'
         or v_pub.happy_hour_start is distinct from time '16:00'
         or v_pub.happy_hour_end is distinct from time '18:00'
         or v_pub.business_status is not distinct from 'CLOSED_PERMANENTLY' then
        raise exception 'ocean-beach-hotel: row is not in the expected state: %', v_before;
      end if;
      if v_report_ids is null or cardinality(v_report_ids) <> 1 then
        raise exception 'ocean-beach-hotel: expected exactly one pending $8 happy-hour report, found %',
          coalesce(cardinality(v_report_ids), 0);
      end if;

      update public.pubs
         set happy_hour_price = 8.00,
             happy_hour_days = '{Mon,Tue,Wed,Thu,Fri}',
             happy_hour_start = time '18:00',
             happy_hour_end = time '19:00',
             happy_hour = 'Mon-Fri 6-7pm',
             last_updated = now()
       where id = v_pub.id
      returning to_jsonb(pubs.*) into v_after;

      if v_after is null then
        raise exception 'ocean-beach-hotel: the pub update matched no row';
      end if;
      if (v_after - c_obh_cols) is distinct from (v_before - c_obh_cols) then
        raise exception 'ocean-beach-hotel: a column outside the happy-hour set changed';
      end if;

      update public.price_reports r
         set status = 'verified', verified_at = now(), verified_by = c_verified_by
       where r.id = v_report_ids[1] and r.status = 'pending'
      returning jsonb_build_object('id', r.id, 'status', r.status, 'verified_by', r.verified_by)
        into v_report_after;
      if v_report_after is null or v_report_after->>'status' is distinct from 'verified' then
        raise exception 'ocean-beach-hotel: report % did not end up verified: %', v_report_ids[1], v_report_after;
      end if;
      v_writes := v_writes + 2;

      v_results := v_results || jsonb_build_object(
        'step', '1 happy hour', 'target', 'ocean-beach-hotel',
        'outcome', format('updated; report %s verified', v_report_ids[1]),
        'before', v_before || jsonb_build_object('_report', jsonb_build_object('id', v_report_ids[1], 'status', 'pending')),
        'after', v_after || jsonb_build_object('_report', v_report_after));
    end if;

    -- ── 2 and 3. Confirmed legacy closures, history preserved ──────────────
    for v_closure in
      select * from (values
        ('2 closure', 'rosie-ogradys', 9, 'Rosie O''Grady''s', '205 James Street, Northbridge WA', 'johnny-foxs'),
        ('3 closure', 'the-flour-factory', 69, 'The Flour Factory', '16 Queen Street, Perth WA', null)
      ) as t(step, slug, id, name, address, successor_slug)
    loop
      select * into v_pub from public.pubs where slug = v_closure.slug for update;
      if not found then
        raise exception '%: pub row not found', v_closure.slug;
      end if;
      v_before := to_jsonb(v_pub);

      select array_agg(r.id order by r.id) into v_report_ids
        from public.price_reports r
       where r.pub_slug = v_closure.slug
         and r.status = 'pending'
         and r.report_type = 'outdated_flag';

      if v_pub.business_status = 'CLOSED_PERMANENTLY' and v_report_ids is null then
        v_results := v_results || jsonb_build_object(
          'step', v_closure.step, 'target', v_closure.slug,
          'outcome', 'skipped: already closed', 'before', v_before, 'after', v_before);
        continue;
      end if;

      if v_pub.id is distinct from v_closure.id
         or v_pub.name is distinct from v_closure.name
         or v_pub.address is distinct from v_closure.address
         or v_pub.business_status is not null
         -- A place_id would put this row in the monthly Google refresh, which
         -- rewrites business_status. Stop and let a person decide.
         or v_pub.place_id is not null then
        raise exception '%: row is not in the expected state: %', v_closure.slug, v_before;
      end if;
      if v_report_ids is null or cardinality(v_report_ids) <> 1 then
        raise exception '%: expected exactly one pending stale flag, found %',
          v_closure.slug, coalesce(cardinality(v_report_ids), 0);
      end if;
      -- Closing a duplicate is only safe while the successor row is live.
      if v_closure.successor_slug is not null and not exists (
        select 1 from public.pubs s
         where s.slug = v_closure.successor_slug
           and s.business_status is distinct from 'CLOSED_PERMANENTLY'
      ) then
        raise exception '%: successor row % is missing or closed', v_closure.slug, v_closure.successor_slug;
      end if;

      select count(*) into v_history_before from public.price_history where pub_id = v_pub.id;

      update public.pubs
         set business_status = 'CLOSED_PERMANENTLY',
             last_updated = now()
       where id = v_pub.id
      returning to_jsonb(pubs.*) into v_after;

      if v_after is null then
        raise exception '%: the pub update matched no row', v_closure.slug;
      end if;
      if (v_after - c_closure_cols) is distinct from (v_before - c_closure_cols) then
        raise exception '%: a column outside the closure set changed', v_closure.slug;
      end if;
      select count(*) into v_history_after from public.price_history where pub_id = v_pub.id;
      if v_history_after <> v_history_before then
        raise exception '%: price history changed (% -> %)', v_closure.slug, v_history_before, v_history_after;
      end if;

      update public.price_reports r
         set status = 'reviewed', verified_at = now(), verified_by = c_verified_by
       where r.id = v_report_ids[1] and r.status = 'pending'
      returning jsonb_build_object('id', r.id, 'status', r.status, 'verified_by', r.verified_by)
        into v_report_after;
      if v_report_after is null or v_report_after->>'status' is distinct from 'reviewed' then
        raise exception '%: report % did not end up reviewed: %', v_closure.slug, v_report_ids[1], v_report_after;
      end if;
      v_writes := v_writes + 2;

      v_results := v_results || jsonb_build_object(
        'step', v_closure.step, 'target', v_closure.slug,
        'outcome', format('closed; %s history rows kept; report %s reviewed', v_history_after, v_report_ids[1]),
        'before', v_before || jsonb_build_object('_report', jsonb_build_object('id', v_report_ids[1], 'status', 'pending')),
        'after', v_after || jsonb_build_object('_report', v_report_after));
    end loop;

    -- ── 4. 7th Ave: exact beer-name typo ───────────────────────────────────
    select * into v_pub from public.pubs where slug = '7th-ave-bar-and-restaurant' for update;
    if not found then
      raise exception '7th-ave-bar-and-restaurant: pub row not found';
    end if;
    v_before := to_jsonb(v_pub);

    if v_pub.beer_type = 'Swan Draught' then
      v_results := v_results || jsonb_build_object(
        'step', '4 beer name', 'target', '7th-ave-bar-and-restaurant',
        'outcome', 'skipped: already corrected', 'before', v_before, 'after', v_before);
    else
      if v_pub.id is distinct from 151
         or v_pub.name is distinct from '7th Ave Bar and Restaurant'
         or v_pub.beer_type is distinct from 'Swan Draght' then
        raise exception '7th-ave-bar-and-restaurant: row is not in the expected state: %', v_before;
      end if;

      update public.pubs
         set beer_type = 'Swan Draught'
       where id = v_pub.id
      returning to_jsonb(pubs.*) into v_after;

      if v_after is null then
        raise exception '7th-ave-bar-and-restaurant: the pub update matched no row';
      end if;
      if (v_after - c_typo_cols) is distinct from (v_before - c_typo_cols) then
        raise exception '7th-ave-bar-and-restaurant: a column other than beer_type changed';
      end if;

      v_writes := v_writes + 1;
      v_results := v_results || jsonb_build_object(
        'step', '4 beer name', 'target', '7th-ave-bar-and-restaurant',
        'outcome', 'updated', 'before', v_before, 'after', v_after);
    end if;

    -- ── Held rows: must be exactly as found ────────────────────────────────
    select coalesce(jsonb_object_agg(s.slug, s.pending), '{}'::jsonb)
      into v_held_after
      from (
        select h.slug,
               (select coalesce(jsonb_agg(jsonb_build_object(
                         'id', r.id, 'status', r.status, 'report_type', r.report_type,
                         'reported_price', r.reported_price) order by r.id), '[]'::jsonb)
                  from public.price_reports r
                 where r.pub_slug = h.slug and r.status = 'pending') as pending
          from unnest(c_held_slugs) as h(slug)
      ) s;
    if v_held_after is distinct from v_held_before then
      raise exception 'held reports changed: % -> %', v_held_before, v_held_after;
    end if;
    v_results := v_results || jsonb_build_object(
      'step', 'held', 'target', array_to_string(c_held_slugs, ', '),
      'outcome', 'left pending, untouched', 'before', v_held_before, 'after', v_held_after);

    -- Anything else still pending on the four targets is out of scope here.
    -- List it so it is not mistaken for handled.
    select coalesce(jsonb_agg(jsonb_build_object(
             'id', r.id, 'pub_slug', r.pub_slug, 'report_type', r.report_type,
             'reported_price', r.reported_price) order by r.pub_slug, r.id), '[]'::jsonb)
      into v_other_pending
      from public.price_reports r
     where r.pub_slug = any (c_target_slugs) and r.status = 'pending';
    v_results := v_results || jsonb_build_object(
      'step', 'other pending', 'target', array_to_string(c_target_slugs, ', '),
      'outcome', format('%s other pending report(s) on the target pubs, not touched',
                        jsonb_array_length(v_other_pending)),
      'before', v_other_pending, 'after', v_other_pending);

    if not p_apply then
      raise exception using errcode = 'PP001', message = 'dry run';
    end if;
  exception
    when sqlstate 'PP001' then
      -- Only the dry run may leave this way. If something else raised PP001
      -- during an apply, the writes are gone: say so by failing.
      if p_apply then
        raise;
      end if;
  end;

  return query
    select r.item->>'step', r.item->>'target', r.item->>'outcome', r.item->'before', r.item->'after'
      from jsonb_array_elements(v_results) with ordinality as r(item, ord)
     order by r.ord;
  return query
    select 'mode'::text, null::text,
           case
             when not p_apply then format(
               'DRY RUN: %s write(s) were executed and rolled back; row data is unchanged. Not read-only: see the file header.',
               v_writes)
             when v_writes = 0 then 'APPLY: nothing to do, every step was already in its corrected state'
             else format(
               'APPLY: %s write(s) made. Committed when this statement returns under autocommit, otherwise at your COMMIT.',
               v_writes)
           end,
           null::jsonb, null::jsonb;
end;
$fn$;

-- Dry run. Change false to true to apply.
select * from pg_temp.price_report_corrections_20261115(false);
