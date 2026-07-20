ALTER TABLE pubs ADD COLUMN sunset_spot boolean DEFAULT false;

-- Mark the best sunset pubs (beachfront west-facing + river views)
UPDATE pubs SET sunset_spot = true WHERE name IN (
  -- Cottesloe (iconic Perth sunsets)
  'Cottesloe Beach Hotel', 'Ocean Beach Hotel', 'Indian Ocean Hotel',
  -- Scarborough beachfront
  'El Grotto', 'Scarborough Beach Bar', 'The Lookout', 'The Lookout Bar', 'The Sandbar', 'Oceans 6019', 'The Peach Pit', 'SKOL',
  -- Hillarys harbour
  '3Sheets on the Harbour', 'The Breakwater Hillarys',
  -- Swanbourne/City Beach
  'Swanbourne Surf Club', 'The Kiosk Floreat Beach',
  -- Trigg
  'Island Market Trigg', 'Yelo Trigg',
  -- Mullaloo/North
  'Mullaloo Beach Hotel', 'Indian Ocean Brewing Company',
  -- Fremantle harbour views
  'Little Creatures', 'Gage Roads Brew Co', 'Running with Thieves',
  -- River sunset views
  'The Left Bank', 'Raffles Hotel', 'The Windsor Hotel',
  -- Mosman Park
  'Mosman Park Hotel'
);;
