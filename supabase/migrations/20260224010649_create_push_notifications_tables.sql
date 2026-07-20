
-- App config for VAPID keys and other settings
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push subscriptions linked to watched pubs
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  watched_slugs TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT
);

-- Index for efficient lookup when sending notifications for specific pubs
CREATE INDEX idx_push_subscriptions_watched ON push_subscriptions USING GIN (watched_slugs);

-- RLS policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Allow anonymous reads of public config (VAPID public key)
CREATE POLICY "Allow read public config" ON app_config FOR SELECT USING (key LIKE 'vapid_public%');

-- Allow anonymous insert/update/delete on push_subscriptions (no auth system)
CREATE POLICY "Allow insert subscriptions" ON push_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update subscriptions" ON push_subscriptions FOR UPDATE USING (true);
CREATE POLICY "Allow delete subscriptions" ON push_subscriptions FOR DELETE USING (true);
CREATE POLICY "Allow select subscriptions" ON push_subscriptions FOR SELECT USING (true);

-- Service role can read all config (for private key in API routes)
CREATE POLICY "Service role reads all config" ON app_config FOR SELECT USING (true);
;
