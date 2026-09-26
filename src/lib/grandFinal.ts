/**
 * 2026 AFL Grand Final — Fremantle v Brisbane Lions at the MCG.
 *
 * Event-day data for the site-wide banner and the /grand-final hub. Every
 * venue entry must carry the public source that shows it is screening this
 * year's game, plus the date we checked it. Retire the banner and page after
 * the day, the same way the World Cup campaign was retired (PR #226).
 */
import { perthToday } from './perthClock'

/** First bounce: 2:30pm AEST = 12:30pm AWST. Source: afl.com.au. */
export const GF_BOUNCE = '2026-09-26T04:30:00.000Z'
/** Perth calendar date of the game. The banner hides after this day. */
export const GF_DAY = '2026-09-26'
/** Date the venue list was checked. */
export const GF_CHECKED = '2026-09-26'

/** Fremantle purple and white, Brisbane maroon and gold. */
export const GF_TEAM_STRIPE = ['#2A0D54', '#FFFFFF', '#A30046', '#FDBE57']

const GAME_LENGTH_MS = 3 * 60 * 60 * 1000

export type GrandFinalPhase = 'pre' | 'live' | 'after' | 'over'

export function grandFinalPhase(now: Date): GrandFinalPhase {
  if (perthToday(now) > GF_DAY) return 'over'
  const bounce = Date.parse(GF_BOUNCE)
  if (now.getTime() < bounce) return 'pre'
  if (now.getTime() < bounce + GAME_LENGTH_MS) return 'live'
  return 'after'
}

