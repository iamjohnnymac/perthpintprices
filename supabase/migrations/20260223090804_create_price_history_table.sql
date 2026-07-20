
-- Price history: track every price change per pub
CREATE TABLE IF NOT EXISTS price_history (
  id BIGSERIAL PRIMARY KEY,
  pub_id BIGINT NOT NULL REFERENCES pubs(id) ON DELETE CASCADE,
  price NUMERIC(5,2),
  happy_hour_price NUMERIC(5,2),
  beer_type TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  change_type TEXT NOT NULL DEFAULT 'update', -- 'initial', 'update', 'scrape'
  source TEXT -- 'scraper', 'manual', 'user_report'
);

-- Index for fast lookups by pub
CREATE INDEX idx_price_history_pub_id ON price_history(pub_id);
CREATE INDEX idx_price_history_changed_at ON price_history(changed_at);

-- Seed with current prices as initial snapshot
INSERT INTO price_history (pub_id, price, happy_hour_price, beer_type, changed_at, change_type, source)
SELECT id, price, happy_hour_price, beer_type, COALESCE(last_updated, NOW()), 'initial', 'seed'
FROM pubs
WHERE price IS NOT NULL;
;
