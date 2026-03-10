# Arvo Project Status

Last updated: 2026-03-10

## What this is

Arvo (perthpintprices.com) tracks pint prices across 300+ Perth pubs. Users can discover cheap pints, find happy hours, plan pub crawls, and report prices. The site is live on Vercel.

Stack, database, routes, components, and lib files are documented in `CLAUDE.md` (auto-loaded every session). This file covers history, recent work, and the backlog.

## What's done recently

### Pub location audit and fix (2026-03-10)
- Audited all 423 pub lat/lng coordinates against Google Places Text Search API
- Fixed 146 incorrect locations: 126 auto-applied (confident name matches), 11 user-confirmed with suburb corrections, 9 geocoded from user-provided addresses
- Corrected 6 suburb mismatches (Bright Tank Brewing, Broken Hill Hotel, Indian Ocean Hotel, Fenian Irish Pub, The Paddo, Botanical Bar)
- Filled 3 missing coordinates (399 Bar, Brew University, The Naked Fox Wine Bar)
- Accuracy improved from 64.5% to 97.6% within 100m of Google's coordinates
- 4 pubs could not be confirmed as operating (Hippo Bar, Ocean Reef Tavern, Mosman Park Hotel, North Beach Hotel)
- Scripts: `audit-locations.js`, `apply-confident-fixes.js`, `apply-manual-fixes.js` (gitignored)

### Homepage UX overhaul (2026-03-10)
- Consolidated filter section from 3 rows to 2 on mobile (removed beer type filter, simplified layout)
- Replaced distance radius pills with a dropdown that swaps in for the suburb dropdown when sorting by Nearest
- Fixed contradictory copy across FAQ, HowItWorks, SocialProof, and JSON-LD (removed automation claims, aligned with community-powered messaging)
- Made Suburbs stat card link to /suburbs, Cheapest stat card dynamically links to cheapest pub's page
- Moved draught beer animation up on mobile (negative top margin)
- Fixed beer stream alignment in draught animation (stream now centered in glass)
- Committed as `48f139f`

### Dead code cleanup (2026-03-10)
- Removed 16 unused components (1,676 lines): CrowdBadge, CrowdPulse, HappyHourPreview, InfoTooltip, MapPeek, MapPeekInline, MyLocals, NotificationBell, PintIndexCompact, PintOfTheDayCompact, PriceReporter, PriceTicker, PubCardsView, PubListView, StatsBar, TabBar
- Removed unused `src/lib/emoji.ts` and placeholder `newfile`
- Added scripts, research data, and supabase config to `.gitignore`
- Deleted 163 testing screenshots from project root
- Committed as `9fe1345`

### SEO audit and fixes (2026-03-09)
- Full audit against `docs/SEO-MASTER.md` playbook
- Fixed BreadcrumbJsonLd schema bug (`item` -> `url`)
- Added Twitter cards to 15 pages
- Added sr-only H1 tags to all pages missing them
- Trimmed over-length titles and descriptions
- Added OG tags to suburbs page
- Committed as `2a6e082`

### Humanizer audit (2026-03-09)
- Full site audit for AI text patterns
- Codebase was already clean. Only 5 em dashes replaced with periods
- Files: CrowdPulse, PuntNPints, SunsetSippers, TonightsMoves, PubGolfClient
- Committed as `f3e93b5`

### Research agent merge (2026-03-09)
- 190 research agent JSON files collected new pub data
- Merged 49 updates + 3 new pubs into Supabase via `scripts/merge-research.js`
- Agents collected new pubs but did NOT refresh existing prices
- Script only fills null fields, never overwrites existing data
- Results stored locally in `perth_pubs_pricing/results/` (gitignored)

## What's still to do

### Data
- **222 pubs still missing regular prices** — need another research agent pass focused on price collection
- Consider price refresh strategy for stale prices (some pubs haven't been updated in months)

### SEO
Full checklist in `docs/SEO-MASTER.md` section 6. Key remaining items:
- Dynamic OG images for pub and suburb pages
- next/image migration for WebP/lazy loading
- ~~FAQPage schema on homepage FAQ~~ (done — JSON-LD in `page.tsx`)
- Google Business Profile setup
- Google Search Console registration and sitemap submission
- Core Web Vitals audit
- Intro text on data-heavy pages (discover, happy hour, suburbs list)
- Keyword-targeted content (see SEO-MASTER.md section 3)

### Features (ideas, not committed)
- Price alerts / watchlist notifications
- ~~"Near me" improvements with better geolocation UX~~ (done — distance dropdown replaces suburb when sorting nearest)
- Pub comparison tool
- Historical price charts on pub detail pages

## Utility scripts (local only, gitignored)
- `scripts/merge-research.js` — merge research JSON into Supabase (dry-run supported)
- `scripts/analyze-json.js` — analyze research JSON files for mergeable data
- `scripts/compare-prices.js` — compare JSON prices vs DB prices
- `scripts/fix-seo.js` — batch SEO metadata fixes
- `scripts/test-responsive.mjs` — Playwright responsive screenshot testing
- `scripts/audit-locations.js` — audit pub lat/lng against Google Places API
- `scripts/apply-confident-fixes.js` — apply confident location fixes with name matching
- `scripts/apply-manual-fixes.js` — apply user-reviewed fixes and geocode addresses
