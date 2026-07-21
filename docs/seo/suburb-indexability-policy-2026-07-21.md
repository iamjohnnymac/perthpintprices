# Suburb indexability policy — 2026-07-21

Issue: [#231](https://github.com/iamjohnnymac/perthpintprices/issues/231)

Implementation commit: [`4fa1b53`](https://github.com/iamjohnnymac/perthpintprices/commit/4fa1b53)

## Decision

Keep every existing suburb directory indexable. A suburb page is useful when it
lists one or more legitimate venues: it gives visitors an honest local venue
directory, a direct route to each venue, nearby-suburb paths, and a way to
report missing prices. A missing, stale, or unverified price does not remove
that usefulness and is not an eligibility input.

The only pure exclusion is a zero-legitimate-venue suburb. Such a route is not
created by the current source pipeline; independently confirmed permanent
closures and invalid venue records are removed before the count is calculated.
If a legitimate venue is added, the same predicate promotes its suburb on the
next data refresh without a code change.

## Evidence and counts

The existing live suburb-slug regression snapshot covers 150 suburb routes.
The production build preflight on 2026-07-21 read 849 routable source rows.
The independently documented #230 reconciliation classifies 833 as legitimate
and 16 as `CLOSED_PERMANENTLY`.

| Measure | Before | After |
| --- | ---: | ---: |
| Existing suburb pages eligible for indexing | 150 | 150 |
| Existing suburb pages excluded for price quality | 0 | 0 |
| Legitimate pubs preserved in normal directory paths | 833 | 833 |
| Independently confirmed permanent closures | 16 | 16 |

This is intentionally not a thin-page noindex programme. The data supports an
honest directory for each existing suburb, while a price is still shown as TBC
until it is verified. No filler copy or price-based venue filtering is added.

## Implementation contract

- `getSuburbIndexability()` receives only the count of legitimate venues.
- Suburb metadata emits the self-canonical and `index, follow` from that same
  result.
- Sitemap generation uses the same result.
- `getAllSuburbs()` and `getSuburbPubs()` calculate their inputs after the
  canonical link policy excludes only independently confirmed closures or
  invalid routes, so all legitimate TBC/unverified pubs remain visibly linked.
- Tests cover zero-venue, one-venue TBC, mixed verified/unverified, qualifying
  coverage, and confirmed-closure cases, plus sitemap membership.

## Verification

The terminal proof at
[`artifacts/suburb-indexability-231/terminal-proof.png`](../../artifacts/suburb-indexability-231/terminal-proof.png)
records the successful 364-test suite, TypeScript check, lint run, production
build, and 150-suburb route snapshot. No visible UI changed, so before/after
page screenshots are not applicable.
