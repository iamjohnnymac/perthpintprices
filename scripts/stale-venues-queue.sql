-- Stale-venue refresh queue (issue #62).
--
-- Returns pubs that need a price refresh, ranked by priority so the top N can be
-- fed straight to the next refresh batch (crowd nudge, menu scan, or Andrew
-- re-call). Read-only: run in the Supabase SQL editor whenever you size a batch.
--
-- Policy: docs/stale-price-refresh-strategy.md
-- Tiers mirror src/lib/freshness.ts getPriceRecency (fresh <30d, aging 31-90d,
-- stale 91d+, unknown = never verified).

with ranked as (
  select
    slug,
    name,
    suburb,
    price,
    happy_hour_price,
    last_verified,
    price_confidence,
    -- Days since last verification (null when never verified).
    case
      when last_verified is null then null
      else floor(extract(epoch from (now() - last_verified)) / 86400)::int
    end as days_since_verified,
    -- Refresh tier.
    case
      when price is null then 'backfill'            -- no price at all
      when last_verified is null then 'unknown'     -- price set, never verified
      when now() - last_verified > interval '90 days' then 'stale'
      when happy_hour_price is not null
           and now() - last_verified > interval '45 days' then 'promo-stale'
      else 'fresh-ish'
    end as tier,
    -- High-intent suburb band (lower = refresh sooner).
    case lower(suburb)
      when 'perth' then 0
      when 'northbridge' then 0
      when 'fremantle' then 0
      when 'leederville' then 1
      when 'mount lawley' then 1
      when 'subiaco' then 1
      when 'scarborough' then 1
      when 'cottesloe' then 1
      else 2
    end as suburb_priority
  from public.pubs
)
select
  slug,
  name,
  suburb,
  price,
  happy_hour_price,
  days_since_verified,
  price_confidence,
  tier
from ranked
where tier in ('backfill', 'unknown', 'stale', 'promo-stale')
order by
  -- 1) urgent backfill, then stale, then promo, then unknown
  case tier
    when 'backfill' then 0
    when 'stale' then 1
    when 'promo-stale' then 2
    when 'unknown' then 3
  end,
  -- 2) high-traffic suburbs first
  suburb_priority,
  -- 3) cheap outliers are the most visible, refresh them sooner
  (price is not null and price < 9) desc,
  -- 4) oldest verification first within the band
  days_since_verified desc nulls last
limit 200;
