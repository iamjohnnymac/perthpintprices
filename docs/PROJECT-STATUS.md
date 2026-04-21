# Arvo Project Status

Last updated: 2026-04-21

## What this is

Arvo (perthpintprices.com) tracks pint prices across 800+ Perth pubs. Users can discover cheap pints, find happy hours, plan pub crawls, and report prices. The site is live on Vercel.

Stack, database, routes, components, and lib files are documented in `CLAUDE.md` (auto-loaded every session). This file covers history, recent work, and the backlog.

## What's done recently

### Phone-agent e2e audit + hardening (2026-04-21)
Addressing issues surfaced by yesterday's end-to-end audit (15 real-pub pilot calls + 1 verified capture).
- **Kickoff dedupe bug fixed** (`src/app/api/pintsweep/kickoff/route.ts`). Cooldown was keyed off `pubs.last_verified`, which only bumps when a price is captured — so a pub that answered without giving a price would get called again the next day. Now drives off `phone_call_log.created_at` (actual call attempts), default 72h cooldown, configurable via `cooldownHours` in the request body. If the cooldown query errors we fail closed rather than re-dial.
- **DNC (do-not-call) marker** — a `phone_call_log` row with `parsed_confidence='do_not_call'` permanently excludes that pub from future sweeps. Fixes the "Royal Fremantle remembers us" backlog item. Flag a pub via `node scripts/mark-dnc.mjs --slug <slug> --reason "..."`; clear with `--undo`. Kickoff response now also reports `excluded.dnc_marked` and `excluded.by_cooldown_or_dnc`.
- **Post-call data extraction implemented** (`src/app/api/agents/post-call/route.ts`). Comment promised a transcript-fallback extraction that was never built; `parsed_price` / `parsed_beer_type` were hardcoded `null`. Now parses `analysis.data_collection_results` into structured fields, and if a valid price landed in the analysis but the mid-call `record_price` tool never fired (dropped call, agent summarised without tool call), writes to `pubs` + `price_history` as a fallback. Respects the same $5-$20 sanity range as the mid-call tool.
- **Agent config** — added `platform_settings.data_collection` schema to `agents/andrew.json` with `price`, `beer_type`, `unit`, `happy_hour`, `confidence`, `raw_quote`. Without this ElevenLabs returns an empty `data_collection_results` block, so the post-call fallback has nothing to work with.
- **record-price correctness** — stopped bumping `last_verified` on happy-hour-only or brand-only captures (was claiming the seed price was verified today). `last_verified` now only moves when a real price lands. Also added an edge-case 400 for the pathological "only a price supplied and it failed the sanity range" path.

