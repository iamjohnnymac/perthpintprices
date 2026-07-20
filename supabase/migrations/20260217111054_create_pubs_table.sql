
-- Create pubs table
CREATE TABLE pubs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  suburb TEXT NOT NULL,
  price DECIMAL(5,2) NOT NULL,
  address TEXT,
  website TEXT,
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  beer_type TEXT,
  happy_hour TEXT,
  context TEXT,
  description TEXT,
  last_updated DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for common queries
CREATE INDEX idx_pubs_suburb ON pubs(suburb);
CREATE INDEX idx_pubs_price ON pubs(price);

-- Enable RLS but allow public read access
ALTER TABLE pubs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read pubs
CREATE POLICY "Allow public read access" ON pubs
  FOR SELECT USING (true);

-- Only service role can insert/update/delete
CREATE POLICY "Service role can manage pubs" ON pubs
  FOR ALL USING (auth.role() = 'service_role');
;
