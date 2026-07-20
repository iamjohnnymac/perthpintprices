
ALTER TABLE pubs ADD COLUMN slug TEXT UNIQUE;

-- Generate slugs from name: lowercase, replace spaces/special chars with hyphens
UPDATE pubs SET slug = lower(
  regexp_replace(
    regexp_replace(
      regexp_replace(name, '[''&.]', '', 'g'),  -- Remove apostrophes, ampersands, dots
      '[^a-zA-Z0-9\s-]', '', 'g'               -- Remove other special chars
    ),
    '[\s]+', '-', 'g'                           -- Replace spaces with hyphens
  )
);

-- Handle any duplicate slugs by appending suburb
UPDATE pubs p1 SET slug = p1.slug || '-' || lower(regexp_replace(p1.suburb, '[\s]+', '-', 'g'))
WHERE EXISTS (
  SELECT 1 FROM pubs p2 WHERE p2.slug = p1.slug AND p2.id != p1.id
);

-- Make NOT NULL after populating
ALTER TABLE pubs ALTER COLUMN slug SET NOT NULL;

-- Create index for fast lookups
CREATE INDEX idx_pubs_slug ON pubs(slug);
;
