# Issue #237 Phase 1 proof — 2026-07-21

This is a sanitized record of the release gate. It intentionally contains no browser-session URL, export location, credential or secret.

## Production crawl

Command:

```sh
SITEMAP_VALIDATION_BASE_URL=https://perthpintprices.com node scripts/validate-sitemap.mjs
```

Observed result:

```text
SITEMAP_INDEX_STATUS  200
SITEMAP_URLS  https://perthpintprices.com/sitemap-content.xml  32
SITEMAP_URLS  https://perthpintprices.com/sitemap-suburbs.xml  150
SITEMAP_URLS  https://perthpintprices.com/sitemap-pubs.xml  833
LEGITIMATE_PUB_URLS  833
TOTAL_SITEMAP_URLS  1015
DUPLICATE_URLS  0
PROHIBITED_URLS  0
ROUTE_OR_CANONICAL_FAILURES  0
ROBOTS_DIRECTIVE_FAILURES  0
```

## Representative visual review

`/guides/cozy-corners` was reviewed at the normal desktop viewport and at 375×812. Both showed the server-rendered shortlist, venue price and last-checked facts, plus onward links; the mobile cards remained inside the page boundary with no horizontal overflow. These are review observations, not an indexing claim.

## Search Console action

The sitemap index was re-submitted successfully in authenticated Search Console on 2026-07-21. Search Console's submitted-sitemap row still showed the previous 12 July read and 415 discovered pages at that time, so a recrawl result is not represented here.