/** "1h 42m" / "8m" until the bounce, or null once it has happened. */
export function timeToBounce(now: Date): string | null {
  const ms = Date.parse(GF_BOUNCE) - now.getTime()
  if (ms <= 0) return null
  const totalMinutes = Math.ceil(ms / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

export type GrandFinalAccess =
  | 'Free entry'
  | 'Bookings recommended'
  | 'Ticketed'
  | 'Sold out'
  | 'Check with venue'

export type GrandFinalArea =
  | 'Fremantle and the coast'
  | 'City and inner suburbs'
  | 'North'
  | 'East and south-east'

export const GF_AREAS: GrandFinalArea[] = [
  'Fremantle and the coast',
  'City and inner suburbs',
  'North',
  'East and south-east',
]

export interface GrandFinalVenue {
  name: string
  suburb: string
  area: GrandFinalArea
  /** Pub slug in our database, when we track the venue. Links to its page. */
  slug?: string
  /** Only what the source says the venue is offering. */
  offer: string
  access: GrandFinalAccess
  sourceUrl: string
  sourceLabel: string
  /** Date on the source, when it has one. */
  sourceDate: string | null
}

export interface GrandFinalLiveSite {
  name: string
  location: string
  offer: string
  access: GrandFinalAccess
  sourceUrl: string
  sourceLabel: string
  sourceDate: string | null
}

const SO_PERTH = 'https://soperth.com.au/eats-drinks-perth/afl-grand-final-2026-the-best-pubs-bars-to-watch-freo-in-the-big-dance-137549'
const URBAN_LIST = 'https://www.theurbanlist.com/perth/a-list/where-to-watch-the-afl-grand-final-in-perth'
const EAT_DRINK_CHEAP = 'https://eatdrinkcheap.com.au/perth/afl-grand-final'
const WA_GOV_TRANSPORT = 'https://www.wa.gov.au/government/media-statements/Cook%20Labor%20Government/Cook-Government-makes-public-transport-free-for-Grand-Final-day-20260921'
const FREO_FC_WEEK = 'https://www.fremantlefc.com.au/news/2138000/freos-grand-final-week-all-the-events'

/** Free public transport on the day. */
export const GF_TRANSPORT = {
  note: 'All Transperth services are free on Saturday, with extra trains every 15 minutes on every line until 11pm.',
  sourceUrl: WA_GOV_TRANSPORT,
  sourceLabel: 'WA Government',
  sourceDate: '2026-09-21',
}

/** Fremantle FC's official away-game pubs for fans staying in WA. */
export const GF_ANCHOR_VENUES = {
  note: "Freo's official away-game pubs are Bicton Tavern, 8 Knots Tavern, The Federal, South Beach Hotel, The Gate Bar & Bistro in Success and The Cut Tavern in Wannanup.",
  sourceUrl: FREO_FC_WEEK,
  sourceLabel: 'Fremantle FC',
  sourceDate: null,
}

export const GF_LIVE_SITES: GrandFinalLiveSite[] = [
  {
    name: 'City of Fremantle live sites',
    location: 'Cappuccino Strip, Walyalup Koort, Esplanade Park, Market and High streets',
    offer: 'Big screens from 8am to 6pm. All four sites are alcohol-free and WA Police will be there. Esplanade Park is the family zone and Walyalup Koort has an accessible viewing area.',
    access: 'Free entry',
    sourceUrl: 'https://www.fremantle.wa.gov.au/arts-and-culture/whats-on/afl-grand-final-in-fremantle/',
    sourceLabel: 'City of Fremantle',
    sourceDate: null,
  },
  {
    name: 'Fremantle Oval watch party',
    location: 'Fremantle Oval, Parry Street',
    offer: 'Licensed watch party run by South Fremantle, with screens on the oval, grandstand seating, bars and food trucks from 9am. Everyone needs a ticket, and the first release sold out.',
    access: 'Ticketed',
    sourceUrl: 'https://www.eventbrite.com.au/e/afl-grand-final-at-fremantle-oval-tickets-1998482390628',
    sourceLabel: 'Eventbrite',
    sourceDate: null,
  },
  {
    name: 'Grand Final in the Park',
    location: 'BHP Amphitheatre, Optus Stadium Park, Burswood',
    offer: 'Free screening on the amphitheatre screen from 11am to 4pm, with food trucks and a bar. The stadium itself is not open.',
    access: 'Free entry',
    sourceUrl: SO_PERTH,
    sourceLabel: 'So Perth',
    sourceDate: '2026-09-23',
  },
  {
    name: 'Northbridge Piazza and Yagan Square',
    location: 'Northbridge and Perth CBD',
    offer: 'Listed by the WA Government as free public viewing sites.',
    access: 'Free entry',
    sourceUrl: WA_GOV_TRANSPORT,
    sourceLabel: 'WA Government',
    sourceDate: '2026-09-21',
  },
]

export const GF_VENUES: GrandFinalVenue[] = [
  // Fremantle and the coast
  {
    name: 'The Federal Hotel', suburb: 'Fremantle', area: 'Fremantle and the coast', slug: 'federal-hotel',
    offer: 'Takes over Paddy Troy Mall from 10am with extra screens and bars. Tickets were down to the final release when we checked; tables booked earlier do not need one.',
    access: 'Ticketed', sourceUrl: 'https://events.humanitix.com/afl-grand-final-at-the-fed', sourceLabel: 'Humanitix', sourceDate: null,
  },
  {
    name: 'The National Hotel', suburb: 'Fremantle', area: 'Fremantle and the coast', slug: 'the-national-hotel',
    offer: 'Giant screen from 9am. The ground floor is free and walk-in only until full; the first floor is $75 a head with guaranteed entry.',
    access: 'Free entry', sourceUrl: 'https://nationalhotelfremantle.com.au/events/afl-grand-final-2026/', sourceLabel: 'National Hotel', sourceDate: null,
  },
  {
    name: 'Old Courthouse', suburb: 'Fremantle', area: 'Fremantle and the coast', slug: 'old-courthouse-fremantle',
    offer: 'Free, walk-ins only, doors at 10am. Big screen on the lawn plus screens in the Pavilion and Courtrooms.',
    access: 'Free entry', sourceUrl: 'https://oldcourthouse.com.au/events/afl-grand-final-day/', sourceLabel: 'Old Courthouse', sourceDate: null,
  },
  {
    name: 'The Left Bank', suburb: 'East Fremantle', area: 'Fremantle and the coast', slug: 'the-left-bank',
    offer: 'Huge outdoor screen across half the car park with extra bars. Bookings are full, but walk-ins are welcome and entry is free.',
    access: 'Free entry', sourceUrl: 'https://perthisok.com/events/grand-final-day-at-the-left-bank-2/', sourceLabel: 'Perth Is OK', sourceDate: null,
  },
  {
    name: 'Bathers Beach House', suburb: 'Fremantle', area: 'Fremantle and the coast', slug: 'bathers-beach-house',
    offer: '$30 tickets with two drinks, the game upstairs on the big screen and a DJ after the siren. Online sales had closed when we checked.',
    access: 'Ticketed', sourceUrl: 'https://www.stickytickets.com.au/50jc1d/afl_grand_final_2026.aspx', sourceLabel: 'Sticky Tickets', sourceDate: null,
  },
  {
    name: 'Mojos', suburb: 'North Fremantle', area: 'Fremantle and the coast', slug: 'mojos-bar',
    offer: '$20 entry with a drink, screens inside and in the courtyard on house sound, doors at 10am.',
    access: 'Ticketed', sourceUrl: SO_PERTH, sourceLabel: 'So Perth', sourceDate: '2026-09-23',
  },
  {
    name: 'Bicton Tavern', suburb: 'Bicton', area: 'Fremantle and the coast',
    offer: 'Two big screens and $10 Pirate Life pints. Walk-ins are welcome while there is room.',
    access: 'Check with venue', sourceUrl: EAT_DRINK_CHEAP, sourceLabel: 'Eat Drink Cheap', sourceDate: '2026-09-25',
  },
  {
    name: 'The Raffles Hotel', suburb: 'Applecross', area: 'Fremantle and the coast', slug: 'raffles-hotel',
    offer: 'Free general admission, but book to get on the guest list. Opens at 9am with breakfast and $10 Swan Draught pints.',
    access: 'Bookings recommended', sourceUrl: EAT_DRINK_CHEAP, sourceLabel: 'Eat Drink Cheap', sourceDate: '2026-09-25',
  },
  {
    name: 'Cottesloe Beach Hotel', suburb: 'Cottesloe', area: 'Fremantle and the coast', slug: 'cottesloe-beach-hotel',
    offer: 'The Beach Club opens at 11am with big screens throughout, drink specials and roaming beer trays. Tables can be booked online.',
    access: 'Bookings recommended', sourceUrl: 'https://perthisok.com/events/afl-grand-final-party-live-loud-in-the-beach-club/', sourceLabel: 'Perth Is OK', sourceDate: null,
  },
  {
    name: 'Ocean Beach Hotel', suburb: 'Cottesloe', area: 'Fremantle and the coast', slug: 'ocean-beach-hotel',
    offer: 'Big screen with full sound, $40 footy platters and a happy hour straight after the siren.',
    access: 'Check with venue', sourceUrl: EAT_DRINK_CHEAP, sourceLabel: 'Eat Drink Cheap', sourceDate: '2026-09-25',
  },

  // City and inner suburbs
  {
    name: 'Samuels on Mill', suburb: 'Perth CBD', area: 'City and inner suburbs', slug: 'samuels-on-mill',
    offer: 'The game on the big screen from the bounce. Free entry, walk-ins only.',
    access: 'Free entry', sourceUrl: SO_PERTH, sourceLabel: 'So Perth', sourceDate: '2026-09-23',
  },
  {
    name: 'Victoria Park Hotel', suburb: 'Victoria Park', area: 'City and inner suburbs', slug: 'victoria-park-hotel',
    offer: 'Free downstairs. An $85 VIP package runs in the Albany Room, with family activities from 12pm to 3pm.',
    access: 'Free entry', sourceUrl: 'https://victoriaparkhotel.com.au/events/afl-grand-final/', sourceLabel: 'Victoria Park Hotel', sourceDate: null,
  },
  {
    name: 'The Inglewood Hotel', suburb: 'Inglewood', area: 'City and inner suburbs', slug: 'the-inglewood-hotel',
    offer: 'Free entry and parking, a 3m screen and doors at 10am. A $129 restaurant package gets you a reserved seat.',
    access: 'Free entry', sourceUrl: 'https://inglewoodhotel.com.au/events/', sourceLabel: 'Inglewood Hotel', sourceDate: null,
  },
  {
    name: 'Paddington Ale House', suburb: 'Mount Hawthorn', area: 'City and inner suburbs', slug: 'the-paddo',
    offer: 'Doors at 10am with a happy hour from 10:30 to 11:30am, the game on the big screens and a quiz after. Walk-ins welcome.',
    access: 'Free entry', sourceUrl: 'https://paddo.com.au/events/afl-grand-final/', sourceLabel: 'The Paddo', sourceDate: null,
  },
  {
    name: 'The Wembley Hotel', suburb: 'Wembley', area: 'City and inner suburbs', slug: 'the-wembley-hotel',
    offer: 'Big screens and pop-up bars with free general admission from 10am, plus a paid drinks-and-canapés package.',
    access: 'Free entry', sourceUrl: URBAN_LIST, sourceLabel: 'Urban List', sourceDate: null,
  },
  {
    name: 'The Garden', suburb: 'Leederville', area: 'City and inner suburbs', slug: 'the-garden',
    offer: 'Giant screens across The Garden and a closed Newcastle Street. Tickets start at $22 to $24 depending on the round-up, and So Perth expected it to sell out.',
    access: 'Ticketed', sourceUrl: URBAN_LIST, sourceLabel: 'Urban List', sourceDate: null,
  },
  {
    name: 'The Stables Bar', suburb: 'Perth CBD', area: 'City and inner suburbs', slug: 'the-stables-bar',
    offer: '$109 from midday for two and a half hours of tap beer, wine and spirits with a footy platter. Book online.',
    access: 'Ticketed', sourceUrl: 'https://www.thestablesbar.com.au/whats-on/grand-final', sourceLabel: 'The Stables Bar', sourceDate: null,
  },
  {
    name: 'Market Grounds', suburb: 'Perth CBD', area: 'City and inner suburbs', slug: 'market-grounds',
    offer: '$95 bottomless package of Aperol Spritz, tap beer and wine with a footy platter; $120 for VIP.',
    access: 'Ticketed', sourceUrl: SO_PERTH, sourceLabel: 'So Perth', sourceDate: '2026-09-23',
  },
  {
    name: 'Little Creatures Elizabeth Quay', suburb: 'Perth CBD', area: 'City and inner suburbs',
    offer: 'A two-and-a-half-hour free-flow drinks package with a footy platter, then a DJ from 2:30pm.',
    access: 'Ticketed', sourceUrl: URBAN_LIST, sourceLabel: 'Urban List', sourceDate: null,
  },
  {
    name: 'BrewDog Perth', suburb: 'West Perth', area: 'City and inner suburbs', slug: 'brewdog-perth',
    offer: 'Fan zone with giant screens and stadium sound. Early-bird tickets include a drink and a raffle entry.',
    access: 'Ticketed', sourceUrl: SO_PERTH, sourceLabel: 'So Perth', sourceDate: '2026-09-23',
  },
  {
    name: 'Queens Tavern', suburb: 'Highgate', area: 'City and inner suburbs', slug: 'queens-tavern',
    offer: 'An $85 package with two hours of bottomless pizza, beer and wine. The rest of the pub is first in, best dressed, with $13 Peroni pints.',
    access: 'Check with venue', sourceUrl: EAT_DRINK_CHEAP, sourceLabel: 'Eat Drink Cheap', sourceDate: '2026-09-25',
  },
  {
    name: 'The Windsor Hotel', suburb: 'South Perth', area: 'City and inner suburbs', slug: 'the-windsor-hotel',
    offer: '$95 siren-to-siren drinks package in the Garden Bar from 11am. Reserved tables are sold out; everyone else can watch in the Mends St or Black Pearl bars.',
    access: 'Ticketed', sourceUrl: 'https://www.windsorhotelsouthperth.com/2026-afl-grandfinal', sourceLabel: 'The Windsor Hotel', sourceDate: null,
  },
  {
    name: 'The Camfield', suburb: 'Burswood', area: 'City and inner suburbs', slug: 'the-camfield',
    offer: '$140 for free-flowing drinks and a footy platter, with the game on two giant screens in The Hall.',
    access: 'Ticketed', sourceUrl: SO_PERTH, sourceLabel: 'So Perth', sourceDate: '2026-09-23',
  },
  {
    name: 'Crown Sports Bar', suburb: 'Burswood', area: 'City and inner suburbs', slug: 'crown-sports-bar',
    offer: 'A wall of HD screens across several bars, with VIP booths for groups.',
    access: 'Check with venue', sourceUrl: URBAN_LIST, sourceLabel: 'Urban List', sourceDate: null,
  },

  // North
  {
    name: 'The Morris Hotel', suburb: 'Innaloo', area: 'North', slug: 'the-morris-hotel',
    offer: 'A $10 ticket gets you into the car park block party with a drink, pop-up bars and food trucks from 10am. Eat Drink Cheap says the main pub is free.',
    access: 'Ticketed', sourceUrl: 'https://tickets.oztix.com.au/outlet/event/cf20cb0f-934c-4c9b-84cf-893e8c9a9263', sourceLabel: 'Oztix', sourceDate: null,
  },
  {
    name: 'The Galway Hooker', suburb: 'Scarborough', area: 'North', slug: 'the-galway-hooker',
    offer: 'The game across the big screens with a band from 9pm. Free entry, and tables can be reserved.',
    access: 'Free entry', sourceUrl: 'https://thegalwayhooker.com.au/events/afl-grand-final/', sourceLabel: 'The Galway Hooker', sourceDate: null,
  },
  {
    name: 'The Peach Pit', suburb: 'Scarborough', area: 'North', slug: 'the-peach-pit',
    offer: '12 big screens from 12:30pm, with a $60 siren-to-siren drinks package and booths for four to six.',
    access: 'Bookings recommended', sourceUrl: 'https://thepeachpitbar.com.au/events/afl-grand-final/', sourceLabel: 'The Peach Pit', sourceDate: null,
  },
  {
    name: 'The Waterfront Tavern', suburb: 'Hillarys', area: 'North',
    offer: '$20 ticket with a drink and a sausage sizzle, $10 pints during the match and a 4m screen plus six more through the venue.',
    access: 'Ticketed', sourceUrl: 'https://thewaterfrontavern.com.au/whats-on/afl-grand-final/', sourceLabel: 'The Waterfront Tavern', sourceDate: null,
  },
  {
    name: "Dave & Buster's", suburb: 'Clarkson', area: 'North',
    offer: 'A $15 ticket you can spend on food, drinks and games, a 9m screen wall inside and a mega screen outdoors. Doors at 11am.',
    access: 'Ticketed', sourceUrl: URBAN_LIST, sourceLabel: 'Urban List', sourceDate: null,
  },
  {
    name: 'Varsity', suburb: 'All Perth venues', area: 'North',
    offer: 'Every Varsity is showing it on the big screens, with no tickets or packages. Tables can be booked.',
    access: 'Free entry', sourceUrl: 'https://www.varsity.com.au/highlights/afl-grand-final-2026', sourceLabel: 'Varsity', sourceDate: null,
  },

  // East and south-east
  {
    name: 'The Bayswater Hotel', suburb: 'Bayswater', area: 'East and south-east', slug: 'bayswater-hotel',
    offer: 'The game on the big screen outside from 12:30pm, with live music from 3pm. Tables go through the functions manager with a minimum spend.',
    access: 'Bookings recommended', sourceUrl: 'https://www.bayswaterhotel.com.au/whats-on-2', sourceLabel: 'The Bayswater Hotel', sourceDate: null,
  },
  {
    name: 'The Guildford Hotel', suburb: 'Guildford', area: 'East and south-east', slug: 'guildford-hotel',
    offer: 'The Hall is set up for the game, with $500 VIP tables for six that include a platter and a $300 bar tab. Walk-ins welcome.',
    access: 'Bookings recommended', sourceUrl: SO_PERTH, sourceLabel: 'So Perth', sourceDate: '2026-09-23',
  },
  {
    name: 'Bentley Hotel', suburb: 'Bentley', area: 'East and south-east', slug: 'bentley-hotel',
    offer: 'The game across the venue with the full menu, a half-time handball competition and live music after. Bookings from 11am.',
    access: 'Free entry', sourceUrl: 'https://bentleyhotel.com.au/events/afl-grand-final/', sourceLabel: 'Bentley Hotel', sourceDate: null,
  },
  {
    name: 'Lakers Tavern', suburb: 'Thornlie', area: 'East and south-east', slug: 'lakers-tavern',
    offer: '$65 for a parmi or burger with bottomless tap beer and house wine from 12:30pm.',
    access: 'Check with venue', sourceUrl: EAT_DRINK_CHEAP, sourceLabel: 'Eat Drink Cheap', sourceDate: '2026-09-25',
  },
  {
    name: 'Baillie Hill', suburb: 'East Victoria Park', area: 'East and south-east',
    offer: '$20 entry with a drink brewed or distilled on site, and a DJ after the siren.',
    access: 'Ticketed', sourceUrl: SO_PERTH, sourceLabel: 'So Perth', sourceDate: '2026-09-23',
  },
]
