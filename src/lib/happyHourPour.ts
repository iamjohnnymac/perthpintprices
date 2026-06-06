// Curated pour-size data for happy-hour prices.
//
// PPP stores a single `happyHourPrice` with no pour size, so small pours
// (schooners, tapas-bar pours) can masquerade as cheap pints — e.g. Pinchos's
// $3.50 or Palace Arcade's $6 show up as the "cheapest pint" when they aren't
// pints at all. Every ranking competitor distinguishes them: Urban List lists
// Palace Arcade as "$6 Schooners", Perth is OK lists St Brigid as "$6 schooners".
//
// Until a per-pub pour size lives in the DB, this curated set marks the confirmed
// non-pint happy hours (keyed by pub slug, value = the pour label to display) so
// the "cheapest pint" logic skips them and the list labels them honestly.
//
// Add a slug here whenever a venue's happy-hour price is verified to be a
// schooner/pot/small pour rather than a standard pint.
const NON_PINT_HAPPY_HOUR: Record<string, string> = {
  'pinchos-bar-de-tapas': 'small pour', // Urban List: "ponies of Estrella Damm for just $3.50"
  'palace-arcade': 'schooner',          // Urban List: "$6 Schooners"
  'st-brigid': 'schooner',              // Perth is OK: "$6 schooners" (Doubleview)
  'patio-bar': 'schooner',              // Perth is OK: "$6 schooeys most of the time"
  'el-grotto': 'schooner',              // "$6 lagers" — Scarborough beach bar; pour size unstated, schooner inferred (verify)
}
// Verified PINT deals (do NOT flag — kept here so they aren't re-added by mistake):
// the-brook-bar-and-bistro ("$7 for a pint"), bar-399 ("$8 pints"), the-globe ("$10 pints"),
// the-generous-squire ("$9.50 pints"), victoria-park-hotel ("$10 pints"), northbridge-brewing-company.
// Unconfirmed pour size, left as pints for now (not cheap enough to mislead the "cheapest" pick):
// ezra-pound ("$6 selected taps"), baha ("$8 tap beers"), the-woodvale-tavern ("$8.50 beers").

/** The pour label when this pub's happy hour is NOT a standard pint, else null. */
export function happyHourPourLabel(slug: string): string | null {
  return NON_PINT_HAPPY_HOUR[slug] ?? null
}

/** True when the happy-hour price is a standard pint — safe to rank as "cheapest pint". */
export function isPintHappyHour(slug: string): boolean {
  return !(slug in NON_PINT_HAPPY_HOUR)
}
