# Perth Pint Prices

## Project overview
Perth Pint Prices (perthpintprices.com) tracks pint prices across 300+ Perth pubs. Users discover cheap pints, find happy hours, plan pub crawls, and report prices.

- **Stack:** Next.js 14 (App Router), Tailwind CSS, TypeScript strict, Supabase
- **Hosting:** Vercel (auto-deploys from `main`), dev server on port 3001
- **Repo:** github.com/iamjohnnymac/perthpintprices
- **Supabase:** project ref `ifxkoblvgttelzboenpi` (Sydney region)

## Database
- `pubs` — venue info (name, slug, suburb, lat/lng, prices, happy hour, amenities) — currently 857 pubs, 663 missing regular prices
- `price_reports` — user- and AI-submitted price reports (the `record_price` webhook + the public form both write here)
- `price_history` — internal price-change log (audit trail of `pubs.price` updates)
- `price_snapshots` — weekly aggregate snapshots for trend tracking
- `crowd_reports` — live crowd level reports from users
- `phone_call_log` — full transcript + cost log of every Andrew call (post-call webhook)
- `push_subscriptions` — web push notification subscribers

## Routes (23 pages)
- **Core:** `/` homepage, `/discover`, `/happy-hour`, `/[suburb]/[pub]` (e.g. `/fremantle/the-norfolk-hotel`), `/[suburb]` (e.g. `/fremantle`), `/suburbs`
- **Legacy redirect stubs:** `/pub/[slug]` and `/suburb/[slug]` return 308 redirects to the current URL structure
- **Guides (5):** `/guides` index, `/guides/beer-weather`, `/guides/cozy-corners`, `/guides/dad-bar`, `/guides/punt-and-pints`, `/guides/sunset-sippers`
- **Insights (5):** `/insights` index, `/insights/pint-index`, `/insights/pint-of-the-day`, `/insights/suburb-rankings`, `/insights/tonights-best-bets`, `/insights/venue-breakdown`
- **Features:** `/pint-crawl`, `/pub-golf`, `/weekly-report`, `/leaderboard`
- **Admin:** `/admin`

## Components (34 in `src/components/`)
BeerWeather, BreadcrumbJsonLd, CrowdReporter, DadBar, ErrorBoundary, FAQ, FeaturePageShell, FilterSection, Footer, HeroSection, HowItWorks, InstallPrompt, LucideIcon, Map, MiniMap, MobileNav, PintIndex, PintIndexBadge, PintOfTheDay, PriceHistory, PubCard, PubCardList, PubDetailMap, PuntNPints, RainyDay, ScrollReveal, SocialProof, SubPageNav, SubmitPubForm, SuburbLeague, SunsetSippers, TonightsMoves, VenueIntel, WatchlistButton

**Key patterns:**
- `FeaturePageShell` wraps guide/insight pages (loads pubs, crowd data, geolocation). Pass `title` prop for sr-only H1.
- `SubPageNav` for breadcrumb navigation on sub-pages
- `BreadcrumbJsonLd` for schema.org breadcrumb structured data (uses `url` property, not `item`)

## Lib files (12 in `src/lib/`)
freshness, happyHour, happyHourLive, location, mapTheme, mapTile, priceColors, priceLabel, pushNotifications, sunPosition, supabase, utils

## API routes
- **User-facing**: `/api/pubs`, `/api/price-report`, `/api/pub-submission`, `/api/menu-scan`, `/api/pint-of-the-day`
- **Andrew (voice agent)**: `/api/agents/record-price/[slug]` (mid-call webhook), `/api/agents/post-call` (HMAC-signed post-call webhook), `/api/pintsweep/kickoff` (batch trigger via ElevenLabs Batch Calling)
- **Admin**: `/api/admin/review`, `/api/admin/stats`
- **Cron / scheduled**: `/api/cron/price-check`, `/api/cron/weekly-snapshot`, `/api/weekly-snapshot`, `/api/weekly-report`
- **Other**: `/api/push/send`, `/api/push/subscribe`, `/api/race-meets`, `/api/weather`

## Reference docs
- `docs/PROJECT-STATUS.md` — detailed history, recent work log, and backlog (read first for "what's going on")
- `docs/SEO-MASTER.md` — full SEO playbook (keyword targets, content strategy, link building, technical checklist)
- `docs/seo-research-2026.md` — what's new in late-2026 SEO (AEO/GEO, Information Gain, MenuItem schema, AU local). Companion to SEO-MASTER.
- `docs/seo-action-plan.md` — prioritised SEO punch list driven by real GSC + GA4 data; maps 1:1 to milestone #1 issues
- `docs/andrew-voice-research.md` — voice models + TTS tuning research for the Andrew agent
- `docs/price-verification-kit.md` — price verification process
- `docs/handover-*.md` — nightly handover notes (most recent first)
- Agent config: `agents/andrew.json` (version-controlled, PATCHed to ElevenLabs)

## Rules
- **Always check Context7 first** — before writing any code, use the Context7 MCP tool (`mcp__plugin_context7_context7__resolve-library-id` then `mcp__plugin_context7_context7__query-docs`) to look up current documentation for any library or framework being used (Next.js, Tailwind, Lucide, Supabase, etc.)
- **Always visually verify changes** — after any UI change, take Playwright screenshots at desktop (1280x800) and mobile (375x812) to confirm layout, spacing, and content look correct
- **Always follow the Design System below** — every UI change must use the correct tokens, components, and patterns defined in this file
- **Always run humanizer** — run the humanizer skill on any new user-facing text to remove AI writing patterns
- **Never use emojis** — use Lucide React icons or inline SVGs instead
- **Check TypeScript compiles** — run `npx tsc --noEmit` after code changes
- **Update docs after every push** — after pushing to remote, update `docs/PROJECT-STATUS.md` with what changed (new entry under "What's done recently" with date, bullet points, and commit hash)
- **SEO on new pages** — every new page needs: title (<60 chars), description (<160 chars), canonical URL, OG tags, Twitter card. Check `docs/SEO-MASTER.md`

## Design System

### Colors (always use Tailwind tokens, never hardcode hex)
- `text-ink` / `bg-ink` — #171717
- `text-gray-mid` — #8A8A85
- `bg-off-white` — #F7F7F5
- `bg-[#FDF8F0]` — page background
- `text-amber` / `bg-amber` — #D4740A
- `bg-amber-pale` — #FFF3E0
- Never use `stone-*`, `orange-*`, or raw hex like `#1A1A1A`, `#888`, `#666`

### Typography
- `font-mono` (JetBrains Mono) — labels, nav, buttons, data
- `font-display` (DM Serif) — decorative headings
- `font-body` (Plus Jakarta Sans) — body text

### Components
- Borders: `border-3 border-ink`
- Cards: `rounded-card` (12px)
- Buttons/pills: `rounded-pill` (9999px) — never `rounded-2xl`
- Shadows: `shadow-hard-sm` (3px) — never bare `shadow-hard` (4px)
- Button pattern: `border-3 border-ink rounded-pill shadow-hard-sm`

### Layout
- Container: `max-w-container` (800px) with `px-6`
- All pages must include `<Footer />`
- Sub-pages use `<SubPageNav />` for header
- Homepage header has 3 nav links: Discover, Happy Hours, Pint Report
