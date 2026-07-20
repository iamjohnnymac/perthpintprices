
-- Add personality/vibe tags for pub cards (Arvo rebrand)
ALTER TABLE pubs ADD COLUMN IF NOT EXISTS vibe_tag TEXT;

-- Seed some initial vibe tags based on existing data
UPDATE pubs SET vibe_tag = 'Sunset sessions' WHERE sunset_spot = true AND vibe_tag IS NULL;
UPDATE pubs SET vibe_tag = 'Family-friendly' WHERE kid_friendly = true AND vibe_tag IS NULL;
UPDATE pubs SET vibe_tag = 'Perth institution' WHERE name IN ('The Lucky Shag', 'The Brass Monkey', 'The Moon', 'The Court Hotel', 'Queens Tavern', 'The Cott', 'The Norfolk', 'The Left Bank', 'Sail and Anchor', 'Little Creatures');
UPDATE pubs SET vibe_tag = 'Beachside chill' WHERE suburb IN ('Scarborough', 'Cottesloe', 'Fremantle', 'Hillarys', 'Trigg', 'City Beach', 'Sorrento') AND vibe_tag IS NULL;
UPDATE pubs SET vibe_tag = 'Lively nightspot' WHERE suburb = 'Northbridge' AND vibe_tag IS NULL;
UPDATE pubs SET vibe_tag = 'Hidden gem' WHERE price IS NOT NULL AND price < 8.0 AND vibe_tag IS NULL;
UPDATE pubs SET vibe_tag = 'Local favourite' WHERE vibe_tag IS NULL AND price IS NOT NULL;
UPDATE pubs SET vibe_tag = 'Neighbourhood local' WHERE vibe_tag IS NULL;
;
