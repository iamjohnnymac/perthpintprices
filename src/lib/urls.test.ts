import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { pubUrl, suburbUrl, absolutePubUrl, absoluteSuburbUrl, toSuburbSlug } from './urls'

// SEO TRIPWIRE — frozen snapshot of every live suburb's URL slug, captured
// 2026-05-30 from the production `pubs` table (150 distinct suburbs). Pub and
// suburb pages are statically generated at these exact paths and are indexed by
// Google. If a change to the slug logic alters even one of these, it silently
// 404s a live, indexed URL. This test must fail FIRST when that happens. Do not
// edit the snapshot to make it pass unless you intend to change live URLs and
// have a redirect plan. (Adding new suburbs over time is fine — they just are
// not covered here until added.)
const LIVE_SUBURB_SLUGS: Record<string, string> = {
  "Alkimos": "alkimos",
  "Applecross": "applecross",
  "Ardross": "ardross",
  "Armadale": "armadale",
  "Ashby": "ashby",
  "Attadale": "attadale",
  "Balcatta": "balcatta",
  "Baldivis": "baldivis",
  "Ballajura": "ballajura",
  "Baskerville": "baskerville",
  "Bassendean": "bassendean",
  "Bayswater": "bayswater",
  "Bedfordale": "bedfordale",
  "Beechboro": "beechboro",
  "Belmont": "belmont",
  "Bentley": "bentley",
  "Bibra Lake": "bibra-lake",
  "Bicton": "bicton",
  "Bull Creek": "bull-creek",
  "Burswood": "burswood",
  "Calista": "calista",
  "Canning Vale": "canning-vale",
  "Cannington": "cannington",
  "Carlisle": "carlisle",
  "Carmel": "carmel",
  "Carramar": "carramar",
  "Casuarina": "casuarina",
  "Caversham": "caversham",
  "Chidlow": "chidlow",
  "City Beach": "city-beach",
  "Claremont": "claremont",
  "Clarkson": "clarkson",
  "Cloverdale": "cloverdale",
  "Cockburn Central": "cockburn-central",
  "Como": "como",
  "Connolly": "connolly",
  "Cooloongup": "cooloongup",
  "Cottesloe": "cottesloe",
  "Craigie": "craigie",
  "Crawley": "crawley",
  "Currambine": "currambine",
  "Darch": "darch",
  "Dawesville": "dawesville",
  "Dianella": "dianella",
  "Doubleview": "doubleview",
  "Duncraig": "duncraig",
  "East Fremantle": "east-fremantle",
  "East Perth": "east-perth",
  "East Victoria Park": "east-victoria-park",
  "Ellenbrook": "ellenbrook",
  "Floreat": "floreat",
  "Forrestdale": "forrestdale",
  "Forrestfield": "forrestfield",
  "Fremantle": "fremantle",
  "Gidgegannup": "gidgegannup",
  "Girrawheen": "girrawheen",
  "Gnangara": "gnangara",
  "Gosnells": "gosnells",
  "Greenwood": "greenwood",
  "Guildford": "guildford",
  "Hamilton Hill": "hamilton-hill",
  "Hammond Park": "hammond-park",
  "Henley Brook": "henley-brook",
  "High Wycombe": "high-wycombe",
  "Highgate": "highgate",
  "Hillarys": "hillarys",
  "Iluka": "iluka",
  "Inglewood": "inglewood",
  "Innaloo": "innaloo",
  "Joondalup": "joondalup",
  "Kalamunda": "kalamunda",
  "Karrinyup": "karrinyup",
  "Lathlain": "lathlain",
  "Leederville": "leederville",
  "Leeming": "leeming",
  "Maddington": "maddington",
  "Maida Vale": "maida-vale",
  "Malaga": "malaga",
  "Mandurah": "mandurah",
  "Marangaroo": "marangaroo",
  "Maylands": "maylands",
  "Meadow Springs": "meadow-springs",
  "Middle Swan": "middle-swan",
  "Midland": "midland",
  "Midvale": "midvale",
  "Mindarie": "mindarie",
  "Morley": "morley",
  "Mosman Park": "mosman-park",
  "Mount Hawthorn": "mount-hawthorn",
  "Mount Helena": "mount-helena",
  "Mount Lawley": "mount-lawley",
  "Mullaloo": "mullaloo",
  "Mundaring": "mundaring",
  "Murdoch": "murdoch",
  "Myaree": "myaree",
  "Nedlands": "nedlands",
  "Neerabup": "neerabup",
  "North Beach": "north-beach",
  "North Fremantle": "north-fremantle",
  "North Perth": "north-perth",
  "Northbridge": "northbridge",
  "O'Connor": "oconnor",
  "Ocean Reef": "ocean-reef",
  "Osborne Park": "osborne-park",
  "Parkerville": "parkerville",
  "Parkwood": "parkwood",
  "Peppermint Grove": "peppermint-grove",
  "Perth": "perth",
  "Perth Airport": "perth-airport",
  "Perth CBD": "perth-cbd",
  "Piara Waters": "piara-waters",
  "Pickering Brook": "pickering-brook",
  "Port Kennedy": "port-kennedy",
  "Rivervale": "rivervale",
  "Rockingham": "rockingham",
  "Roleystone": "roleystone",
  "Scarborough": "scarborough",
  "Secret Harbour": "secret-harbour",
  "Serpentine": "serpentine",
  "Shoalwater": "shoalwater",
  "South Fremantle": "south-fremantle",
  "South Lake": "south-lake",
  "South Perth": "south-perth",
  "Southern River": "southern-river",
  "Spearwood": "spearwood",
  "Subiaco": "subiaco",
  "Success": "success",
  "Swan Valley": "swan-valley",
  "Swan View": "swan-view",
  "Swanbourne": "swanbourne",
  "The Vines": "the-vines",
  "Thornlie": "thornlie",
  "Trigg": "trigg",
  "Victoria Park": "victoria-park",
  "Wangara": "wangara",
  "Wanneroo": "wanneroo",
  "Warnbro": "warnbro",
  "Watermans Bay": "watermans-bay",
  "Wattle Grove": "wattle-grove",
  "Wellard": "wellard",
  "Wembley": "wembley",
  "Wembley Downs": "wembley-downs",
  "West Leederville": "west-leederville",
  "West Perth": "west-perth",
  "Woodlands": "woodlands",
  "Woodvale": "woodvale",
  "Wooroloo": "wooroloo",
  "Yanchep": "yanchep",
  "Yangebup": "yangebup",
  "Yokine": "yokine",
}