### AI phone agent ("Andrew") — full end-to-end build + first real capture (2026-04-20)
- Built on **ElevenLabs Conversational AI Agents platform** — first-party Claude Haiku 4.5 LLM, Andrew voice (stock AU male, `IRuDCTQL6MMy1qvcsue1`), Flash v2 TTS, Twilio native telephony integration.
- Three new API routes: `/api/agents/record-price/[slug]` (mid-call tool), `/api/agents/post-call` (transcription webhook, HMAC-signed), `/api/pintsweep/kickoff` (batch trigger with 24h dedupe + Places open-now filter).
- `agents/andrew.json` is the version-controlled agent config — 17k-char system prompt with 6 few-shot transcripts + 3 anti-patterns, 71 Scribe v2 keyterms (Perth beer brands, suburbs, pour sizes), built-in tools for end_call, voicemail_detection, skip_turn, play_keypad_touch_tone.
- Prompt tuning done over 20+ test calls: two-beat opener, name-grab with brush-off handling, eager record_price (fire with any data, don't wait for complete set), transfer/IVR re-intro patterns, marketing-plug on polite refusal, filler-filler rule, mate budget.
- Live pilot: 15 real-pub calls across 3 pilot rounds. **First verified real capture: Kalamunda Hotel — $12.80 pint of Great Northern Super Crisp, captured from Cassie at 115s call duration.**
- Also captured partial (happy hour only) from Bayswater Hotel via their AI receptionist: "Mon-Fri 5-6pm on select beers, wines and cocktails". Price not obtainable (they transferred to a human who didn't respond in time).
- Cost per call: ~$0.15-0.25. Full 576-pub sweep estimated at ~$85-130.
- Commits: `d5f6779`, `c979d9d`, many iterative prompt commits through `7be4c50`.

### ISR migration — 11.5× faster builds (2026-04-20)
- `src/app/[suburb]/[pub]/page.tsx`: `generateStaticParams()` now returns `[]` with explicit `export const dynamicParams = true`; `revalidate: 300` stays. No pub pages pre-rendered at build — first request generates on-demand, subsequent requests hit the ISR cache.
- `src/app/sitemap.ts`: added `export const revalidate = 3600` so new pubs appear in `/sitemap.xml` within 60 min of insertion (previously only on redeploy).
- Build time: **475s → 41s** (~11.5× faster) on the first post-migration deploy.
- Pages generated at build: 911 → ~30.
- SEO-neutral: smoke-tested prod — `x-vercel-cache: MISS` on first hit, `HIT` on second, metadata renders identically.
- Phone-agent price writes now propagate to public pub pages within 300s without needing a deploy.
- Rollback if ever needed: restore original `generateStaticParams` body.
- Commit `9c88fb3`.

### Google Places venue discovery — 413 → 857 pubs (2026-04-19)
- Added `place_id text unique` column to `pubs` (indexed).
- Backfilled `place_id` on existing rows via Places API (New) `searchText`: 352 high-confidence + 22 medium-confidence auto-written, 20 low-confidence flagged, 25 rejects. Finalize pass promoted 6 more near-0m operational matches. Total: 380/413 tagged (92%).
- Deleted 10 `CLOSED_PERMANENTLY` venues: The Flying Scotsman, Jack Rabbit Slim's, Five Bar, Wolf Lane, Halford Bar, Helvetica Bar, Yelo Trigg, Ruin Bar, Badlands Bar, W Churchill.
- Bulk discovery via `places:searchNearby` seeded from every existing pub (1500m radius then 500m follow-up): 602 + 145 candidates. Post-filtered for drink-led primary types (bar, pub, wine_bar, brewery, brewpub, cocktail_bar, sports_bar, night_club, gastropub, bar_and_grill, lounge_bar) + restaurants that have bar/pub/brewery in their `types[]`.
- Inserted **444 new venues** (442 from pass 1, 2 from pass 2). Dedupe: place_id + normalised name+suburb + 30m proximity.
- Final state: **857 pubs, 815 with place_id (95%), 740 with website (86%), ~600 with phone numbers.**
- 27 uncertain backfill matches written to `scripts/backfill-review.json` for manual review (likely-closed venues, rebrands, etc.).
- Cost: $0 (within Google's free Essentials/Pro tier).
- Scripts (checked in, not gitignored; read keys from `.env.local`): `backfill-place-ids.mjs`, `finalize-backfill.mjs`, `discover-venues.mjs`, `insert-discovered-venues.mjs`.
- Commits: `f5aed35`, `b756aa4`, `014f3a7`, `1ac6e7d`.

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
- **664 pubs missing regular prices** (up from 222 after the Places discovery run added 444 new venues). Plan: AI phone-agent sweep inspired by Guinndex — Twilio + ElevenLabs + Claude calls every price-less venue during business hours, Claude parses transcripts into structured price data. See "AI phone-agent price sweep" in planned work below.
- Consider price refresh strategy for stale prices (some pubs haven't been updated in months)
- 27 backfill matches still uncertain — `scripts/backfill-review.json`. Likely includes rebrands (Rosie O'Grady's → Johnny Fox's) and venues that probably closed (Hippo Bar, Ocean Reef Tavern, Mosman Park Hotel, North Beach Hotel). Needs human call.

### AI phone-agent price sweep (planned)
- Borrowing from Guinndex (guinndex.ai, Matt Cortland, March 2026). Their "Rachel" agent called 3,000 Irish pubs over St Paddy's weekend for ~€200, got 1,000+ prices.
- Stack: **Twilio** (outbound AU calls), **ElevenLabs** (voice), **Claude** (script + transcript parsing). Phone numbers come from the `place_id` backfill (~600 available).
- Sweep all 664 price-less pubs during weekday afternoons; target: 50%+ answer rate, 30%+ price capture.
- Needs: Twilio SID/token + AU outbound number, ElevenLabs key + voice, Anthropic key for parsing, explicit user OK on automated outbound calls to businesses.

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
