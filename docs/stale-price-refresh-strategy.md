# Stale-price refresh strategy

Closes the "define a refresh cadence + a query that lists stale venues" goal
(issue #62). This is the operating policy; the companion query is
`scripts/stale-venues-queue.sql`.

## The problem

Prices drift. A pint verified in March is a guess by June, but nothing in the
system forces a re-check on a schedule. `pintsweep` only targets pubs with a
missing or unverified price (`price.is.null,price_verified.eq.false`), so a pub
that was verified once and then went stale never re-enters the call queue.

## Staleness thresholds

Freshness is already bucketed in `src/lib/freshness.ts` (`getPriceRecency`):

| Tier    | Age of `last_verified` | Meaning                          |
| ------- | ---------------------- | -------------------------------- |
| fresh   | < 30 days              | trust as-is                      |
| aging   | 31–90 days             | fine to show, eligible to refresh |
| stale   | 91+ days               | refresh priority                 |
| unknown | never verified / null  | backfill priority                |

The refresh queue uses these same cut-offs so the UI label and the ops priority
never disagree:

1. **`price IS NULL`** — urgent backfill (no price to show at all).
2. **`last_verified` older than 90 days** — regular-price refresh (the "stale" tier).
3. **`happy_hour_price` set but `last_verified` older than 45 days** — promo
   refresh (happy-hour deals churn faster than regular prices).
4. **`outdated_flag` / conflicting crowd reports** — route to admin review, never
   auto-approve. (The user-facing "Report Issue" flag that feeds this was fixed
   in #192; those rows land in `price_reports` with `report_type = 'outdated_flag'`.)

## Prioritisation (which stale venue to refresh first)

Within the stale set, order by traffic and link value so the long tail doesn't
starve the venues people actually visit:

1. High-intent suburbs first: **Perth CBD, Northbridge, Fremantle, Leederville,
   Mount Lawley, Subiaco, Scarborough, Cottesloe** and the beach pubs.
2. Cheap-price outliers (sub-$9 verified) — they're the headline of
   `/cheapest-pints` and the Pint Index, so a wrong one is the most visible.
3. Oldest `last_verified` breaks ties within a suburb band.

`scripts/stale-venues-queue.sql` encodes exactly this ordering and returns a
ranked list ready to feed the next refresh batch.

## Cadence

- **Weekly:** run the queue query, take the top N (sized to the call/scan budget),
  refresh them. The existing daily `price-check` cron is the natural host for the
  query if this is later automated.
- **Seasonal (quarterly):** a suburb-by-suburb audit sprint so no band of the long
  tail goes a full quarter without a look.
- **Continuous:** the crowd loop — every approved public price report or stale
  flag resets `last_verified`, pulling that venue back to "fresh" without a batch.

## Refresh channels (in cost order)

1. **Crowd reports** (free) — the public form + the one-tap stale flag. Already live.
2. **Menu scan** (cheap) — `/api/menu-scan` OCR when a venue publishes a menu.
3. **Andrew re-calls** (paid) — for high-value stale venues with no cheaper signal.
   *Out of scope for this issue:* `pintsweep` would need to widen its target
   query from null/unverified to include the stale set above. Tracked as a
   follow-up so this strategy doc and the query can land without touching the
   voice agent.

## Surfacing freshness to users (trust)

`getPriceRecency` already returns a "Checked Nd ago" label and a tier. Pub and
suburb pages carry `lastVerified`. The remaining UI work — showing the
fresh/aging/stale tier prominently on pub cards, and separating "snapshot date"
from "last verified" on the Pint Index export — is tracked under the freshness
UX issues (#35), not here.

## Success metric

A defined cadence (above) **plus** a query that lists stale venues for the next
batch (`scripts/stale-venues-queue.sql`). Re-run the query weekly; the count of
`tier = 'stale'` rows trending down is the signal the cadence is working.
