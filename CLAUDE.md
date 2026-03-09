# Arvo — Perth Pint Prices

## Project overview
Arvo (perthpintprices.com) tracks pint prices across 300+ Perth pubs. Users discover cheap pints, find happy hours, plan pub crawls, and report prices.

- **Stack:** Next.js 14 (App Router), Tailwind CSS, TypeScript strict, Supabase
- **Hosting:** Vercel (auto-deploys from `main`), dev server on port 3001
- **Repo:** github.com/iamjohnnymac/perthpintprices
- **Supabase:** project ref `ifxkoblvgttelzboenpi` (Sydney region)

## Database
- `pubs` — venue info (name, slug, suburb, lat/lng, prices, happy hour, amenities)
- `price_history` — user-submitted price reports
- `price_snapshots` — weekly aggregate snapshots for trend tracking
- `crowd_reports` — live crowd level reports from users
- `push_subscriptions` — web push notification subscribers

## Routes (23 pages)
- **Core:** `/` homepage, `/discover`, `/happy-hour`, `/pub/[slug]`, `/suburb/[slug]`, `/suburbs`
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
`/api/pubs`, `/api/price-report`, `/api/pub-submission`, `/api/admin/*`, `/api/cron`, `/api/pint-of-the-day`, `/api/push`, `/api/race-meets`, `/api/weather`, `/api/weekly-report`, `/api/weekly-snapshot`

## Reference docs
- `docs/SEO-MASTER.md` — full SEO playbook (keyword targets, content strategy, link building, technical checklist)
- `docs/PROJECT-STATUS.md` — detailed history, recent work log, and backlog
- `docs/price-verification-kit.md` — price verification process

## Rules
- **Always check Context7 first** — before writing any code, use the Context7 MCP tool (`mcp__plugin_context7_context7__resolve-library-id` then `mcp__plugin_context7_context7__query-docs`) to look up current documentation for any library or framework being used (Next.js, Tailwind, Lucide, Supabase, etc.)
- **Always visually verify changes** — after any UI change, take Playwright screenshots at desktop (1280x800) and mobile (375x812) to confirm layout, spacing, and content look correct
- **Always follow the Design System below** — every UI change must use the correct tokens, components, and patterns defined in this file
- **Always run humanizer** — run the humanizer skill on any new user-facing text to remove AI writing patterns
- **Never use emojis** — use Lucide React icons or inline SVGs instead
- **Check TypeScript compiles** — run `npx tsc --noEmit` after code changes
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
