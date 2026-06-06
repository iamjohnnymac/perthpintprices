// Suburb → broad Perth region, for grouping happy-hour venues into the
// editorial "area" sections that the ranking listicles (Perth is OK, Urban List)
// use. Best-effort; unmapped suburbs fall into "Greater Perth".

export type PerthRegion =
  | 'Perth CBD & Northbridge'
  | 'North of the River'
  | 'Fremantle & South'
  | 'The Hills & East'
  | 'Coast & Western Suburbs'
  | 'Greater Perth'

export const PERTH_REGION_ORDER: PerthRegion[] = [
  'Perth CBD & Northbridge',
  'North of the River',
  'Coast & Western Suburbs',
  'Fremantle & South',
  'The Hills & East',
  'Greater Perth',
]

const SUBURB_REGION: Record<string, PerthRegion> = {
  // Perth CBD & Northbridge
  'Perth CBD': 'Perth CBD & Northbridge', 'Perth': 'Perth CBD & Northbridge',
  'Northbridge': 'Perth CBD & Northbridge', 'East Perth': 'Perth CBD & Northbridge',
  'West Perth': 'Perth CBD & Northbridge', 'Highgate': 'Perth CBD & Northbridge',

  // North of the River
  'North Perth': 'North of the River', 'Mount Lawley': 'North of the River',
  'Mount Hawthorn': 'North of the River', 'Leederville': 'North of the River',
  'West Leederville': 'North of the River', 'Inglewood': 'North of the River',
  'Maylands': 'North of the River', 'Bayswater': 'North of the River',
  'Bassendean': 'North of the River', 'Morley': 'North of the River',
  'Yokine': 'North of the River', 'Osborne Park': 'North of the River',
  'Wembley': 'North of the River', 'Woodlands': 'North of the River',
  'Doubleview': 'North of the River', 'Innaloo': 'North of the River',
  'Beechboro': 'North of the River', 'Dianella': 'North of the River',

  // Coast & Western Suburbs (beaches + western + northern coastal corridor)
  'Scarborough': 'Coast & Western Suburbs', 'Trigg': 'Coast & Western Suburbs',
  'North Beach': 'Coast & Western Suburbs', 'Cottesloe': 'Coast & Western Suburbs',
  'Claremont': 'Coast & Western Suburbs', 'Nedlands': 'Coast & Western Suburbs',
  'Swanbourne': 'Coast & Western Suburbs', 'Floreat': 'Coast & Western Suburbs',
  'Mosman Park': 'Coast & Western Suburbs', 'Hillarys': 'Coast & Western Suburbs',
  'Mullaloo': 'Coast & Western Suburbs', 'Joondalup': 'Coast & Western Suburbs',
  'Currambine': 'Coast & Western Suburbs', 'Iluka': 'Coast & Western Suburbs',
  'Alkimos': 'Coast & Western Suburbs', 'Duncraig': 'Coast & Western Suburbs',
  'Carramar': 'Coast & Western Suburbs', 'Wanneroo': 'Coast & Western Suburbs',

  // Fremantle & South of the River
  'Fremantle': 'Fremantle & South', 'East Fremantle': 'Fremantle & South',
  'South Perth': 'Fremantle & South', 'Como': 'Fremantle & South',
  'Victoria Park': 'Fremantle & South', 'East Victoria Park': 'Fremantle & South',
  'Burswood': 'Fremantle & South', 'Applecross': 'Fremantle & South',
  'Cockburn Central': 'Fremantle & South', 'Success': 'Fremantle & South',
  'Hammond Park': 'Fremantle & South', 'Yangebup': 'Fremantle & South',
  'Canning Vale': 'Fremantle & South', 'Thornlie': 'Fremantle & South',
  'Cannington': 'Fremantle & South', 'Cloverdale': 'Fremantle & South',
  'Bentley': 'Fremantle & South', 'Belmont': 'Fremantle & South',
  'Wellard': 'Fremantle & South', 'Warnbro': 'Fremantle & South',
  'Rockingham': 'Fremantle & South', 'Southern River': 'Fremantle & South',
  'Piara Waters': 'Fremantle & South', 'Bibra Lake': 'Fremantle & South',

  // The Hills & East (Swan Valley + foothills)
  'Guildford': 'The Hills & East', 'Midland': 'The Hills & East',
  'Kalamunda': 'The Hills & East', 'Mount Helena': 'The Hills & East',
  'Parkerville': 'The Hills & East', 'Henley Brook': 'The Hills & East',
  'Ellenbrook': 'The Hills & East', 'Carmel': 'The Hills & East',
  'Mundaring': 'The Hills & East',
}

export function perthRegion(suburb: string | null | undefined): PerthRegion {
  if (!suburb) return 'Greater Perth'
  return SUBURB_REGION[suburb.trim()] ?? 'Greater Perth'
}
