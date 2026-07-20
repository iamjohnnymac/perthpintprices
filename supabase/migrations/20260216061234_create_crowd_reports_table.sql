
-- Crowd reports table for live pub busyness
CREATE TABLE crowd_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pub_id TEXT NOT NULL,
  crowd_level INTEGER NOT NULL CHECK (crowd_level >= 1 AND crowd_level <= 4),
  -- 1=Empty, 2=Moderate, 3=Busy, 4=Packed
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  ip_hash TEXT -- For basic spam prevention (hashed, not raw IP)
);

-- Index for fast lookups by pub
CREATE INDEX idx_crowd_reports_pub_id ON crowd_reports(pub_id);

-- Index for getting recent reports
CREATE INDEX idx_crowd_reports_recent ON crowd_reports(reported_at DESC);

-- Enable Row Level Security
ALTER TABLE crowd_reports ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (anonymous reports)
CREATE POLICY "Anyone can report crowd levels"
  ON crowd_reports
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anyone to read reports
CREATE POLICY "Anyone can read crowd reports"
  ON crowd_reports
  FOR SELECT
  TO anon
  USING (true);

-- Function to get latest crowd level for each pub (within last 3 hours)
CREATE OR REPLACE FUNCTION get_live_crowd_levels()
RETURNS TABLE (
  pub_id TEXT,
  crowd_level INTEGER,
  report_count BIGINT,
  latest_report TIMESTAMPTZ,
  minutes_ago INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cr.pub_id,
    MODE() WITHIN GROUP (ORDER BY cr.crowd_level) as crowd_level,
    COUNT(*) as report_count,
    MAX(cr.reported_at) as latest_report,
    EXTRACT(EPOCH FROM (NOW() - MAX(cr.reported_at)))::INTEGER / 60 as minutes_ago
  FROM crowd_reports cr
  WHERE cr.reported_at > NOW() - INTERVAL '3 hours'
  GROUP BY cr.pub_id;
END;
$$ LANGUAGE plpgsql;
;
