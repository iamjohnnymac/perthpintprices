# Segmented sitemap policy — 2026-07-21

Issue [#232](https://github.com/iamjohnnymac/perthpintprices/issues/232) replaces the former mixed metadata sitemap with an observable index at `/sitemap.xml`:

- `/sitemap-content.xml` contains canonical editorial, tool, article, transport-hub, and happy-hour URLs, including `/suburbs`.
- `/sitemap-suburbs.xml` contains every suburb for which the shared `getSuburbIndexability({ legitimatePubCount })` predicate returns true. This is the #231 rule: one legitimate venue is sufficient; price state is never an input.
- `/sitemap-pubs.xml` contains every legitimate pub URL. The reconciled current inventory is 833 URLs; the only exclusions are independently validated closures, duplicates, or invalid rows.

`/guides` and `/insights` are intentionally absent because they are redirects. So are admin, API, signal, legacy, 404, and World Cup routes. `robots.txt` keeps `/admin`, `/api/`, and `/signal/` out of crawl; the admin APIs retain request authentication, and signal pages publish `noindex, nofollow` metadata. Robots directives are crawl guidance, not an access-control mechanism.

## Freshness

Editorial route timestamps live in `EDITORIAL_LAST_MODIFIED` and must only change with the relevant page/template content. They are deliberately independent of unrelated pub writes. Article dates come from the article source record. Live data surfaces use the most recent relevant pub record.

Pub timestamps use that pub's `last_verified`, then `updated_at`, then `last_updated`; an absent or invalid value falls back to `2026-05-31T00:00:00.000Z`. Suburb timestamps use the latest valid timestamp from an eligible pub in that suburb; where none exists they fall back to the latest valid timestamp across the eligible inventory, then the same documented fixed fallback. Confirmed closures are excluded from freshness exactly as they are from URL membership. This provides stable, honest XML without falsely announcing a site-wide editorial update.

## Release check

After a production build, run `SITEMAP_VALIDATION_BASE_URL=http://127.0.0.1:3000 node scripts/validate-sitemap.mjs` against the local production server. It validates the XML index, the three child inventories, the 833 legitimate-pub total, duplicate/private/redirect exclusions, and the HTTP 200 self-canonical response for every emitted URL.
