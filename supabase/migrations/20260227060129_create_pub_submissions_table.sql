
CREATE TABLE pub_submissions (
  id SERIAL PRIMARY KEY,
  pub_name TEXT NOT NULL,
  suburb TEXT NOT NULL,
  address TEXT,
  price DECIMAL(5,2) NOT NULL,
  beer_type TEXT,
  submitter_email TEXT,
  ip_hash TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow anonymous inserts
ALTER TABLE pub_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous inserts" ON pub_submissions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anonymous select" ON pub_submissions FOR SELECT TO anon USING (true);
;
