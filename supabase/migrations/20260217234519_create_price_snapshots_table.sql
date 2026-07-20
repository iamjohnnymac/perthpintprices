
-- Perth Pint Index: Weekly price snapshots for historical tracking
CREATE TABLE price_snapshots (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  avg_price NUMERIC(5,2) NOT NULL,
  median_price NUMERIC(5,2) NOT NULL,
  min_price NUMERIC(5,2) NOT NULL,
  max_price NUMERIC(5,2) NOT NULL,
  total_pubs INTEGER NOT NULL,
  total_suburbs INTEGER NOT NULL,
  cheapest_suburb TEXT,
  cheapest_suburb_avg NUMERIC(5,2),
  most_expensive_suburb TEXT,
  most_expensive_suburb_avg NUMERIC(5,2),
  price_distribution JSONB, -- e.g. {"6.00-7.00": 12, "7.01-8.00": 45, ...}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(snapshot_date)
);

-- Enable RLS but allow public read
ALTER TABLE price_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON price_snapshots FOR SELECT USING (true);

-- Index for date queries
CREATE INDEX idx_price_snapshots_date ON price_snapshots(snapshot_date DESC);
;
