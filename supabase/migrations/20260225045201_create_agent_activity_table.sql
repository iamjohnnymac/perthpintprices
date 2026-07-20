
CREATE TABLE agent_activity (
  id SERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  details JSONB DEFAULT '{}',
  status TEXT DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast dashboard queries
CREATE INDEX idx_agent_activity_created ON agent_activity(created_at DESC);
CREATE INDEX idx_agent_activity_category ON agent_activity(category);

-- Enable RLS
ALTER TABLE agent_activity ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write
CREATE POLICY "Service role full access" ON agent_activity
  FOR ALL USING (auth.role() = 'service_role');

-- Insert initial activity
INSERT INTO agent_activity (action, category, details, status) VALUES
  ('Dashboard created', 'system', '{"description": "Admin monitoring dashboard initialized"}', 'success');
;
