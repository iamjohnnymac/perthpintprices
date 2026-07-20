
ALTER TABLE pubs ADD COLUMN IF NOT EXISTS last_verified TIMESTAMPTZ;
ALTER TABLE pubs ADD COLUMN IF NOT EXISTS price_source TEXT;

-- Set existing pubs to a reasonable default (when they were originally added)
UPDATE pubs SET last_verified = created_at WHERE last_verified IS NULL AND price_verified = true;

COMMENT ON COLUMN pubs.last_verified IS 'When the price was last verified from a trusted source';
COMMENT ON COLUMN pubs.price_source IS 'Source of the price data (e.g. eatdrinkcheap, thehappiesthour, user_submission)';
;
