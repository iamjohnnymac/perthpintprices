# GSC indexing baseline — 2026-07-21

**Property:** `sc-domain:perthpintprices.com`  
**Evidence collected:** 2026-07-21, Australia/Perth  
**Purpose:** baseline issue [#229](https://github.com/iamjohnnymac/perthpintprices/issues/229) and the SEO audit epic [#228](https://github.com/iamjohnnymac/perthpintprices/issues/228).

**Status:** Phase 1 authenticated snapshot with representative URL checks. It is not the completed URL-level inventory required by #229. The open work is to export, retain, enrich, and classify every cohort URL before drawing template-level conclusions.

## Non-negotiable publishing policy

Never apply `noindex`, remove a sitemap entry, or remove a legitimate pub **solely because its price is missing, stale, or unverified**. Legitimate pub pages remain available for users and search engines. Closure/duplicate decisions must be based on independent venue-status evidence, not price completeness.

Issue [#230](https://github.com/iamjohnnymac/perthpintprices/issues/230) merged as [PR #239](https://github.com/iamjohnnymac/perthpintprices/pull/239), merge commit [`19cfae3`](https://github.com/iamjohnnymac/perthpintprices/commit/19cfae3): production now makes legitimate pubs indexable regardless of price verification. Any historical GSC `noindex` data below is a recrawl and monitoring backlog, not a reason to exclude pubs.

## Evidence: GSC snapshot

This section records what Search Console showed during collection. Its Page indexing report was last updated **2026-07-10**, so it is not a statement of the live site's state on 2026-07-21.

### Overview

| Metric | Observed value |
| --- | ---: |
| Total web-search clicks | 719 |
| Page indexing: indexed | 556 |
| Page indexing: not indexed | 973 |
| HTTPS | 140 good; 0 non-HTTPS |
| Breadcrumb structured data | 159 valid; 0 invalid |
| Image metadata structured data | 54 valid; 0 invalid |

Timestamped authenticated Overview observation (2026-07-21): Search Console surfaced `/world-cup` impressions down 52% and `/south-fremantle` impressions up 509%. This is not a durable performance fact; it must be rechecked in the next Performance comparison. The former is consistent with the completed World Cup removal; the latter is a useful content-performance lead, not proof of a technical fault.

### Page indexing report (last updated 2026-07-10)

| Reason | URLs | Notes |
| --- | ---: | --- |
| Page with redirect | 411 | Needs segmentation between intended legacy redirects and unexpected chains. |
| Excluded by `noindex` | 146 | Historical data; do not use it to remove legitimate pubs after #230. |
| Not found (404) | 15 | Includes current-looking pub paths, stale `/pub/...` paths, and `/pub-golf`; triage individually. |
| Crawled — currently not indexed | 378 | Snapshot cohort; confirm current status before acting. |
| Discovered — currently not indexed | 18 | Snapshot cohort; confirm current status before acting. |
| Duplicate, Google chose different canonical | 3 | Inspect each URL/canonical pair. |
| Redirect error | 2 | Timestamped GSC observation: `/guides` and `/insights`; Validation showed Started. Recheck before treating this as a current defect. |

### Submitted sitemap scope (same GSC snapshot)

The selected sitemap scope showed **299 indexed** and **118 not indexed** URLs:

| Reason | URLs |
| --- | ---: |
| Crawled — currently not indexed | 99 |
| Discovered — currently not indexed | 18 |
| Google chose a different canonical | 1 |

The Sitemaps report showed the root sitemap submitted on 2026-03-04, last read on 2026-07-12, with status **Success** and **415 discovered pages**.

Representative submitted-sitemap crawl-not-indexed samples included `/west-leederville/exchange-bar`, 18 Knots Rooftop Bar, Varnish on King, The Garden, Pirate Bar, Niche Bar, Paddy Malone's, The Reveley, Cozy Corners, Beeches Tavern, Springs Tavern, Mount Helena Tavern, Woodvale Tavern, Craigie Tavern, Brooklands Tavern, Down the Road Bar and Grill, Blasta Brewing, and Gage Roads Freo Brewery. Preserve the original exported GSC URL list with any follow-up ticket or report rather than reconstructing slugs from venue names.

The discovered-not-indexed cohort was mostly newly launched articles, landing pages, and day pages, plus `/belmont/argyle-social`; all showed Last crawled: N/A. The single submitted-sitemap canonical mismatch was `/henley-brook/the-henley-brook`, last crawled 2026-03-29.

## Evidence: current live production checks

These checks were made on 2026-07-21 and take precedence over the lagging GSC report for the named URLs.

| URL / check | Current evidence |
| --- | --- |
| Root sitemap | 1,014 live URLs; includes `https://perthpintprices.com/fremantle/federal-hotel`; does not include `/world-cup`. |
| `/fremantle/federal-hotel` | Representative missing/unverified-price pub: `index, follow`, self-canonical, sitemap-listed. GSC's stored view was Unknown to Google/no referring sitemap, while its live test said URL available to Google, page can be indexed, crawl allowed Yes, fetch Successful, indexing allowed Yes. No indexing request was made. |
| `/fremantle/the-norfolk-hotel` | Timestamped stored-inspection observation (2026-07-21): on Google, last crawl 2026-06-03, fetch Successful, indexing allowed, self-canonical. Reinspect in any later baseline. |
| `/west-leederville/exchange-bar` | Listed in the 2026-07-10 crawl-not-indexed cohort but now indexed; last crawl 2026-07-20, fetch Successful, indexing allowed, self-canonical. |

The Exchange Bar result demonstrates why the 2026-07-10 report must not be treated as a current exclusion list: cohort membership can lag a current indexed state.

## Interpretation and immediate priorities

1. **Monitor the post-#230 recrawl, rather than reintroducing eligibility gates.** Use the sitemap and representative pub inspections to show that legitimate pubs are eligible now; wait for Search Console's reports to catch up.
2. **Triage the small, specific technical cohorts.** Inspect the 15 404s, three canonical mismatches, and two redirect errors URL by URL; distinguish valid legacy redirects from defects.
3. **Improve the 18 discovered-not-indexed pages through their individual content and internal-link context.** They are mostly new launches; do not use blanket `noindex` as a response.
4. **Sample the 99 submitted-sitemap crawl-not-indexed URLs before changing templates.** Prioritise URLs with commercial/local intent and validate live status first. The Exchange Bar reversal means the snapshot list is not a to-do list by itself.
5. **Track World Cup removal and South Fremantle growth in Performance.** Confirm `/world-cup` remains absent from the sitemap and see whether South Fremantle's increased impressions convert to clicks.

## Repeatable refresh runbook

Use a browser-authenticated, read-only GSC session. Do not save browser cookies, credentials, tokens, or GSC export URLs in the repository.

1. Record the collection timestamp, GSC property, report date, and selected sitemap scope in a working note. Save exports outside the repository at `~/Downloads/perth-pint-prices-gsc/YYYY-MM-DD/` using `pages-<reason>.csv` and `sitemap-coverage.csv`; do not commit raw exports until they have been reviewed for sensitive browser-generated URLs.
2. In GSC, open **Indexing → Pages**, select the submitted root sitemap scope, and export the full URL lists for Crawled — currently not indexed, Discovered — currently not indexed, and Google-chosen canonical mismatch. Export the all-pages 404 and redirect-error lists too. Record the report's “last updated” date alongside every export.
3. Open **Indexing → Sitemaps** and record submission date, last-read date, status, and discovered-page count. Download the current live root sitemap separately and save its URL list as `live-sitemap-urls.txt` in the same working directory.
4. Join each exported URL to the live sitemap list and production data: page type/template; canonical and robots evidence; pub tier, verification age, price and happy-hour completeness, description availability, index eligibility; suburb total pubs, qualifying/indexable pubs, and price coverage; and content publication/update dates, initial HTML usefulness, and visible inbound-link sources.
5. Classify every URL as current indexed, genuinely quality-rejected, recently published/unfetched, intended redirect, stale/removed path, canonical mismatch, or needs investigation. Keep the raw GSC reason separately from this current classification. Reconcile totals back to the report date and state any missing/export failures.
6. URL-inspect a representative sample from each class. Record whether the result is stored or live; a stored inspection and a live test can differ. Never request indexing as part of this baseline procedure.
7. Publish only an aggregated, review-safe snapshot at `docs/seo/gsc-indexing-baseline-YYYY-MM-DD.md`, with the raw-workspace path and report date documented, not raw export URLs. Link the corresponding GitHub issue and retain the working export directory for the PM's controlled follow-up.
8. Compare weekly for four weeks after material indexing changes, then monthly. Compare like-for-like report dates and sitemap scopes; do not call a dated cohort a current production exclusion without a fresh inspection.

## Monitoring cadence and acceptance status

| When | Check | Success signal |
| --- | --- | --- |
| Weekly for four weeks after #230 | GSC Pages report, submitted-sitemap scope, and `noindex` cohort | Live indexability stays intact; historical exclusions and sitemap cohort trends are documented rather than acted on blindly. |
| Weekly for four weeks | Sample Federal Hotel, Norfolk Hotel, Exchange Bar, and a rotating newly submitted pub in URL Inspection | Stored inspection converges with live eligibility; no price-status-based exclusion appears. |
| Weekly | 404, canonical, and redirect-error cohorts | Every URL is classified as intended legacy behaviour, closed/duplicate, or a tracked fix. |
| Monthly | Performance for `/south-fremantle` and former `/world-cup` visibility | South Fremantle trend assessed; World Cup remains removed from current discovery surfaces. |

### #229 acceptance status

This document completes the **Phase 1 snapshot and refresh runbook only**. It does **not** complete #229's URL-level acceptance criteria. The following remain open: full exports and classifications for all 99 crawled-not-indexed and all 18 discovered-not-indexed URLs; URL-level 404, canonical-mismatch, and redirect-error inventories; pub tier/verification/completeness/description/index-eligibility attributes; suburb pub and price-coverage metrics; and content-page initial-HTML, inbound-link, and publication/update evidence.

Follow-on implementation and monitoring remain with the linked epic issues [#231](https://github.com/iamjohnnymac/perthpintprices/issues/231), [#232](https://github.com/iamjohnnymac/perthpintprices/issues/232), [#235](https://github.com/iamjohnnymac/perthpintprices/issues/235), [#236](https://github.com/iamjohnnymac/perthpintprices/issues/236), and [#237](https://github.com/iamjohnnymac/perthpintprices/issues/237). Keep #229 In Progress until its full inventories and classifications are committed and reconciled.
