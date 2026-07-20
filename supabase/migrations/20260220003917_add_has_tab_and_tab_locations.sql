
-- Add has_tab column to pubs table
ALTER TABLE pubs ADD COLUMN IF NOT EXISTS has_tab boolean DEFAULT false;

-- Create tab_locations table for dedicated TAB agencies
CREATE TABLE IF NOT EXISTS tab_locations (
  id serial PRIMARY KEY,
  name text NOT NULL,
  address text,
  suburb text,
  lat double precision,
  lng double precision,
  type text DEFAULT 'agency', -- 'agency' or 'self_service'
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tab_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON tab_locations FOR SELECT USING (true);
;
