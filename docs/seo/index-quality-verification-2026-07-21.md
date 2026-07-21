# Index-quality verification — 2026-07-21

Issue [#237](https://github.com/iamjohnnymac/perthpintprices/issues/237) is a measurement gate, not a closure record. This is the Phase 1 production and Search Console starting point after the indexability, redirect, sitemap and targeted-content changes.

## Production release check

`node scripts/validate-sitemap.mjs` was run against `https://perthpintprices.com` on 2026-07-21.

| Check | Result |
| --- | ---: |
| Sitemap index | 200 |
| Content URLs | 32 |
| Suburb URLs | 150 |
| Legitimate pub URLs | 833 |
| Total sitemap URLs | 1,015 |
| Duplicate/prohibited URLs | 0 / 0 |
| Non-200 or non-self-canonical sitemap routes | 0 |

This validator rejects sitemap redirects, unexpected route responses, a missing or mismatched canonical, plus `noindex` or `nofollow` in either an `X-Robots-Tag` header or a page-level robots meta tag. The emitted URL set contains no admin, API, signal, World Cup, or redirected section-root route. Legitimate pubs remain eligible regardless of whether their price is missing, stale or unverified.

Representative initial-HTML checks also passed for a Tier A pub (`/west-leederville/exchange-bar`), a no-price-coverage suburb (`/connolly`), a qualifying suburb (`/fremantle`), an article, the changed Cosy Corners guide, an insight, Pint of the Day and a Friday happy-hour page: each returned 200, had its expected self-canonical, no `noindex`, a page-specific title and JSON-LD. Exchange Bar's rendered `BarOrPub` JSON-LD matches the visible venue name and suburb; its WebPage URL matches the canonical.

The changed guide was reviewed at desktop and 375×812 mobile. Its server-rendered shortlist, listed prices, last-checked dates and onward links were visible without layout overflow.

## Search Console observation start

Authenticated Search Console access was verified. The corrected `https://perthpintprices.com/sitemap.xml` was re-submitted successfully on 2026-07-21. At submission time Search Console still reported the previous successful read (12 July) and 415 discovered pages; that is pre-recrawl reporting, not a post-release result.

The Page indexing report was last updated 10 July and remains the same dated baseline used by [#229](https://github.com/iamjohnnymac/perthpintprices/issues/229): 378 Crawled — currently not indexed and 18 Discovered — currently not indexed overall, with the submitted-sitemap export cohorts of 99 and 18 respectively. Redirect-error validation is already **Started** for its two historical URLs. The report showed three canonical-choice entries; no broad revalidation or manual-indexing campaign was started because the current production canonical checks are clean and Google must recrawl first.

## Weekly observation runbook

Every Monday, record a dated snapshot with the Page indexing report's last-update date, indexed/not-indexed totals, the 99-URL Crawled cohort, the 18-URL Discovered cohort and the sitemap's last-read/discovered-page figures. Compare URLs against `docs/seo/gsc/2026-07-21/url-classification.csv`; investigate only changes in a current URL's response, canonical, robots directive or sitemap membership.

Do not claim recovery until Search Console's report date advances beyond this submission. At the post-recrawl checkpoint, close #237 only if sitemap indexation is at least 85% and Crawled — currently not indexed is below 50, or create follow-up issues that name and explain every remaining cohort. Do not manually request indexing in bulk; single-URL inspections are reserved for a diagnosed exception.
