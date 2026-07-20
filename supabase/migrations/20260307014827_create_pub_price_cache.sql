-- Price cache for detecting price drops/changes
-- Used by the cron job to compare current vs previous prices
CREATE TABLE pub_price_cache (
  pub_slug TEXT PRIMARY KEY REFERENCES pubs(slug) ON DELETE CASCADE,
  cached_price NUMERIC,
  cached_happy_hour_price NUMERIC,
  cached_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: allow service role and anon read
ALTER TABLE pub_price_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON pub_price_cache FOR SELECT USING (true);
CREATE POLICY "Service insert/update" ON pub_price_cache FOR ALL USING (true) WITH CHECK (true);

-- Seed cache with current verified prices
INSERT INTO pub_price_cache (pub_slug, cached_price, cached_happy_hour_price)
SELECT slug, price, happy_hour_price
FROM pubs
WHERE price IS NOT NULL AND price_verified = true;;
