-- Dedupe: April Google-discovery import re-created venues that already existed
-- (different name spellings → different slugs). Spotted via SKOL/SKØL showing
-- twice in the Scarborough list; a proximity + normalised-name scan found the
-- rest. Run in the Supabase SQL editor (service role).
--
-- Rule: keep the row with the verified price and clean slug; copy the Google
-- place_id (and image if missing) from the duplicate; re-point any reports;
-- delete the duplicate. None of the deleted ids have price_history rows
-- (checked 10 June 2026).
--
-- NOT touched — plausibly two real venues, your call:
--   133 Petition Brewery        vs 132 Petition Beer Corner   (both $12, State Buildings)
--   330 Blasta Collective       vs 114 Blasta Brewing         (brand may have two sites)
--   463 Brew University (Keg Fills at Campus) vs 465 Campus Brewing (co-located brewery + bar)

begin;

-- ── SKOL / SKØL (35 Ewen St, Scarborough) ──────────────────────────────────
-- Keep 138 (slug "skol", $10 verified). Take the official Ø name + place data.
update pubs set
  name = 'SKØL',
  place_id = coalesce(pubs.place_id, d.place_id),
  image_url = coalesce(pubs.image_url, d.image_url)
from (select place_id, image_url from pubs where id = 893) d
where pubs.id = 138;

-- ── 399 Bar / 399 Small Bar (Northbridge) ──────────────────────────────────
-- Keep 404 (older), give it the short name.
update pubs set name = '399 Bar' where id = 404;

-- ── The Naked Fox (Wanneroo) ────────────────────────────────────────────────
-- Keep 406 (has place_id), short name.
update pubs set name = 'The Naked Fox Wine Bar' where id = 406;

-- ── The Berrigan Bar and Bistro (South Lake) ────────────────────────────────
-- Keep 176 ($10 verified, place_id). 326 is the bare duplicate.

-- ── 7th Ave Bar and Restaurant (Midland) ────────────────────────────────────
-- Keep 151 ($7 verified, place_id). 313 is a re-import; 721 is Google's
-- "loading dock" entry for the same building.

-- ── Brew University (Canning Vale) ──────────────────────────────────────────
-- Keep 463 (has place_id; name notes the Keg Fills change). 521 is a bare
-- re-add of the same name at the same point.

-- ── i Darts NIX (Northbridge) ───────────────────────────────────────────────
-- Keep 205 ($9 verified), take the proper name + place data.
update pubs set
  name = 'i Darts NIX',
  place_id = coalesce(pubs.place_id, d.place_id),
  image_url = coalesce(pubs.image_url, d.image_url)
from (select place_id, image_url from pubs where id = 384) d
where pubs.id = 205;

-- ── Re-point anything that referenced a duplicate ───────────────────────────
update price_reports set pub_slug = 'skol'                       where pub_slug = 'sk-l';
update price_reports set pub_slug = '399-small-bar'              where pub_slug = '399-bar';
update price_reports set pub_slug = 'the-naked-fox-wine-bar-kitchen-and-caf' where pub_slug = 'the-naked-fox-wine-bar';
update price_reports set pub_slug = 'the-berrigan-bar-and-bistro' where pub_slug = 'berrigan-bar-and-bistro';
update price_reports set pub_slug = '7th-ave-bar-and-restaurant' where pub_slug in ('the-7th-ave-bar-and-restaurant', '7th-ave-bar-and-restaurant-loading-dock');
update price_reports set pub_slug = 'idartsnix'                  where pub_slug = 'i-darts-nix-perth';
update price_reports set pub_slug = 'brew-university-now-keg-fills-at-campus' where pub_slug = 'brew-university';

update crowd_reports set pub_id = '138' where pub_id = '893';
update crowd_reports set pub_id = '404' where pub_id = '520';
update crowd_reports set pub_id = '406' where pub_id = '522';
update crowd_reports set pub_id = '176' where pub_id = '326';
update crowd_reports set pub_id = '151' where pub_id in ('313', '721');
update crowd_reports set pub_id = '205' where pub_id = '384';
update crowd_reports set pub_id = '463' where pub_id = '521';

-- ── Delete the duplicates ───────────────────────────────────────────────────
delete from pubs where id in (893, 520, 522, 326, 313, 721, 384, 521);

commit;

-- Verify: each should return exactly one row.
select id, name, slug, price, place_id is not null as has_place
from pubs
where slug in ('skol', '399-small-bar', 'the-naked-fox-wine-bar-kitchen-and-caf',
               'the-berrigan-bar-and-bistro', '7th-ave-bar-and-restaurant', 'idartsnix')
order by id;
