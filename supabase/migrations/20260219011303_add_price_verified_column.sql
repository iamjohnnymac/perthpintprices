
-- Add price_verified boolean column
-- Default TRUE for existing pubs (they came from verified scrape sources)
ALTER TABLE pubs ADD COLUMN price_verified BOOLEAN NOT NULL DEFAULT true;

-- Also make price nullable so unverified pubs can have NULL price
ALTER TABLE pubs ALTER COLUMN price DROP NOT NULL;
;
