
-- Price reports table for crowdsourced price submissions
CREATE TABLE price_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pub_slug TEXT NOT NULL REFERENCES pubs(slug),
  reported_price NUMERIC(5,2) NOT NULL CHECK (reported_price > 0 AND reported_price < 100),
  beer_type TEXT,
  photo_url TEXT,
  reporter_name TEXT DEFAULT 'Anonymous',
  ip_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups by pub
CREATE INDEX idx_price_reports_pub_slug ON price_reports(pub_slug);
CREATE INDEX idx_price_reports_status ON price_reports(status);
CREATE INDEX idx_price_reports_created ON price_reports(created_at DESC);

-- Leaderboard view: top reporters by verified report count
CREATE OR REPLACE VIEW price_reporter_leaderboard AS
SELECT
  reporter_name,
  COUNT(*) FILTER (WHERE status = 'verified') as verified_count,
  COUNT(*) as total_reports,
  MAX(created_at) as last_report
FROM price_reports
WHERE reporter_name IS NOT NULL AND reporter_name != 'Anonymous'
GROUP BY reporter_name
ORDER BY verified_count DESC, total_reports DESC;

-- Enable RLS
ALTER TABLE price_reports ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (anyone can submit a price)
CREATE POLICY "Anyone can submit price reports" ON price_reports
  FOR INSERT WITH CHECK (true);

-- Allow public reads
CREATE POLICY "Anyone can read price reports" ON price_reports
  FOR SELECT USING (true);

-- Recent confirmed reports per pub (for trust indicators)
CREATE OR REPLACE VIEW pub_price_confirmations AS
SELECT
  pub_slug,
  COUNT(*) as report_count,
  AVG(reported_price) as avg_reported_price,
  MAX(created_at) as latest_report,
  EXTRACT(EPOCH FROM (NOW() - MAX(created_at))) / 3600 as hours_since_last
FROM price_reports
WHERE status != 'rejected'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY pub_slug;
;
