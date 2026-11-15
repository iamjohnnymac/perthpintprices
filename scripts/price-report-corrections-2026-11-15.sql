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
--   2. Rosie O'Grady's: marked permanently closed. 205 James St now trades as
--      Johnny Fox's, which already has its own row. Price and price history
--      stay on the old row; nothing is copied to johnny-foxs. The pending
--      stale flag is marked reviewed.
--      Source: https://www.lavishhabits.com.au/venues/johnny-foxs/
--   3. The Flour Factory: marked permanently closed. 16 Queen St is now The
--      Queen's Arms, a different venue that needs its own row and its own
--      sourced price. Price and history stay on the old row. The pending stale
--      flag is marked reviewed.
--      Source: https://www.queensarmsperth.com.au/thequeensarms/
--   4. 7th Ave Bar and Restaurant: beer name "Swan Draght" becomes
--      "Swan Draught". The report row keeps the submitter's spelling.
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
-- site on 15 November 2026 (id, name and every field being changed), and each
-- report must be the single pending report of the expected type and price. If
-- a row has moved, the script raises and changes nothing. A target that is
-- already in its corrected state is skipped, so a second run is a no-op.
--
-- How to run (Supabase SQL editor or psql, as a role that bypasses RLS):
--   Dry run: run the file as is. The last statement calls the function with
--            false. It performs every write, captures before and after, then
--            rolls the writes back and returns the report.
--   Apply:   change the final call to (true) and run the file again.
-- Run the whole file in one go: the function lives in pg_temp, so it exists
-- only for the session that created it and leaves nothing behind.
--
-- After applying: read the four pub rows and the three reports back, then
-- check the public pages. This script cannot expire the site cache, so pages
-- can lag by up to an hour (the pub and list caches both revalidate hourly).

create function pg_temp.price_report_corrections_20261115(p_apply boolean)
returns table (step text, target text, outcome text, before_state jsonb, after_state jsonb)
language plpgsql
as $fn$
declare
  v_results jsonb := '[]'::jsonb;
  v_status_checks text;
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
begin
  -- Inner block = one subtransaction. The dry run leaves it by raising PP001,
  -- which rolls its writes back while keeping the captured report.
  begin
    -- The report dispositions below need both statuses to be legal. The repo
    -- migration for price_reports only lists pending/verified/rejected, so
    -- check the live constraint and stop with a clear message if it differs.
    select string_agg(pg_get_constraintdef(c.oid), ' | ')
      into v_status_checks
      from pg_constraint c
     where c.conrelid = 'public.price_reports'::regclass
       and c.contype = 'c'
       and pg_get_constraintdef(c.oid) ilike '%status%';
    if v_status_checks is not null
       and (v_status_checks not ilike '%''reviewed''%' or v_status_checks not ilike '%''verified''%') then
      raise exception 'price_reports status check does not allow reviewed and verified: %', v_status_checks;
    end if;

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

      if (v_after - c_obh_cols) is distinct from (v_before - c_obh_cols) then
        raise exception 'ocean-beach-hotel: a column outside the happy-hour set changed';
      end if;

      update public.price_reports
         set status = 'verified', verified_at = now(), verified_by = 'admin'
       where id = v_report_ids[1] and status = 'pending';
      if not found then
        raise exception 'ocean-beach-hotel: report % was no longer pending', v_report_ids[1];
      end if;

      v_results := v_results || jsonb_build_object(
        'step', '1 happy hour', 'target', 'ocean-beach-hotel',
        'outcome', format('updated; report %s verified', v_report_ids[1]),
        'before', v_before, 'after', v_after);
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
         or v_pub.business_status is not null then
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

      if (v_after - c_closure_cols) is distinct from (v_before - c_closure_cols) then
        raise exception '%: a column outside the closure set changed', v_closure.slug;
      end if;
      select count(*) into v_history_after from public.price_history where pub_id = v_pub.id;
      if v_history_after <> v_history_before then
        raise exception '%: price history changed (% -> %)', v_closure.slug, v_history_before, v_history_after;
      end if;

      update public.price_reports
         set status = 'reviewed', verified_at = now(), verified_by = 'admin'
       where id = v_report_ids[1] and status = 'pending';
      if not found then
        raise exception '%: report % was no longer pending', v_closure.slug, v_report_ids[1];
      end if;

      v_results := v_results || jsonb_build_object(
        'step', v_closure.step, 'target', v_closure.slug,
        'outcome', format('closed; %s history rows kept; report %s reviewed', v_history_after, v_report_ids[1]),
        'before', v_before, 'after', v_after);
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

      if (v_after - c_typo_cols) is distinct from (v_before - c_typo_cols) then
        raise exception '7th-ave-bar-and-restaurant: a column other than beer_type changed';
      end if;

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

    if not p_apply then
      raise exception using errcode = 'PP001', message = 'dry run';
    end if;
  exception
    when sqlstate 'PP001' then
      null; -- dry run: the writes above are rolled back, v_results is kept
  end;

  return query
    select r.item->>'step', r.item->>'target', r.item->>'outcome', r.item->'before', r.item->'after'
      from jsonb_array_elements(v_results) with ordinality as r(item, ord)
     order by r.ord;
  return query
    select 'mode'::text, null::text,
           case when p_apply then 'APPLIED: the writes above are committed with this statement'
                else 'DRY RUN: the writes above were rolled back, nothing changed' end,
           null::jsonb, null::jsonb;
end;
$fn$;

-- Dry run. Change false to true to apply.
select * from pg_temp.price_report_corrections_20261115(false);
