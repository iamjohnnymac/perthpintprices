ALTER TABLE pubs ADD COLUMN kid_friendly boolean DEFAULT false;

-- Mark verified kid-friendly pubs (from Buggybuddys + UrbanList research)
UPDATE pubs SET kid_friendly = true WHERE id IN (
  152, -- Bassendean Hotel
  165, -- Bayswater Hotel
  10,  -- Bentley Hotel
  23,  -- Clancy's Fish Pub
  104, -- Gage Roads Brew Co
  162, -- Guildford Hotel
  103, -- Little Creatures
  167, -- Parkerville Tavern
  11,  -- Stirling Arms Hotel (Percy's Paddock)
  118, -- The Camfield
  150, -- The Morris
  34   -- Victoria Park Hotel
);;
