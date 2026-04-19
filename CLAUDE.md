# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview
Arvo (perthpintprices.com) tracks pint prices across 300+ Perth pubs. Users discover cheap pints, find happy hours, plan pub crawls, and report prices.

- **Stack:** Next.js 14 App Router, React 18, TypeScript strict, Tailwind CSS, Supabase (postgres + RPC)
- **Hosting:** Vercel (auto-deploys from `main`); two cron jobs configured in `vercel.json` (`/api/cron/price-check` daily, `/api/cron/weekly-snapshot` Sundays)
- **Repo:** github.com/iamjohnnymac/perthpintprices
- **Supabase:** project ref `ifxkoblvgttelzboenpi` (Sydney). Anon URL/key are checked-in fallbacks in `src/lib/supabase.ts`; override via `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **MCP servers** (`.mcp.json`): `supabase`, `vercel`, `apify`. Use the Supabase MCP for any DB schema/query work.
- **Path alias:** `@/*` -> `./src/*`

## Commands
- `npm run dev` — Next dev server (defaults to port 3000; CLAUDE.md historically mentions 3001 — pass `-p 3001` if needed)
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — `next lint`
- `npx tsc --noEmit` — strict typecheck. **Run after every code change.**
- `node scripts/test-responsive.mjs` — Playwright (firefox) viewport smoke test against `http://localhost:3000`

There is no Jest/Vitest suite. UI verification is done via Playwright screenshots (see Rules).

## Architecture

### Data flow
All data fetching goes through `src/lib/supabase.ts`. Three loaders matter:
- `getPubs()` — full `Pub` shape; used by client components via `FeaturePageShell` and most server pages.
- `getPubsLite()` — narrow column projection; used on the homepage to keep SSR HTML small (~80KB vs ~352KB).
- `getPubBySlug()` / `getNearbyPubs()` / `getSimilarPricePubs()` — pub detail page + cross-linking.

Every loader runs each row through `getHappyHourStatus()` (`src/lib/happyHourLive.ts`) so `pub.price` is the **effective price right now** (HH price when active, regular price otherwise). `pub.regularPrice` and `pub.happyHourPrice` are preserved separately. When sorting or comparing prices, decide intentionally which field you want.

`getSiteStats()` reads the latest `price_snapshots` row and falls back to computing from `pubs` if missing — used in `generateMetadata()` on the root layout for live OG description copy.

### Happy hour engine
`src/lib/happyHourLive.ts` is the source of truth: parses postgres array day formats (`{Mon,Tue,...}`), day ranges (`Mon-Fri`), and `Daily`/`7 days`/`Everyday`; converts `start`/`end` to Perth time (AWST UTC+8, hardcoded — no DST in WA); returns `{ effectivePrice, isActive, happyHourLabel, minutesRemaining }`. `src/lib/happyHour.ts` is the legacy text parser still used in places that only have the freeform `happy_hour` string.

### Page shell pattern
`src/components/FeaturePageShell.tsx` is the standard wrapper for `/guides/*`, `/insights/*`, and feature pages. It:
1. Renders `SubPageNav` (breadcrumbs) + sr-only H1 + `Footer`.
2. Loads `getPubs()` client-side, optional `getCrowdLevels()` (`needsCrowd` prop), and best-effort geolocation.
3. Calls children as a render-prop with `{ pubs, userLocation, crowdReports }`.
4. Wraps content in `ErrorBoundary` and shows a spinner during initial load.

Use this shell for any new guide/insight page rather than re-implementing the loading dance.

### Server vs client split
- `src/app/page.tsx` (server) handles metadata + JSON-LD, then renders `HomeClient.tsx`.
- Most `/app/<route>/page.tsx` files are server components that compute metadata; their interactive piece is a `*Client.tsx` sibling.
- `src/app/Providers.tsx` wraps client-side providers in the root layout.

### Routes (23 pages)
- **Core:** `/` homepage, `/discover`, `/happy-hour`, `/pub/[slug]`, `/[suburb]`, `/suburbs` (note: `/suburb/[slug]` is a permanent redirect to `/[slug]`, configured in `next.config.js`)
- **Guides:** `/guides` index + `beer-weather`, `cozy-corners`, `dad-bar`, `punt-and-pints`, `sunset-sippers`
- **Insights:** `/insights` index + `pint-index`, `pint-of-the-day`, `suburb-rankings`, `tonights-best-bets`, `venue-breakdown`
- **Features:** `/pint-crawl`, `/pub-golf`, `/weekly-report`, `/leaderboard`
- **Admin:** `/admin`

### API routes (`src/app/api/`)
`pubs`, `price-report`, `pub-submission`, `admin/{review,stats}`, `cron/{price-check,weekly-snapshot}`, `pint-of-the-day`, `push`, `race-meets`, `weather`, `weekly-report`, `weekly-snapshot`, `menu-scan`.

### Database tables
- `pubs` — venue info; columns referenced widely: `slug`, `suburb`, `lat`, `lng`, `price`, `happy_hour`, `happy_hour_price`, `happy_hour_days`, `happy_hour_start`, `happy_hour_end`, `price_verified`, `last_verified`, `vibe_tag`, `image_url`, plus boolean `sunset_spot`/`has_tab`/`kid_friendly`/`cozy_pub`.
- `price_history` — append-only; powers `getPriceHistory()` and the `PriceHistory` chart.
- `price_snapshots` — weekly aggregates; written by the Sunday cron, read by `getSiteStats()`.
- `crowd_reports` — live crowd levels; aggregated via the `get_live_crowd_levels` RPC.
- `push_subscriptions` — web push subscribers (server-side `web-push`).

### Service worker
`public/sw.js` is served with `Cache-Control: no-cache` (see `next.config.js`) so updates roll out immediately. Don't add hash-suffixed caching to it.

## Reference docs
- `docs/SEO-MASTER.md` — full SEO playbook (keywords, content strategy, link building, technical checklist)
- `docs/PROJECT-STATUS.md` — recent work log and backlog
- `docs/price-verification-kit.md` — price verification process

## Rules
- **Always check Context7 first** — before writing code that touches a library/framework, use the Context7 MCP tool (`mcp__plugin_context7_context7__resolve-library-id` then `mcp__plugin_context7_context7__query-docs`) for current docs (Next.js, Tailwind, Lucide, Supabase, etc.).
- **Always visually verify UI changes** — take Playwright screenshots at desktop (1280x800) and mobile (375x812) after any UI change.
- **Always follow the Design System below** — use the correct tokens and component patterns.
- **Always run humanizer** — run the humanizer skill on any new user-facing copy.
- **Never use emojis** — use Lucide React icons or inline SVGs.
- **Check TypeScript compiles** — `npx tsc --noEmit` after code changes.
- **Update docs after every push** — append a dated entry under "What's done recently" in `docs/PROJECT-STATUS.md` with bullet points and the commit hash.
- **SEO on new pages** — every new page needs: title (<60 chars), description (<160 chars), canonical URL, OG tags, Twitter card. See `docs/SEO-MASTER.md`. Add the page to `src/app/sitemap.ts`.
- **Don't commit gitignored utility scripts** — `scripts/merge-research.js`, `scripts/compare-prices.js`, `scripts/analyze-json.js`, `scripts/fix-seo.js`, `scripts/audit-locations.js`, `scripts/apply-*-fixes.js`, and the `perth_pubs_pricing/` research output are intentionally excluded.

## Design System

### Colors (Tailwind tokens, never hardcode hex)
- `text-ink` / `bg-ink` — #171717 (also `ink-light` #2E2E2E)
- `text-gray-mid` — #8A8A85 (also `gray-light` #EFEFED, `gray` #D4D4D0)
- `bg-off-white` — #F7F7F5
- `bg-[#FDF8F0]` — page background
- `text-amber` / `bg-amber` — #D4740A (also `amber-light`, `amber-pale`)
- `bg-red` / `bg-red-pale`, `bg-green` / `bg-green-pale`, `bg-blue`, `bg-purple`
- Never use `stone-*`, `orange-*`, or raw hex like `#1A1A1A`, `#888`, `#666`. Shadcn `hsl(var(--…))` colors exist but are reserved for `components/ui/*` — don't reach for them in feature code.

### Typography (font variables loaded in `app/layout.tsx`)
- `font-mono` (JetBrains Mono) — labels, nav, buttons, data
- `font-display` (DM Serif Display) — decorative headings
- `font-body` (Plus Jakarta Sans) — body text

### Components
- Borders: `border-3 border-ink` (custom `borderWidth.3`)
- Cards: `rounded-card` (12px)
- Buttons/pills: `rounded-pill` (9999px) — never `rounded-2xl`
- Shadows: `shadow-hard-sm` (3px) — never bare `shadow-hard` (4px)
- Standard button pattern: `border-3 border-ink rounded-pill shadow-hard-sm`

### Layout
- Container: `max-w-container` (800px) with `px-6`
- All pages must include `<Footer />`
- Sub-pages use `<SubPageNav />` for header
- Homepage header has 3 nav links: Discover, Happy Hours, Pint Report
- Use `BreadcrumbJsonLd` for schema.org breadcrumbs (the `url` property, not `item` — bug previously fixed)