describe('live suburb slug snapshot (URL regression guard)', () => {
  for (const [name, slug] of Object.entries(LIVE_SUBURB_SLUGS)) {
    it(`${name} -> /${slug}`, () => {
      assert.equal(toSuburbSlug(name), slug)
      assert.equal(suburbUrl(name), `/${slug}`)
    })
  }
})

describe('toSuburbSlug edge cases', () => {
  it("strips a straight apostrophe rather than hyphenating it (O'Connor -> oconnor)", () => {
    // The single live case that distinguishes the canonical slug from the old
    // SuburbLeague variant, which produced the now-404 \"o-connor\".
    assert.equal(toSuburbSlug("O'Connor"), 'oconnor')
  })
  it('collapses internal whitespace and punctuation runs to one hyphen', () => {
    assert.equal(toSuburbSlug('Mount   Lawley'), 'mount-lawley')
  })
  it('lowercases and trims leading/trailing separators', () => {
    assert.equal(toSuburbSlug(' South Perth '), 'south-perth')
  })
})

describe('url builders', () => {
  it('pubUrl builds /{suburb-slug}/{pub-slug}', () => {
    assert.equal(pubUrl({ suburb: "O'Connor", slug: 'the-local' }), '/oconnor/the-local')
  })
  it('suburbUrl passes through an already-slugged value when isSlug=true', () => {
    assert.equal(suburbUrl('south-perth', true), '/south-perth')
  })
  it('absolutePubUrl prefixes the production origin', () => {
    assert.equal(
      absolutePubUrl({ suburb: 'Fremantle', slug: 'the-norfolk-hotel' }),
      'https://perthpintprices.com/fremantle/the-norfolk-hotel',
    )
  })
  it('absoluteSuburbUrl prefixes the production origin (input is already a slug)', () => {
    assert.equal(absoluteSuburbUrl('oconnor'), 'https://perthpintprices.com/oconnor')
  })
})
