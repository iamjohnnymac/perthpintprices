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
  'pinchos-bar-de-tapas': 'small pour', // tapas bar — $3.50 is not a pint
  'palace-arcade': 'schooner',          // Urban List: "$6 Schooners"
  'st-brigid': 'schooner',              // Perth is OK: "$6 schooners"
}

/** The pour label when this pub's happy hour is NOT a standard pint, else null. */
export function happyHourPourLabel(slug: string): string | null {
  return NON_PINT_HAPPY_HOUR[slug] ?? null
}

/** True when the happy-hour price is a standard pint — safe to rank as "cheapest pint". */
export function isPintHappyHour(slug: string): boolean {
  return !(slug in NON_PINT_HAPPY_HOUR)
}
