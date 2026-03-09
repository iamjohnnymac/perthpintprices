# Arvo Project Status

Last updated: 2026-03-09

## What this is

Arvo (perthpintprices.com) tracks pint prices across 300+ Perth pubs. Users can discover cheap pints, find happy hours, plan pub crawls, and report prices. The site is live on Vercel.

## Stack

- **Frontend:** Next.js 14 (App Router), Tailwind CSS, TypeScript strict
- **Backend:** Supabase (project ref: `ifxkoblvgttelzboenpi`, Sydney region)
- **Hosting:** Vercel (auto-deploys from `main` branch)
- **Repo:** github.com/iamjohnnymac/perthpintprices

## Database tables

- `pubs` — venue info (name, slug, suburb, lat/lng, prices, happy hour, amenities)
- `price_history` — user-submitted price reports
- `price_snapshots` — weekly aggregate snapshots for trend tracking
- `crowd_reports` — live crowd level reports from users
- `push_subscriptions` — web push notification subscribers

## Routes (23 pages)

### Core
- `/` — homepage with hero, discover preview, happy hour preview, pint ticker
- `/discover` — full pub search with filters, map, list/card views
- `/happy-hour` — currently active happy hours
- `/pub/[slug]` — individual pub detail page (dynamic)
- `/suburb/[slug]` — suburb detail page (dynamic)
- `/suburbs` — suburb directory

### Guides (5)
- `/guides` — guide index
- `/guides/beer-weather` — weather-matched pub suggestions
- `/guides/cozy-corners` — indoor/cozy pub picks
- `/guides/dad-bar` — dad-friendly pub picks
- `/guides/punt-and-pints` — pubs with TAB on-site
- `/guides/sunset-sippers` — sunset/outdoor pubs

### Insights (5)
- `/insights` — insights index
- `/insights/pint-index` — Perth Pint Index (city-wide price tracking)
- `/insights/pint-of-the-day` — daily featured cheap pint
- `/insights/suburb-rankings` — suburbs ranked by avg price
- `/insights/tonights-best-bets` — best deals right now
- `/insights/venue-breakdown` — venue category price comparison

### Features
- `/pint-crawl` — pub crawl route planner with budget
- `/pub-golf` — pub golf scorecard generator
- `/weekly-report` — weekly price report
- `/leaderboard` — price scout leaderboard (top reporters)
- `/admin` — admin panel (review submissions, manage pubs)

## API routes

- `/api/pubs` — pub data
- `/api/price-report` — submit price reports
- `/api/pub-submission` — submit new pubs
- `/api/admin/*` — admin review endpoints
- `/api/cron` — scheduled jobs
- `/api/pint-of-the-day` — daily pint selection
- `/api/push` — push notification dispatch
- `/api/race-meets` — Perth racing calendar (TAB integration)
- `/api/weather` — weather data for beer-weather guide
- `/api/weekly-report` — generate weekly report
- `/api/weekly-snapshot` — take weekly price snapshot

## Key components

- `FeaturePageShell` — shared wrapper for guide/insight pages (loads pubs, crowd data, geolocation)
- `SubPageNav` — breadcrumb navigation for sub-pages
- `BreadcrumbJsonLd` — schema.org breadcrumb structured data
- `PubCard` / `PubCardList` / `PubListView` / `PubCardsView` — pub display components
- `CrowdPulse` / `CrowdReporter` / `CrowdBadge` — live crowd reporting system
- `PriceReporter` / `PriceHistory` — price submission and history
- `Map` / `MiniMap` / `MapPeek` / `PubDetailMap` — map components
- `HeroSection` / `StatsBar` / `PriceTicker` — homepage components
- `Footer` / `MobileNav` / `TabBar` — navigation

## Key lib files

- `supabase.ts` — all Supabase queries (getPubs, getCrowdLevels, etc.)
- `happyHour.ts` / `happyHourLive.ts` — happy hour parsing and live status
- `freshness.ts` — price freshness/staleness logic
- `location.ts` — geolocation and distance calculations
- `pushNotifications.ts` — web push notification setup
- `sunPosition.ts` — sunset time calculations for sunset sippers

## What's done recently

### Research agent merge (2026-03-09)
- 190 research agent JSON files collected new pub data
- Merged 49 updates + 3 new pubs into Supabase via `scripts/merge-research.js`
- Agents collected new pubs but did NOT refresh existing prices
- Script only fills null fields, never overwrites existing data
- Results stored in `perth_pubs_pricing/results/`

### Humanizer audit (2026-03-09)
- Full site audit for AI text patterns
- Codebase was already clean — only 5 em dashes replaced with periods
- Files: CrowdPulse, PuntNPints, SunsetSippers, TonightsMoves, PubGolfClient
- Committed as `f3e93b5`

### SEO audit and fixes (2026-03-09)
- Full audit against `docs/SEO-MASTER.md` playbook
- Fixed BreadcrumbJsonLd schema bug (`item` -> `url`)
- Added Twitter cards to 15 pages
- Added sr-only H1 tags to all pages missing them
- Trimmed over-length titles and descriptions
- Added OG tags to suburbs page
- Committed as `2a6e082`

## What's still to do

### Data
- **222 pubs still missing regular prices** — need another research agent pass focused on price collection
- Consider price refresh strategy for stale prices (some pubs haven't been updated in months)

### SEO (from docs/SEO-MASTER.md)
- Dynamic OG images (Next.js ImageResponse)
- Migrate images to next/image for WebP/lazy loading
- Google Business Profile setup
- Google Search Console registration and sitemap submission
- Core Web Vitals audit
- Internal search logging for keyword insights
- Add intro text to data-heavy pages (suburb rankings, venue breakdown)

### Features (ideas, not committed)
- Price alerts / watchlist notifications
- "Near me" improvements with better geolocation UX
- Pub comparison tool
- Historical price charts on pub detail pages

## Utility scripts

- `scripts/merge-research.js` — merge research JSON into Supabase (dry-run supported)
- `scripts/analyze-json.js` — analyze research JSON files for mergeable data
- `scripts/compare-prices.js` — compare JSON prices vs DB prices
- `scripts/fix-seo.js` — batch SEO metadata fixes
- `scripts/test-responsive.mjs` — Playwright responsive screenshot testing
