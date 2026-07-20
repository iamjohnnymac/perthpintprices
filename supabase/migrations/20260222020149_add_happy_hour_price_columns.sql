
ALTER TABLE pubs ADD COLUMN IF NOT EXISTS happy_hour_price DECIMAL(5,2);
ALTER TABLE pubs ADD COLUMN IF NOT EXISTS happy_hour_days TEXT;
ALTER TABLE pubs ADD COLUMN IF NOT EXISTS happy_hour_start TIME;
ALTER TABLE pubs ADD COLUMN IF NOT EXISTS happy_hour_end TIME;

COMMENT ON COLUMN pubs.happy_hour_price IS 'Pint price during happy hour (NULL if no happy hour)';
COMMENT ON COLUMN pubs.happy_hour_days IS 'Days happy hour applies, e.g. Mon-Fri, 7 days, Tue-Thu';
COMMENT ON COLUMN pubs.happy_hour_start IS 'Happy hour start time';
COMMENT ON COLUMN pubs.happy_hour_end IS 'Happy hour end time';
;
