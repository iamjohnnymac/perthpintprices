
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON price_history FOR SELECT USING (true);
;
