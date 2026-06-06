-- Google Places (New) photo + attribution columns.
-- One photo per pub, sourced from the Place Photos endpoint during the monthly
-- Places attribute sweep (scripts/backfill-place-attributes.mjs). Stored SEPARATELY
-- from the hand-curated image_url so curation always wins and Google only fills gaps.
--
-- COMPLIANCE: per the Google Places API policy these are a *refreshed cache* — the
-- monthly sweep re-resolves the photo URL + attribution (staying inside Google's
-- permitted caching window), and the UI MUST display the contributor attribution
-- (google_photo_attribution + its uri) alongside the image. google_attrs_updated_at
-- (added in the attributes migration) stamps the refresh for the whole set.

alter table public.pubs
  add column if not exists google_photo_url text,
  add column if not exists google_photo_attribution text,
  add column if not exists google_photo_attribution_uri text;
