# Perth Pint Prices Project Status

Last updated: 2026-06-10

## What this is

Perth Pint Prices (perthpintprices.com) tracks pint prices across **857 Perth pubs** (up from 423 in March). Users can discover cheap pints, find happy hours, and report prices. The site is live on Vercel.

Stack, database, routes, components, and lib files are documented in `CLAUDE.md` (auto-loaded every session). This file covers history, recent work, and the backlog.

## What's done recently

### Slack notifications for the review queue (2026-06-10)
- **Why:** a pending price report (Gage Roads, Single Fin $14.50) sat unnoticed for 4 days — nothing told the admin the queue had work in it.
- **New `src/lib/slackNotify.ts`** — posts to a Slack incoming webhook via the `SLACK_WEBHOOK_URL` env var. Best-effort by design: missing env var or a Slack outage logs and moves on, never breaks a submission or cron. Message formatters are pure functions with unit tests.
- **Instant ping:** `/api/price-report` POST notifies Slack the moment a report lands — price reports, happy hour reports, and stale-price flags each get their own wording, with pub name, suburb, beer, price, source, and a link to `/admin`.
- **Daily reminder:** the existing daily `price-check` cron (8am Perth) now also counts pending `price_reports` (with the oldest report's age) and `pub_submissions`, and sends a queue summary — silent when empty. Piggybacked on the existing cron because Vercel Hobby caps cron jobs at two and both slots are taken.
- **Action needed:** create a Slack incoming webhook and add `SLACK_WEBHOOK_URL` to Vercel env vars — until then the code no-ops with a console warning.
- **Verification:** `tsc` clean, **308 unit tests** pass (+7 new in `slackNotify.test.ts`). Commit `dce54d2`.

### /world-cup live hub page (2026-06-10)
- **New `/world-cup` route** — a FANZO-style fixture hub with the trust layer they fake: all **72 group-stage fixtures in AWST** (captured from FANZO's geo-localised rail, cross-checked against two AEST schedule sources; Socceroos times triple-verified against the official announcement), each tagged with its **WA trading window** — `permit hours` (midnight–6am any day, plus Sunday before 10am), `early doors` (6–9am, legal on a standard licence), `normal trading`. Knockouts deliberately omitted until the bracket settles — nothing TBC ships.
- **`src/lib/worldCup.ts`** — fixtures data + `tradingStatus()` classifier built on `perthClock` (standard hours 6am–midnight Mon–Sat / 10am Sunday per DLGSC, checked 10 June 2026; World Cup extended-trading permit announced 5 June 2026), `formatKickoff` (midnight/midday/3am/8.30am style), `CONFIRMED_OPENINGS` ledger (renders an honest empty state until venues confirm door times — no Andrew for now, so confirmations are manual + report-form), `FORM_GUIDE_SLUGS`.
- **`src/components/WorldCupFixtures.tsx`** — client fixture list grouped by Perth day: live clock (60s tick), ON NOW / NEXT chips, played matches auto-collapse, All / Socceroos & Group D filter, Socceroos rows highlighted.
- **Page** (`src/app/world-cup/page.tsx`) — hero stat cards, Socceroos cards, dark confirmed-opens card with report CTA, **screens form guide** pulling live pint prices + checked dates from our own pubs data (the moat: FANZO lists venues, we list venues *with the price and the date we checked it*), Northbridge Piazza free-screen note, FAQPage JSON-LD + visible Q&A, breadcrumb schema, sitemap + footer link.
- **Verification** — tsc clean, lint clean (one pre-existing SunsetSippers warning), **294 unit tests** pass (+18 new for fixtures data sanity, the licensing classifier incl. Sunday edge cases, kickoff formatting, match phases), Playwright screenshots at 1280x800 + 375x812 (mobile chip-wrap fixed).
- **Live countdowns (same day, direct to main)** — new `WorldCupCountdown` client component (1s tick, mount-gated to dodge hydration mismatch, shows "On now" during the ~2h match window then disappears) on the three Socceroos cards ("Kicks off in 9d 16h 42m") and inside the fixture list's NEXT chip ("Next · 1d 16h 42m"). `formatCountdown()` in `worldCup.ts` drops ticking seconds beyond a day; +5 unit tests. GSC indexing requested for `/world-cup` the same day (priority crawl queue confirmed).
- **Homepage World Cup strip + team colours (same day, direct to main)** — `HomeWorldCup` renders the three Socceroos fixture cards (kickoff in Perth time, live countdown, flag-stripe band) between the homepage header and hero; horizontal scroll on mobile, 3-up grid on desktop; self-removes after the final (gated on `perthToday() > '2026-07-19'`). `TeamStripes` paints each card with both teams' flag colours via `TEAM_COLOURS` in `worldCup.ts` (Group D only, neutral fallback for knockout opponents); same stripes applied to the /world-cup Socceroos cards.

### Fix Ahrefs size regressions: slim list payloads + resize venue photos (2026-06-09)
- **Diagnosis from the 2026-06-08 Ahrefs crawl:** the photo-recovery work (#173) introduced every new Error this week. Verified live with `curl`: the homepage shipped **2.22MB** of HTML — all 857 pubs' full objects serialised into the RSC payload — tripping Googlebot's 2MB crawl limit; pub photos were hotlinked at up to **4800px (~208KB each)**, flagging "Image file size too large" on 15 pages. The real bulk wasn't the photos (~240KB) but the **full Pub enrichment the lists never render**: `periods` (441KB), editorial summaries (352KB), 15 Google attributes (282KB), opening-hours text (217KB).
- **Fix — `src/lib/pubPhoto.ts` (new):** `resizeGooglePhoto()` swaps the lh3 size token (`=s4800-w1024` → `=w640`, ~208KB → **~90KB** measured, under the 100KB threshold) while keeping the photo **hotlinked to Google** — their terms forbid re-hosting, so `next/image` is deliberately out (honours the existing "plain img on purpose" note at the render sites). `slimPubForList()` drops the list-irrelevant Places enrichment before serialising; every dropped field is **optional on `Pub`**, so `SlimPub` stays assignable to `Pub` — zero component/prop-type changes.
- **Applied:** homepage + suburb list payloads slimmed (suburb `getSuburbStory` + JSON-LD keep the full data, slimming only the client payload); photos resized at both render sites (pub detail + happy-hour listicle). `/happy-hour` HTML stays ~835KB on purpose — it genuinely renders photos + write-ups + hours — but its image **transfer** drops ~57%.
- **Result:** homepage **2.22MB → ~0.77MB** (est.), well under the 2MB limit; each venue photo **208KB → 90KB**. Clears Ahrefs "Page size exceeds 2MB" + "Image file size too large" + "HTML file size too large". The other ~38 audit issues (meta/title hygiene, orphans, the intentional 622 `noindex` tier pages) were left out of scope.
- **Verification:** `tsc` clean, **278 unit tests** (+4 new in `pubPhoto.test.ts`), lint clean. (OneDrive-path space still breaks npm lifecycle scripts → ran `tsc`/`tsx`/`next` directly via `node`.) Full `next build` + e2e run in CI. Commit `5e61cfe`.

### Structured-data audit + Organization entity (2026-06-08)
- **Full schema/breadcrumb audit** of all 34 JSON-LD surfaces. Verdict: already in good shape — every breadcrumb is a proper `BreadcrumbList` with **absolute `item` URLs** and a sensible hierarchy (guides/insights crumb under "Discover", not the URL path); the pub page emits a correctly interlinked `@graph` (`WebPage` + `BarOrPub` + `BreadcrumbList`) with Offers/opening-hours/amenities/geo; article schema carries author + publisher + dates. Confirmed live: homepage + pub-page `@graph` parse and the pub breadcrumb renders `Home → Suburb → Pub` with absolute URLs.
- **Did NOT "fix" the `ItemList` `url` props** — checked Google's carousel spec: summary-page `ListItem`s correctly use `url` (only `BreadcrumbList` uses `item`). The existing code was right; leaving it avoided a churning regression.
- **Real gap closed — `Organization` brand entity:** the homepage had a bare `WebSite` node and no `Organization` (no logo, no `sameAs`), so nothing tied the domain to the brand for Google's knowledge graph. New `src/lib/siteJsonLd.ts` (`buildOrganizationJsonLd` / `buildWebSiteJsonLd`, both `@context`-less for `@graph` embedding, with `siteJsonLd.test.ts`). Homepage now emits one `@graph`: **Organization** (`@id #organization`, square `/logo.png` 1024² as `ImageObject`, `sameAs` → the footer's facebook/instagram `arvopints` profiles) + **WebSite** (`@id #website`, `publisher` → Organization, `inLanguage en-AU`) + the existing **FAQPage** (`@id #faq`). `articleJsonLd` publisher logo switched from the landscape OG image to the square `/logo.png` and given the matching `#organization @id`.
- **Validated against Google's official docs:** carousel `ItemList` summary pages require **`url`** on each `ListItem` (only `BreadcrumbList` uses `item`) — confirmed, so the existing `ItemList`s were left alone; `BreadcrumbList` needs `position` + `name` + absolute `item` (last item's `item` optional) — all pages conform; Organization logo accepts an `ImageObject`/square image ≥112px — our 1024² `/logo.png` qualifies.
- **Verification:** `tsc` clean, **274 tests** (+2 site-schema cases), live homepage `@graph` validated (`Organization`/`WebSite`/`FAQPage` all parse, logo + sameAs + publisher link present), live pub breadcrumb validated.

### GSC indexing fixes: section-redirect bug + retired-URL hygiene (2026-06-08)
- **Diagnosis from the live GSC Page-indexing report:** 421 "not indexed" vs 1.15k indexed (indexed trend still climbing). The headline is mostly benign — **273 of the 421 are `Page with redirect`** (the intended legacy `/pub/`, `/suburb/`, http→https, etc. — working as designed). The genuinely actionable buckets: **67 `Discovered` + 66 `Crawled – currently not indexed`**, which drill-down confirms are almost entirely individual `/[suburb]/[pub]` pages — the long tail of price-less / near-template venues Google judges too thin. That's a **data** problem (663 pubs still missing a regular price), already handled architecturally (Tier-C pages are `noindex` + sitemap-excluded), so no code change ships for it — it needs prices, not markup. Deferred + flagged to the user.
- **Real bug found & fixed — `/guides` + `/insights` "Redirect error":** both were page-component `permanentRedirect('/discover')`. On Vercel's CDN that serialised to a **`308` with NO `Location` header** + a 9 KB HTML body (confirmed with `curl` against prod) — a redirect to nowhere, which is exactly what Googlebot reports as a redirect error. Moved both to **`vercel.json` edge redirects** (`statusCode 301`, exact-source so `/guides/*` + `/insights/*` children are untouched), matching the existing `/suburb/:slug` + www pattern, and deleted the two redirect-only `page.tsx` files (the `layout.tsx` files stay for the child pages). Edge redirects emit a clean `301` + `Location` — proven by the analogous `/suburb/north-perth` → `/north-perth` already doing so on prod.
- **Retired-URL hygiene:** legacy `/pub/{slug}` misses (removed/re-slugged venues: badlands-bar, jack-rabbit-slims, w-churchill, wolf-lane, ruin-bar, the-flying-scotsman) now return **`410 Gone` instead of `404`** — the precise status for a permanently-retired URL scheme. (Per Google's HTTP-status docs, 404 and 410 are treated **identically** for indexing, so this is a correctness choice, not a crawl-speed win — the earlier "drops faster" rationale was wrong.) The `301` redirect still fires when the slug resolves. The current-structure 404s (`/northbridge/ruin-bar`, `/mount-lawley/five-bar`, `/perth-cbd/halford-bar`) are genuinely-removed pubs — `404` is correct, they'll drop naturally. The 4 `Duplicate canonical` (incl. `/suburb/north-perth`, which 301s cleanly) and the `/guides`+`/insights` redirect-error validations are stale classifications that clear on recrawl.
- **`redirect-seo.test.mjs` extended** to assert the new `/guides` + `/insights` edge redirects and the `/pub/{slug}` 410 (tested contract, not just config).
- **Verification:** `tsc` clean, **272 tests** + redirect-SEO test pass, `vercel.json` valid; the `308 → /discover` (with `Location`) + child-page-200 + `410` behaviour confirmed live on a local dev server before moving to the edge-redirect form. (npm lifecycle scripts still break on the OneDrive-path space → ran `tsc`/`tsx`/`next` directly via `node`.)

### Recover hidden pub photos + manual-photo fallback (2026-06-08)
- **Re-curated all 191 previously-hidden pubs.** The earlier long-tail pass *hid* ~191 pubs because the auto-pick landed on food/crowds — but most had a real venue shot deeper in the (stable-order) photos array. Re-pulled up to 10 candidates each, then ran a 4-stage QC: 15 picker agents → 12 adversarial verifier agents (flagged 54) → 6 re-pick agents → **every one of the 159 final photos eyeballed by me** via `@napi-rs/canvas` montage sheets, hand-picking the ~20 hard ones from their full folders. Net: **159 pubs recovered a genuine venue shot** (exterior/bar/interior/beer-garden/clubhouse); **32 stay blank** (beer brands with only cans, golf courses with only fairways, venues with only food/people). Overrides still 248; applied index-based and **verified what's actually stored** matches every pick (no silent-fail).
- **Lesson reinforced:** the vision agents *hallucinate at the index level* — they confidently mis-described specific files (a rainbow-over-fairway called a "clubhouse interior", a chicken box called a "storefront"). So agent picks are a first pass only; the human montage review is mandatory. New throwaway QC tooling: `scripts/recurated-picks.json` (decision record), `apply-recurated-picks.mjs`, `build-verify-montage.mjs` / `build-folder-montage.mjs` / `build-stored-montage.mjs`.
- **Manual-photo fallback** (`image_url`): pub detail page, happy-hour listicle, and `BarOrPub` JSON-LD now fall back to a manually-supplied `image_url` (credited "courtesy of {pub}") when Google has no photo — so the ~85 pubs Google has *zero* photos for (e.g. The Deen) can get a venue-supplied shot dropped straight in. `image_url` was empty across all pubs, so zero risk of surfacing stale data. (Lifting photos from venue sites / Eventfinda / socials stays off the table — attribution ≠ licence.)

### Photo curation fix: index-based overrides + strict listicle sweep (2026-06-06)
- **Critical fix — curated photos never applied:** Google's Place Photo refs *rotate every request* (verified: two back-to-back fetches return different ref tokens), so the ref-based `pickBestPhoto` override always missed and silently fell back to the heuristic. The 51 curated listicle re-picks (incl. The Bird) never landed — prod was still serving the original food/people shots (The Bird = a head-in-the-foreground courtyard). The photos *array order* is stable, so overrides now pin by **index** (`scripts/photo-overrides.json` stores integer indices, not refs). Re-applied + verified what's actually stored now: The Bird = the back bar, NBC = the brick exterior, Palace Arcade = the arcade-bar interior.
- **Strict re-sweep of the listicle:** agents re-reviewed all 132 happy-hour photos at a tougher bar (any prominent person/head/food/drink in the foreground = reject). Re-picked the 10 non-curated stragglers the lenient first pass missed — 7 real venue shots + 3 hidden (Quarie / Sporting Globe Belmont / Oceans 6019 had only food/crowds). Overrides now **248** (index picks + `NONE` hides).
- **Lesson:** the pick agents mis-call food-with-branding as a venue shot ~20–30% of the time, so **every pick is now human-verified before apply** (this caught 3/9 on the last batch). Added `scripts/repick-photos.mjs` (`--slugs` per-pub re-pick) + `scripts/verify-applied.mjs` (download what's actually stored) for ongoing fixes; `backfill-place-attributes.mjs` gained `--slugs` for targeted single-pub applies.

### #164: happy-hour area listicle + attributed venue photos + opening hours (2026-06-06)
- **PR #164 (`054340e`):** `/happy-hour` rebuilt as an editorial **area-grouped listicle** (CBD/Northbridge, North, Coast, Freo/South, Hills — cheapest first), with a live **"on right now"** section (countdowns), best-of picks, per-venue write-ups, and a collapsible opening-hours + address line. Every **pub page** gains an attributed Google Places hero photo, structured opening hours, and a visible street address; `BarOrPub` JSON-LD now carries the photo as an `ImageObject` (creditText + author) for richer local results. New `src/lib/perthRegions.ts` (suburb→region map).
- **Google Places photo pipeline** (`scripts/backfill-place-attributes.mjs` + migration `20260605000000_pub_google_photos.sql`): one attributed photo per pub at **$0** (rides the existing Details call), stored in separate columns (`google_photo_url/_attribution/_attribution_uri`) so curation never clobbers `image_url`. **Smart-picks** the best candidate (business + landscape over food/portrait). Photos are **hotlinked + monthly-refreshed (not re-hosted)** and always shown with the contributor + Google Maps attribution, per Places API policy. ~772 pubs backfilled.
- **Photo quality — vision curation:** Google's pub photos run ~30–38% food/drink close-ups, which no metadata heuristic can catch. Agents *viewed* every photo: the 51 weak listicle ones were re-picked from candidates (49 real venue shots + 2 hidden), and **186 weak long-tail ones hidden** (`hide-bad-photos.mjs`) — all recorded as `slug→ref`/`"NONE"` in `scripts/photo-overrides.json` (237 entries) so the monthly refresh keeps the hand-vetted choices. Net: every photo on prod is a real venue shot or none — no burgers/selfies/menus.
- **Verification:** `tsc` clean, Playwright CI green, **prod live** (perthpintprices.com/happy-hour rendering photos), SSR + DOM confirmed on listicle + pub pages.
- **Flagged follow-up:** Supabase egress is over the 5 GB free tier — the app's `getPubs` pulls the full ~2.4 MB pubs table uncached on every render. Structural fix: trim `select('*')` / lean on `getPubsLite` / cache the list.

### SEO #4: money-page keyword pass + `/happy-hour` rebuild (2026-06-05)
- **Keyword research (Ahrefs, AU)** → `docs/seo/keywords.md`. The on-brand terms are wide open: **happy hour perth (250/mo, KD 0)**, best pubs perth (400, KD 0), beer garden perth (100, KD 0), dog friendly pubs perth (150, KD 0); `cheap pints perth` triggers an **AI Overview** (citation prize). Flagged `rooftop bars perth` (1,500, KD 30) + `bars perth` (800) as high-volume but off the pint-price USP. Filled the Ahrefs project id (9843078) + keyword-store blanks in `.claude/seo-content.config.md`.
- **`/happy-hour` optimised for "happy hour perth"** (the #1 opportunity). The SERP rewards a comprehensive list (Perth is OK / sitchu listicles rank), but our page filtered the visible list to `isHappyHourNow` — so outside ~4–6pm it showed "No happy hours right now" + an empty list, unrankable for the query. Now it lists **every timed happy hour, cheapest first, with active ones flagged live**: keyword H1 ("Happy hours in Perth"), an answer-first intro, a sharper title ("Happy Hour Perth — Every Deal, Live & Priced"), and a FAQ + `FAQPage` schema (what time / where cheapest / which pubs). Keeps the live board + countdowns — the freshness the static listicles can't match.
- **Verification:** `tsc` clean, 272 tests, rendered HTML confirmed (full list, keyword H1, FAQPage, no empty state).
- **Next:** the KD-0 guide gaps — `/guides/dog-friendly-pubs`, `/guides/beer-gardens` (the `allows_dogs` / `outdoor_seating` data already exists).

### Pub page SEO: price schema + answer-first + happy-hour titles (2026-06-05)
- **`feat/pub-page-seo`:** an SEO audit (via the `seo-content` skill) of the post-receipt pub template found the pages under-optimised for a wide-open SERP — searching "how much is a pint at [pub]" returns TripAdvisor / booking sites, none of which answer the price. Three fixes, hitting every priced/HH pub at once:
  - **Exact price in structured data** (`pubJsonLd.ts`): added `makesOffer` → `Offer`/`MenuItem` with the real pint price (+ happy-hour price) in AUD — previously the price was only a coarse `priceRange: "$$"`. Now machine-readable for rich results + AI answers.
  - **Answer-first line + FAQPage** (`PubDetailClient.tsx`): a plain, un-boxed one-line answer under the H1 — "A pint at {pub} is ${price}, last checked {date}." — restoring the extractable answer the removed Quick-read box used to carry; plus `FAQPage` JSON-LD emitted from the price/HH/nearby Q&A (visible-FAQ gate lowered 3→2 so it renders + matches the schema). FAQ now uses the real **suburb** average (was the city average, mislabelled).
  - **Happy-hour titles** (`page.tsx` + `voiceCopy.ts`): HH-only pubs (no standard price) now title "$6.00 happy-hour pints" / meta "pours a $6 pint during happy hour…" instead of the flaky "Price TBC" (old title keyed off the time-dependent effective price, so it flipped in/out of HH).
- **Already good, left alone:** SSR/crawlable render, tiered indexability (dataless pubs `noindex`), self-canonicals, breadcrumb + LocalBusiness schema, internal linking; `aggregateRating` correctly omitted (can't claim Google's stars as first-party).
- **Deferred (#4, next):** thin per-page content depth — the bigger lever is the suburb/discover/insight "money" pages feeding link equity down; an Ahrefs keyword pass goes there. Added `.claude/seo-content.config.md`.
- **Verification:** `tsc` clean, 272 tests, signals confirmed in rendered HTML (Offers, answer line, FAQPage, HH titles) on priced + HH-only pubs.

### Pub page receipt card — site-wide template (2026-06-05)
- **`feat/pub-receipt-card`:** the pint price card on `/[suburb]/[pub]` is now the "receipt" for every pub — an amber-headed docket (`★ Perth Pint Prices ★` banner + venue name in DM Serif), the hero price, an itemised dotted-leader sheet (Standard pint · Happy hour · Cheaper nearby · Checked · Google rating), amenity stamps, and an in-card report CTA. New self-contained `src/components/PintReceipt.tsx`; the throwaway `_receipt-prototype/` route (A thermal docket / B raffle ticket / C banner card, toggled via a dev-gated `?variant` switcher) was deleted after C won.
- **Unpriced pubs (most of the 857) handled:** TBC renders cleanly — no false "vs-avg" line, the CTA reads "Know the price?" not "a better price", and the Tier-C "nearest checked price" stub was lifted out of the old card into its own bordered block (verified on The Flaming Galah, Freo → "12 nearby pubs have a checked price — start with Whisper Wine Bar at $9.00").
- **Page de-dup (the receipt owns this data now):** removed the dark "Quick read" answer-first box (its numbers live in the receipt + the FAQPage schema), the duplicate full-width report button, and the repeated rating/amenity chips below the card (`GoodToKnow` gained a `summaryOnly` prop → editorial blurb only). About + that blurb now share one bordered card instead of floating. Dropped the redundant "Family-friendly in {suburb}" subtitle (the vibe pill already says it).
- **Verification:** `tsc` clean, **272 tests**, priced + unpriced pubs confirmed in-browser via DOM reads (Chrome screenshot capture wedges on the dev sticky Leaflet map).

### The Deen suburb correction (2026-06-05)
- **Data fix (`scripts/fix-deen-suburb.mjs`):** The Deen (pub #7) was tagged `suburb = "North Perth"` but sits at 82 Aberdeen St, **Northbridge** — corrected to Northbridge. Surfaced by the content-review address/suburb audit (the venue is its own Pint-of-the-Day pick, so the wrong tag was visible, and it skewed the Northbridge cluster stats). The pub route looks pubs up by slug and 301-redirects on a suburb mismatch, so **`/north-perth/the-deen` now 308-redirects to `/northbridge/the-deen`** (verified) — no code redirect needed. Script is idempotent + guarded (only touches the row while it is still "North Perth" with a Northbridge address). The wider ~127 address/suburb mismatches stay deferred — most are false positives (CBD naming, border streets).

### Pint-price stat consolidation + content cleanup (2026-06-05)
- **PR #157:** one source of truth for every headline number, driven by a full site content review. New `src/lib/suburbStats.ts` (`getSuburbStats`/`getSuburbExtremes`/`getPricedSuburbCount`, on verified `regularPrice`) and a cached `/api/pint-index` route; HomeClient, VenueIntel, SuburbLeague, `getSiteStats`, the Pint Index widget + header chip all route through `getPintPriceStats` + `getSuburbStats`. Result: **avg $9.10 · median $9.00 · cheapest Hillarys · priciest Kalamunda** on every surface (was $9.04/$9.09/$9.10 and three different "cheapest suburb" answers). Snapshots now feed only the trend line + % change; the weekly-snapshot cron recomputes canonically and `/api/weekly-snapshot` is an alias.
- **Content fixes:** Dad Bar **11 → ~67 venues** via a shared `isDadBar()` (curated `kidFriendly` + Google `goodForChildren` with a beer garden/sports, Perth CBD excluded; curated playground venues pinned on top; Discover hub card now matches). Suburb Rankings capped to **18** (one per AFL club) with verified-priced counts (kills the "Perth (84) $8/$8/$8" anomaly). Cosy Corners renders its list instead of a blank page (`RainyDay` weather is now an enhancement, not a gate). Venue Breakdown "% cheaper than median" computed over priced venues (was the wrong 8%, dividing by all 857). Happy-hours article board limited to genuine confirmed pint drops (excludes the small-pour/unconfirmed entries the prose disclaims); `formatHappyHourDays` now collapses full/short day names to "Mon–Fri". "Article brief" block removed; latent Rules-of-Hooks crash in the Pint Index sparkline fixed.
- **Tailwind:** off-design-system utilities → design tokens site-wide (CrowdReporter, MobileNav, PintIndex, FilterSection, SubmitPubForm, crowd-level colours) — zero off-system utilities remain outside vendored shadcn.
- **Held for a separate data pass:** ~127 address/suburb mismatches surfaced (e.g. **The Deen** tagged `North Perth` but addressed in Northbridge) — kept out of this PR because correcting a suburb changes the pub's public URL (needs a redirect), and most flagged rows are false positives (CBD naming, border streets).
- **Verification:** `tsc` clean, **272 tests** (incl. new `suburbStats` cases), production `next build` clean, cross-page numbers confirmed live in-browser. (npm lifecycle scripts still break on the OneDrive path → ran build/tests/tsc directly via `node`.)

### Pub page Variant B "receipt" redesign (2026-06-04)
- **PR #154 / merge commit `d666038`:** folded the chosen prototype direction into `/[suburb]/[pub]` — the pint price card is now a betting-slip "ticket" (dark `PINT PRICE` header bar, centred hero price, vs-avg / freshness / HH-now badges, dashed-divider happy-hour receipt row). Built on the new `.type-*` system; the page also adopts `type-hero`/`type-eyebrow`/`type-card-header`/`type-card`/`type-price`.
- **All real machinery preserved:** watchlist/share, the answer-first Quick read card, live HH-now countdown, price provenance line, the Tier-C "no verified price" verification stub (now `TBC` + stub inside the receipt), price history, the permanently-closed banner, the Leaflet map, nearby-pubs with analytics, and the report-price flow. Chosen via a throwaway `/prototype` route (3 toggleable directions, since deleted).
- **Verification:** live via Chrome MCP (rich pub, no console errors) + Playwright (mobile reflow + Tier-C state); `tsc` clean, 267 tests, lint clean. CI caught the e2e PR-proof asserting the old "Pint Price" label → updated to the new "Pint price" copy.

### Semantic typography system + site-wide codemod (2026-06-04)
- **PR #153 / merge commit `bef5b08`:** added a `.type-*` component layer in `globals.css` (one definition per role: `type-hero`, `type-hero-editorial`, `type-section`, `type-card`, `type-card-header`, `type-eyebrow`, `type-price`) and migrated ~30 components/pages onto it — fixing the typography-audit root causes.
- **Root-cause fixes:** the base `h2,h3 → DM Serif + bold` rule (faux-bold + accidental serif; DM Serif Display ships weight 400 only) replaced with `h1–h4 → mono`, deliberate serif now opt-in via `font-display`; editorial heroes unified to one size (was 4.55/4.7/4.8/5rem drift); removed the misleading `font-heading` alias; fixed undefined `text-coral`/`bg-coral` → `red` and SVG `monospace` → the brand mono var.
- **Peer-reviewed by 3 parallel agents** (regressions / spec-adherence / coverage). Findings folded in — notably the `type-card-header` role (uppercase panel headers were being shrunk into `type-eyebrow`) and two card titles that had shrunk. Verified `tsc`, 267 tests, lint, and desktop/mobile QA across 6 routes.

### Closed-venue noindex + place_id data-quality pass (2026-06-04)
- **PR #152 / merge commit `e2b2594`:** `business_status = CLOSED_PERMANENTLY` (from the Places sweep) now forces a venue to `isIndexable: false` (robots noindex + sitemap exclusion) while keeping its data-driven tier for rendering, plus a "permanently closed" banner. Auto-handles future closures on each monthly sweep.
- **Address audit + fixes (data-only):** ran a cheap (Pro-tier) Places address audit across 815 pubs; auto-corrected **23 genuine address errors** (Running With Thieves + 22 others) to the matched place_id's Google address, skipping unit/formatting noise; held 3 ambiguous ones for manual review (they turned out to be correct place_ids on re-check).
- **Phantom-venue cleanup (data-only):** the 4 dead-place_id pubs (Bar 2wo, Martinis Oysters & Jazz, Long Point Brewing, Parsons Bar & Grill) — all price-less, never-verified, no current Google match — were delisted (`CLOSED_PERMANENTLY`, place_id nulled). Re-match search confirmed the 3 "held" place_ids (Steve's, Lyric's Bar, Samuels on Mill) were already correct.

### Monthly Places refresh automation (2026-06-04)
- **`.github/workflows/places-refresh.yml` (in PR #151):** a GitHub Actions cron (`0 17 1 * *`) re-runs `scripts/backfill-place-attributes.mjs` monthly to keep amenities/hours/ratings and the visible "checked" date current — **$0** under the 1,000-call/month Enterprise+Atmosphere free quota (~815 pubs/sweep). `workflow_dispatch` supports a `limit` input for cheap smoke tests; secrets `GOOGLE_PLACES_API_KEY` / `SUPABASE_SERVICE_ROLE_KEY` / `NEXT_PUBLIC_SUPABASE_URL` set on the repo. Smoke-tested green.

### Google Places attribute backfill + Good-to-know pub module (2026-06-04)
- **Related to issue #78 / branch `feat/places-attribute-backfill`:** built the Google Places (New) attribute spine over the place_ids already stored on `pubs`. A single Place Details call per pub is already billed at the Enterprise+Atmosphere SKU because of the amenity booleans, so the sweep pulls everything useful in that one call at zero marginal cost — and ~857 pubs fit inside the 1,000-call/month free quota, so one sweep is $0.
- **Migration `20260604000000_google_places_attributes.sql`:** added typed columns to `pubs` — amenity booleans (`serves_beer`, `serves_food`, `outdoor_seating`, `good_for_children`, `good_for_groups`, `good_for_watching_sports`, `allows_dogs`, `live_music`, `restroom`, `reservable`), plus `google_rating`, `google_rating_count`, `google_price_level`, `business_status`, `google_editorial_summary`, `google_opening_hours` (jsonb), and a `google_attrs_updated_at` provenance stamp. Stored **separate** from the hand-curated `kid_friendly`/`cozy_pub`/`has_tab`/`sunset_spot` columns so curation always wins; the sweep only fills a blank `website` as a freebie.
- **Backfill script `scripts/backfill-place-attributes.mjs`:** mirrors `backfill-phones.mjs` — one FieldMask, `--dry-run` + `--limit` flags, 80ms throttle, prints a per-attribute coverage table, and guards the `business_status` CHECK constraint against unexpected enum values.
- **Render — `GoodToKnow` component:** a compact, sourced "Good to know" chip row on the pub page (Beer garden · Dog-friendly · Shows the footy · Kids welcome · Kitchen · Live music · Good for a group · Takes bookings), plus the Google rating and editorial summary, attributed inline with the checked date. Truthful-absence: renders nothing when Google has no signal, so it is safe to deploy ahead of the sweep.
- **Schema:** extended `buildPubJsonLd` with `amenityFeature` (only Google-affirmed true attributes) and a real `openingHoursSpecification` array built from Google's trading-hours periods. Google's star rating is shown visibly but deliberately kept **out of `aggregateRating`** to respect the locked no-self-serving-rating guardrail.
- **Shipped to production:** migration applied via the Supabase SQL editor (all 17 columns + 2 constraints live); full sweep wrote **811 of 815 pubs** (4 skipped on stale 404 place_ids), filling 79 blank websites as a bonus. Catalogue-wide coverage: google_rating 96%, opening hours 89%, serves_beer 85%, good_for_groups 79%, reservable 68%, outdoor_seating 56%, live_music 39%, good_for_children 32%, serves_food 30%, editorial_summary 30%, good_for_watching_sports 28%, allows_dogs 21%.
- **Verification:** `npx tsc --noEmit` clean, `npm test` (**266/266 tests**, including 3 new `pubJsonLd` cases for amenity emission/omission + regular-hours mapping), `npm run lint` clean on all changed files, and desktop + mobile Playwright screenshots of a populated pub page (`/burswood/the-camfield`) confirming the sourced chip row, Google rating, editorial summary, and dated attribution render on-brand. `npm run build` not run locally (the OneDrive path breaks npm lifecycle scripts here); Vercel will clean-build on merge.

### Answer-first pint-cost page shipped (2026-06-03)
- **Issue #27 / PR #147 / merge commit `c561fd2`:** added `/how-much-is-a-pint-in-perth` for the zero-click "how much is a pint in Perth" cluster. The page answers in the first screen with the live checked average, median, range, cheapest verified pint, glass-size notes, visible Q&A, and internal links into Cheapest Pints, Happy Hours, Pint Index, and the proper-pint explainer.
- **Pint Index answer block:** added a "Perth beer prices" answer-first card to `/insights/pint-index`, backed by the same verified regular-price stats. The mobile Pint Index methodology wrapper was tightened to remove an 8px horizontal overflow found during screenshot QA.
- **Shared stats helper:** added `src/lib/pintPriceStats.ts` with tests so average, median, range, under-$10 count, and verified-row filtering stay consistent across answer pages.
- **SEO wiring:** added canonical metadata, OG/Twitter image, Breadcrumb + ItemList JSON-LD, and sitemap/footer/`/llms.txt` entries.
- **Verification:** verified `npm test` (**263/263 tests**), `npx tsc --noEmit`, `git diff --check`, `npm run lint` (existing warnings only), `npm run build`, `npm run test:e2e` (**4/4 Playwright tests**), reviewer sub-agent LGTM, and clean desktop/mobile screenshots for `/how-much-is-a-pint-in-perth` + `/insights/pint-index` under `/tmp/perth-pint-prices-answer-first-27/`. The repeated local build flake (`/_document` not found) only occurred while a dev/e2e server was touching `.next`; the solo build passed.

### Student-pints landing page ready for preview (2026-06-03)
- **Issue #32 third slice / branch `codex/student-pints-landing-page-32` / commit `8ec3168`:** added `/student-pints-perth`, a verified under-$10 regular-pint page for UWA, Curtin, and Murdoch.
- **Campus ranking:** added shared student-pint ranking helpers and tests. Campus sections use verified regular prices only, direct-distance radii, and campus-specific notes; Murdoch deliberately uses a wider 8km radius because the current checked data has no useful sub-$10 cluster inside 4-6km.
- **SEO wiring:** added canonical metadata, OG/Twitter image, Breadcrumb + ItemList JSON-LD, useful internal links, and sitemap/footer/`/llms.txt` entries.
- **Verification:** verified `npm test` (**260/260 tests**), `npx tsc --noEmit`, `git diff --check`, `npm run lint` (existing warnings only), `npm run build`, `npm run test:e2e` (**4/4 Playwright tests**), reviewer sub-agent LGTM, and desktop/mobile screenshots under `/tmp/perth-pint-prices-student-pints-32/`.

### Transport-hub landing pages ready for preview (2026-06-03)
- **Issue #32 second slice / branch `codex/transport-hub-landing-pages-32` / commit `f6c8adf`:** added four direct-proximity pub landing pages: `/pubs-near-perth-station`, `/pubs-near-optus-stadium`, `/pubs-near-rac-arena`, and `/pubs-near-elizabeth-quay`.
- **Reusable hub system:** added shared transport-hub config, direct-distance ranking, ItemList JSON-LD, canonical metadata with OG/Twitter images, answer-first copy, stats, ranked nearby rows, and cross-links between transport guides. Sitemap, footer, and `/llms.txt` now expose the hub pages.
- **Data guardrails:** unverified regular prices render as `TBC` and do not affect equal-distance price tie-breaks. Page copy uses direct-proximity/direct-distance wording rather than claiming real walking-route distances.
- **Verification:** verified `npm test` (**257/257 tests**), `npx tsc --noEmit`, `git diff --check`, `npm run lint` (existing warnings only), `npm run build`, `npm run test:e2e` (**4/4 Playwright tests**), reviewer sub-agent LGTM, and desktop/mobile screenshots for Perth Station + Optus Stadium under `/tmp/perth-pint-prices-transport-hubs-32/`.

### High-intent landing pages ready for preview (2026-06-03)
- **Issue #32 first slice / branch `codex/high-intent-landing-pages-32` / commit `68754c5`:** added `/cheapest-pints` as a verified regular-price landing page and `/happy-hour/[day]` static pages for all seven weekdays, with canonical metadata, OG/Twitter tags, Breadcrumb + ItemList JSON-LD, answer-first copy, ranked rows, Q&A blocks, and useful internal links.
- **Happy-hour day linking:** added a planning-board rail to `/happy-hour`, linked Cheap Pints from the footer, added the new pages to `sitemap.xml`, and exposed `/cheapest-pints` in `/llms.txt`.
- **Data guardrails:** added a shared happy-hour day parser with tests for weekday ranges, wrapped ranges, en-dash ranges, daily labels, weekday/weekend labels, and Postgres array-ish strings. Day pages sort by `happyHourPrice`, show `TBC` when a deal has no confirmed price, and avoid mixing regular pint prices into happy-hour claims.
- **Verification:** verified `npm test` (**254/254 tests**), `npx tsc --noEmit`, `git diff --check`, `npm run lint` (existing warnings only), `npm run build`, `npm run test:e2e` (**4/4 Playwright tests**), reviewer sub-agent LGTM, and desktop/mobile in-app browser screenshots under `/tmp/perth-pint-prices-high-intent-32/`.

### Editorial/page-depth measurement ready (2026-06-03)
- **Issue #140 / branch `codex/measure-editorial-impact-140` / commit `c587238`:** added one Vercel+GA4 event helper and tracked link wrapper, then wired article hub/rail/detail clicks, article-to-pub clicks, report-price CTAs, pub-page nearby/internal clicks, and website/directions clicks so the page-depth/editorial push can be measured instead of guessed.
- **Snapshot process:** expanded `docs/seo-snapshots/TEMPLATE.md` with editorial URL baselines, article engagement metrics, pub-page engagement events, and thin-content watch notes for the first weekly baseline.
- **Verification:** verified `npx tsc --noEmit`, `git diff --check`, `npm run lint` (existing warnings only), `npm test` (**249/249 tests**), `npm run test:e2e` (**4/4 Playwright tests**), `npm run build`, reviewer sub-agent LGTM, and desktop/mobile screenshots for `/articles`, `/articles/pints-under-10-perth`, and `/perth/18-knots-rooftop-bar` under `/tmp/perth-pint-prices-measure-140/`.

### Pub-page depth work in progress (2026-06-03)
- **Issue #138 / branch `codex/pub-page-depth-138` / commits `6c737d6`, `c690a0f`:** added fact-earned pub-page quick reads, cleaner price-card contrast, best-time/nearby summary copy, gated seeded mini FAQs for pubs with enough real answers, and de-duplicated metadata via the pub voice builders. Reviewer follow-up normalized happy-hour metadata labels, removed duplicate Tier-C stub copy, and updated PR proof for the new nearby heading states. Visual proof covers priced, Tier-C, and FAQ-rich pub states under `/tmp/perth-pint-prices-pub-depth-138/`.
- **Verification:** verified `npx tsc --noEmit`, `git diff --check`, `npm run lint` (existing warnings only), `npm test` (**249/249 tests**), `npm run test:e2e` (**4/4 Playwright tests**), `npm run build`, and desktop/mobile browser screenshots.

### Article rails + page-depth hubs ready for preview (2026-06-03)
- **Branch `codex/hub-article-rails` / commits `ae5b705`, `063f5e8`, `fff9bc5`, `84b9402`:** added the article rail system to Home/Discover, fact-checked the three new pub articles, wired the generated article image set under `public/articles/`, and added reusable image slots for the article hub/rails.
- **Inline article imagery (`85c2d96`):** article detail pages now render the primary article image plus four section-matched supporting figures per article, with captions, alt text, and explicit Next Image dimensions.
- **Page-depth modules:** beefed out `/happy-hour` with a live happy-hour board, `/suburbs` with data-led suburb rails, and dynamic suburb pages with verified-price story cards, local FAQs, and FAQPage JSON-LD.
- **Data-source corrections:** suburb summaries now use verified regular pint prices for `verifiedCount`, cheapest, most expensive, and averages, so metadata, crawler text, nearby chips, and visible suburb copy do not mix live happy-hour prices into regular-price claims. Article dates are formatted in `Australia/Perth` to avoid SSR/client date drift.
- **Verification:** verified `npx tsc --noEmit`, `npm run lint` (existing warnings only), `npm test` (**249/249 tests**), `npm run build`, reviewer sub-agent LGTM, and desktop/mobile browser evidence under `/tmp/perth-pint-prices-depth-final-aggregate/`.

### Page-depth audit + articles system shipped locally (2026-06-03)
- **Branch `codex/articles-system` / commits `a6ef748`, `7443705`:** added the page-depth editorial audit (`docs/page-depth-editorial-plan.md`) and the first pub editorial article system. New routes are `/articles` plus three SSG article pages: `/articles/pints-under-10-perth`, `/articles/perth-happy-hours-by-day`, and `/articles/proper-pint-schooner-middy-perth`.
- **Editorial plumbing:** articles are driven from `src/lib/articles.ts`, wired into footer/mobile/sub-page nav, `sitemap.xml`, and `/llms.txt`. Article detail pages emit canonical metadata and BlogPosting JSON-LD, and can render live pub-data modules for verified sub-$10 pints, happy hours by day, and glass-size explainers.
- **UI polish:** removed the repeated OG-logo image treatment, rebuilt the article hub as a text-led editorial surface, cleaned the featured/latest card hierarchy, and switched detail pages to compact editorial briefs plus useful live-data panels.
- **Verification:** verified `npx tsc --noEmit`, `npm run lint` (existing warnings only), `npm test` (**249/249 tests**), `npm run build`, and desktop/mobile visual evidence for the article hub and detail pages under `/tmp/perth-pint-prices-articles-system/`.

### Official menu extractor hardening + second dry run (2026-06-03)
- **Branch `codex/official-menu-extractor-hardening` / commit `f69c55e`:** tightened official-menu source and row filters after the larger dry run surfaced false positives. The extractor now skips `Non-Alc` shorthand, apple-cider-vinaigrette food rows, and beer-in-food-description rows such as macaroni/panko/deep-fried items; source discovery and seed building now block breakfast/kids menu URLs even when filenames use underscores.
- **Second dry run:** rebuilt seeds from the large discovery artifact with the hardened filters, producing 202 crawl sources. Ran a no-write crawl with linked-source follow-up and OCR disabled for native-tooling stability: 195 fetched, 131 linked fetched, 11 linked failed, 39 candidates, 7 failed sources, 0 inserted.
- **Review pack:** generated `scripts/official-menu-review-next.json` and `.csv` locally with suggested decisions: 9 `approve_suggested`, 30 `needs_manual_review`. No production import was run; rows still need manual review before any pending reports are inserted.
- **Verification:** verified focused official-menu tests, `npm test` (**248/248 tests**), `npx tsc --noEmit`, `npm run lint` (existing warnings only), `npm run build` (existing warnings only), `git diff --check`, and seed/crawl/review smoke checks.

### Official menu crawler scaled to review + pending reports (2026-06-02)
- **Local uncommitted work:** expanded the official-menu workflow from MVP into a dry-run-first discovery, seed, crawl, review, suggested-decision, and guarded import pipeline. The approval pack lives at `docs/official-menu-crawler-approval.html`; generated crawl/review/import artifacts are gitignored.
- **Crawler improvements:** added rendered HTML fallback, PDF text/table extraction, image OCR, scanned-PDF OCR fallback, JSON-LD `MenuItem` extraction, adjacent price-line handling, source/provider discovery, and stricter filtering for ecommerce/product pages, generic image assets, unsupported AVIF OCR, cocktails/wine/spirits, food combos, non-alcoholic beers, stale CMS templates, and other false positives found during live dry runs.
- **Review workflow:** added `scripts/build-official-menu-seeds.mjs`, `scripts/build-official-menu-review.mjs`, and `scripts/import-official-menu-review.mjs`. Review exports include source URL, evidence text, extraction mode, confidence, decision, and notes; suggested decisions separate explicit pint/draught/tap evidence from rows needing manual review.
- **Admin review:** the admin stats payload now returns pending price reports as the review queue instead of only the latest 10 reports, and the Reports tab surfaces official-menu source/evidence fields so the 26 imported rows can be actioned through the normal approval path.
- **Follow-up provenance fix:** linked-source crawl candidates now carry the actual linked menu/PDF/image URL and extraction mode into review exports instead of falling back to the parent page URL.
- **Latest batch:** a 140-source dry run fetched 129 sources, found 26 review candidates, and inserted 0 rows during crawl. After owner approval, the importer inserted 26 **pending** `price_reports` with `submission_source = "official_menu"`. Admin review is complete: 5 clear official-menu rows were approved into canonical pub prices, and 21 ambiguous/duplicate rows were rejected.
- **Verification:** verified `node --check` for the new workflow scripts, a dry-run import plan, `npm test`, `npx tsc --noEmit`, `npm run lint` (existing warnings only), `npm run build` (existing warnings only), and desktop/mobile admin screenshots.
- **Commits:** `d8e976d`, `99b8200`

### Official menu source discovery ready (2026-06-01)
- **PR #130 / merge commit `92f2c8d`:** added a read-only discovery CLI that scans missing-price pubs with websites, ranks likely menu/drinks/PDF links, and writes `scripts/official-menu-source-candidates.json` for review. The generated artifact is gitignored.
- **Source scoring:** added pure link extraction/scoring helpers with tests for relative URL canonicalisation, menu/drinks/PDF ranking, low-intent filtering, and deduping.
- **Verification:** verified `npm test` (**232/232 tests**), `npx tsc --noEmit`, `npm run lint` (existing warnings only), `npm run build`, `npm run discover:official-menu-sources -- --limit 5` (5 fetched, 2 candidates), and `git diff --check`.

### Official menu crawler MVP ready (2026-06-01)
- **PR #129 / merge commit `3ded19a`:** added a manual, dry-run-first official menu crawler for curated source URLs. It fetches reviewed venue/menu pages, extracts conservative pint-price candidates, and can insert pending `price_reports` with `submission_source = "official_menu"` only when run with `--write`.
- **Guardrails:** extraction skips happy-hour/special/deal lines in v1, keeps reviewer evidence text, stores raw extraction metadata, and never updates canonical `pubs.price`. The committed seed file is an example only; real crawl lists stay explicit and reviewed.
- **Verification:** verified `npm test` (**229/229 tests**), `npx tsc --noEmit`, `npm run lint` (existing warnings only), `npm run build`, `git diff --check`, and a dry-run against `scripts/official-menu-seeds.example.json` with zero writes.

### Price intake plumbing implemented (2026-06-01)
- **Branch `codex/price-intake-plumbing-spec` / commit `e2de1c5`:** added structured `price_reports` provenance/evidence columns (`submission_source`, `source_url`, `evidence_text`, `observed_at`, `raw_extraction`, `extractor_version`) with a constrained source vocabulary and legacy backfill for menu scans, Tier-C report heroes, and stale flags.
- **Intake + moderation safety:** public reports now store structured sources, menu-scan submissions no longer rely on note parsing, and admin approval maps provenance/confidence through one helper. Outdated flags are reviewed without touching live prices, happy-hour reports no longer write regular `price_history.price`, aggregator leads are blocked from direct approval, and admin stats count all pending reports.
- **Verification:** verified `npm test` (**225/225 tests**), `npx tsc --noEmit`, `npm run lint` (existing warnings only), `npm run build`, and `git diff --check`. No Playwright screenshots were needed because the UI change was payload-only.

### Price provenance persisted (2026-06-01)
- **Issue #76 / branch `codex/price-provenance-76` / commit `2c96ffc`:** added structured current-price provenance fields (`price_source`, `price_verified_at`, `price_confidence`) on `pubs`, with matching `verified_at` and `confidence` audit fields on `price_history`.
- **Write paths + display:** Andrew mid-call writes, Andrew post-call fallback writes, admin-approved price reports, and approved pub submissions now persist source, verified time, and confidence. Pub pages can render compact copy such as `Checked by Andrew on 31 May 2026`, with low-confidence rows labelled.
- **Verification:** verified `npm test` (**214/214 tests**), `npx tsc --noEmit`, `npm run lint` (existing warnings only), `npm run build`, `npm run test:e2e` (**4/4 Playwright tests**), `git diff --check`, and saved desktop/mobile before/after Playwright evidence plus mockups under `artifacts/playwright/provenance-*`.

### Price recency chip humanised (2026-06-01)
- **Branch `codex/humanize-recency-chip` / commit `b41ceaf`:** changed pub-page recency copy from warning-style labels plus a visible date to one plain chip such as `Checked 103d ago`. The exact date remains available as hover text, but the card now speaks in the dry, normal-person voice.
- **Verification:** verified focused recency/indexability tests (**210/210 tests**), `npx tsc --noEmit`, `npm run lint` (existing warnings only), `npm run build`, and desktop/mobile Playwright proof for `/northbridge/the-court-hotel`.

### Stale-price warning trimmed (2026-06-01)
- **Branch `codex/remove-stale-warning-blob` / commit `d39e819`:** removed the duplicated stale-price warning paragraph from pub price cards. The compact `May be out of date` pill and last-verified date remain, keeping the freshness signal without the bulky text block.
- **Verification:** verified focused recency/indexability tests, `npx tsc --noEmit`, `npm run lint` (existing warnings only), `npm run build`, and desktop/mobile Playwright proof for `/northbridge/the-court-hotel`.

### Playwright PR proof gate ready (2026-06-01)
- **Branch `codex/playwright-pr-proof` / commit `5da3158`:** installed Playwright Test and added desktop/mobile PR proof smoke coverage for the homepage and a pub detail page, with screenshots attached to the HTML report.
- **CI artifacts:** the main CI workflow now installs Chromium, runs `npm run test:e2e` after the production build, and uploads a `playwright-proof` artifact containing the report and test output. Videos are retained for failures, and `npm run test:e2e:video` records intentional proof videos when motion or multi-step UI needs it.
- **Verification:** verified `npm test` (**209/209 tests**), `npx tsc --noEmit`, `npm run lint` (existing warnings only), `npm run build`, `npm run test:e2e` (**4/4 Playwright tests**), a video-mode pub-page proof run, and the PR #124 GitHub artifact upload.

### Price-recency tiers ready (2026-06-01)
- **Issue #77 / branch `codex/price-recency-tiers-77` / commit `a5183ea`:** added one `getPriceRecency` helper for `fresh` (<30 days), `aging` (30-90 days), `stale` (91+ days), and `unknown` price states derived from `last_verified`.
- **Render + prerender:** pub pages now receive the recency tier from the server and stale prices show a visible `May be out of date` badge plus the checked-days count. The same tier feeds `dataScore` and Tier A/B/C selection, so stale verified prices fall to Tier B and only Tier A pub pages are pre-rendered.
- **Verification:** added recency-boundary tests and indexability scoring tests. Verified `npm test` (**209/209 tests**), `npx tsc --noEmit`, `npm run lint` (existing warnings only), `npm run build`, and desktop/mobile screenshots for stale-price pub page `/northbridge/the-court-hotel`.

### Geo-aware Cheaper Nearby module ready (2026-06-01)
- **Issue #73 / branch `codex/cheaper-nearby-73` / commit `cae6329`:** replaced same-suburb-only pub recommendations with a geo-aware nearby helper. Pub pages now rank verified priced pubs inside a 2km radius, fall back to same-suburb links when sparse, and keep TBC pages useful with nearby verified prices.
- **Cross-suburb internal links:** the module now renders correct cross-suburb pub URLs, distance text, suburb labels, and price-delta copy such as `$4.30 cheaper`, with crawler-visible links using the same canonical URL helper.
- **Verification:** added pure ranking tests for cross-suburb cheaper pubs, sparse-radius fallback, and TBC/unknown-price pages. Verified `npm test` (**203/203 tests**), `npx tsc --noEmit`, `npm run lint` (existing warnings only), `npm run build`, and desktop/mobile screenshots for priced and TBC pub pages.

### Community + Reddit discovery loop documented (2026-06-01)
- **Issue #115 / branch `codex/community-reddit-loop` / commit `3f4d135`:** added `docs/community-discovery-loop.md` with the first 10 Reddit/community targets, self-promo norms, and a transparent Pint Index community-post draft.
- **Content + tracking:** added Reddit-sourced #27/#32 backlog questions and a referral plan that tracks `reddit.com`, `old.reddit.com`, `reddit`, and `old-reddit` alongside the existing SEO snapshot template.
- **Guardrails:** explicitly bans inauthentic mention seeding, aged-account boosting, sockpuppets, vote manipulation, unsolicited DMs, link-only replies, and undisclosed promotion.
- **Verification:** docs-only change; verified with `git diff --check`.

### AI/community SEO snapshot tracking documented (2026-06-01)
- **Issue #116 / branch `codex/ai-community-seo-snapshot`:** added `docs/seo-snapshots/TEMPLATE.md` as the #36 weekly SEO snapshot template, with required AI-referral and community-referral callouts for any source sending **>0 sessions**.
- **GA4 + UTM process:** documented the GA4 exploration definitions for AI/search-assistant, community/social, DuckDuckGo, landing-page, and future key-event reporting. Added a lowercase UTM convention for community posts and PR outreach.
- **Verification:** docs-only change; verified with `git diff --check`.

### Pint Index methodology + CSV citation asset shipped (2026-06-01)
- **Issue #117 / branch `codex/pint-index-methodology`:** Pint Index now includes a visible methodology block covering what counts as a pint, which prices are included, how prices are checked, why TBC venues stay out of averages, and how weekly snapshots power the index.
- **Citation export:** added `/insights/pint-index/data.csv` as a public CSV download for the Pint Index snapshot series, with `text/csv`, `Content-Disposition`, stable headers, and escaped row formatting. `/llms.txt` now links both the Pint Index methodology page and the CSV export.
- **Verification:** checked the CSV route locally for `200`, `text/csv`, attachment headers, and live snapshot rows. Verified `npm test` (**200/200 tests**), `npx tsc --noEmit`, `npm run lint` (existing warnings only), `npm run build`, and desktop/mobile screenshots for `/insights/pint-index`.

### Tier-C report-price hero shipped (2026-05-31)
- **Issue #74 / branch `codex/tier-c-report-hero`:** price-less Tier-C pub pages now render the truthful absence stub with last Andrew call timing, verified nearby-price count, and a link to the nearest checked pub instead of leaving the page as a uniform husk.
- **Report-price conversion path:** Tier-C pages flip the pub-page CTA to a primary `Report the price` hero button and tag resulting submissions with `source:tier-c-report-hero` in `price_reports.notes` for M8 measurement.
- **Verification:** checked `/fremantle/federal-hotel` locally as a real Tier-C sample: `noindex` still present, stub renders, nearest checked pub link renders, and desktop/mobile screenshots show the hero CTA and copy fit. Verified `npm test` (**199/199 tests**), `npx tsc --noEmit`, `npm run lint` (existing warnings only), and `npm run build`.

### AI citation signals shipped (2026-05-31)
- **Issue #35 / branch `codex/llms-article-schema`:** added `/llms.txt` as a markdown citation map for the live high-signal pages (Pint Index, live insight pages, happy hours, discover, and key suburb pages). The deleted weekly-report route stays deleted; Pint Index is the Article/schema asset per `docs/seo-action-plan.md`.
- **Structured citation + crawler access:** added Article JSON-LD to `/insights/pint-index` with `author`, `publisher`, `dateModified`, and `mainEntityOfPage.lastReviewed` from real pub freshness data; added explicit GPTBot / PerplexityBot / Google-Extended allow rules while keeping `/admin` and `/api` blocked.
- **Visible freshness:** pub pages now surface `Last verified <date>` in a semantic `<time>` element where `last_verified` exists. Verified `npm test` (**199/199 tests**), `npx tsc --noEmit`, `npm run lint` (existing warnings only), `npm run build`, local `/llms.txt` / robots / Article schema smoke checks, and desktop/mobile screenshots for the pub-page freshness row.

### Pub-page SEO Phase 1 schema shipped (2026-05-31)
- **Issue #29 / commit `e6d861d`:** replaced disconnected pub-page JSON-LD with one connected `@graph`: `WebPage#webpage` points to `BarOrPub#pub` through `mainEntity`, links `BreadcrumbList#breadcrumb`, and exposes `dateModified` from `last_verified` where present.
- **Schema correctness:** removed invalid `"$X.XX per pint"` `priceRange` strings and now emits schema-valid `$` / `$$` / `$$$` bands from regular price vs suburb average, with site average only as fallback. Kept the owner decision intact: no `Menu`, `MenuItem`, `Offer`, telephone, or guessed venue hours.
- **Review + verification:** peer review first blocked merge on site-average banding; fixed with `getSuburbAveragePrice`, tightened partial-coordinate and invalid-time guards, and re-reviewed cleanly ("Ready to merge? Yes"). Verified `npm test` (**195/195 tests**), `npx tsc --noEmit`, `npm run lint` (existing warnings only), `npm run build`, and live-row schema checks for Tier-A and Tier-C pubs.

### Site voice workstream kicked off (2026-05-31)
- **Voice standard + copy specs landed (PR #84, `ab4704a`):** adopted `docs/brand-voice-brief.md` — the dry/deadpan perthisok register (no exclamation marks, AU spelling, freshness as the trust signal, the 7-question Voice Test as the per-surface gate) — and `docs/content-pack-v1.md`, whole-site surface copy written as data-fed string builders. Captured as PRD #83 under new milestone **#8 "Site Voice & Content"**.
- **PRD #83 sliced into 8 tracer-bullet issues (#86–#93):** `seededVariant` (#86), corny-drift cleanup (#87), hub standfirsts (#88), `/[suburb]` lead + `suburbObservation` (#89), homepage + global chrome (#90), 5 guide standfirsts (#91), 5 insight standfirsts (#92), pub-page voice strings `voiceCopy` (#93, blocked by #86). Copy slices gated AFK + screenshots-on-PR against the Voice Test; all tracked on board #6.
- **#86 `seededVariant` shipped:** deterministic anti-sameness phrasing picker (rendezvous/HRW hashing over a cyrb53 string hash) so the ~850 templated pages don't converge — same id always renders the same wording, picks spread across the pool, and appending a variant only ever moves a bounded share onto the new entry (minimal-disruption growth, asserted). Pure `src/lib` module + co-located tests; no UI, so the screenshot gate doesn't apply. Verified `npx tsc --noEmit` and **189/189 tests** (`tsx --test`).

### Corny-drift cleanup shipped (2026-05-31, #87)
- Swept the weather/guide components (`BeerWeather`, `RainyDay`, `SunsetSippers`) for the corny/American drift the voice brief flags. Found ~4× the content-pack §10 table: replaced exclamation-mark boosterism and stacked slang (`Scorcher!`, `grab a mate`/`cold one`, `sesh`, `hunker down`, `get amongst it`, `Hold onto your hat!`, `Quick!`) with dry equivalents; fixed American `cozy`→`cosy` in visible prose (the `cozy-corners` URL slug + the `cozyPub` data field stay); dropped the brief-flagged `That's the Perth way` tag. `PuntNPints` was already clean.
- Words-only — no layout/logic change. Verified `npx tsc --noEmit` clean + lint (pre-existing react-hooks warnings only). Gated through the brief's 7-question Voice Test. (Humanizer skill not installed this session; the brief's anti-AI-tell standard applied by hand.)

### Pub-page SEO Phase 0 shipped (2026-05-31, PR #82)
- **Issues #69/#70/#71 / merge commit `da2ec80`:** shipped the indexability/freshness foundation from `docs/pub-page-content-plan.md` (merged in PR #81). Pub pages now use a tested Tier A/B/C `dataScore` helper: Tier-C price-less husks stay live for users/internal links but emit `noindex,follow`; Tier A/B pages remain indexable.
- **Sitemap honesty:** `sitemap.xml` now includes only Tier A/B pub URLs, uses real `last_verified` / `updated_at` / `last_updated` freshness dates instead of build-time `Date.now()`, and derives suburb/static `lastModified` from all child pub freshness rather than only the indexable subset. Live-data check: 857 routable pubs, 232 indexable pub rows, 397 sitemap URLs.
- **ISR + write-path freshness:** pub pages now revalidate hourly (`3600`) and pub reads are cached with `pub:${slug}` tags; Andrew `record-price` and public `price-report` writes trigger `revalidateTag` + `revalidatePath`.
- **Review + verification:** independent sub-agent review initially caught the suburb freshness bug, the fix was reviewed cleanly ("Happy to merge: yes"). Verified `npm test` (**181/181 tests**), `npx tsc --noEmit`, `npm run lint` (existing warnings only), `npm run build`, and runtime spot checks for Tier-C robots + sitemap exclusion.

### Andrew guardrails shipped (2026-05-31, PR #68)
- **Issue #63 / merge commit `97b3d63`:** revived the unmerged Andrew call-safety work on a fresh `codex/andrew-dnc-cooldown` branch. Adds `phone_call_log`-based do-not-call exclusion, 72h-minimum call cooldown in `/api/pintsweep/kickoff`, queued-call reservations before ElevenLabs batch submit, unique reservation IDs, `call_initiation_failure` logging, post-call fallback persistence from ElevenLabs data collection, and `scripts/mark-dnc.mjs` for manual DNC markers.
- **Review + closeout:** first peer review blocked merge on repeated-call gaps; `e41ecba` addressed those gaps and `f150f6a` fixed the second-review reservation ID collision risk. Final peer review returned no findings and "Ready to merge? Yes." #63 is closed and the roadmap card is Done.
- **Verification before merge:** `npx tsc --noEmit`, `npm test` (**177/177 tests**), `npm run lint` (passes with the existing `SubmitPubForm`/`SunsetSippers` warnings), and `npm run build`.

### HappyHourEngine refactor shipped (2026-05-31)
- **Issue #56 / commit `2279802`:** collapsed the dual happy-hour engines into the structured `happyHourLive` path and deleted the lossy `src/lib/happyHour.ts` parser. `happyHourLive` now owns active/starting-soon status, effective price, minutes remaining, starts-in-minutes, countdown text, and structured labels from raw `happy_hour_days/start/end` fields.
- **Fixed the two deferred HH consumers:** `DiscoverClient` and `TonightsMoves` no longer re-parse `pub.happyHour`; both read structured schedule fields through the unified engine, so weekend-only, single-day, half-hour, and am-to-pm windows behave correctly.
- **Regression coverage + review:** added injected-clock tests for weekend half-hour active windows, am-to-pm starting-soon windows, and the independent-review catch that already-ended same-day deals must not show as "Starting Soon". Verified `tsc`, **170/170 tests**, `next build`, and desktop/mobile screenshots for `/discover` + `/insights/tonights-best-bets` (local-only Vercel Analytics 404 expected off Vercel).

### Backlog organised into milestones + dependency triage (2026-05-31)
- **Milestones:** closed the catch-all "SEO Push — Q2 2026" and split the board into **6 themed milestones** — `SEO: Indexing & Technical` (#2), `SEO: Content & Schema (AEO)` (#3), `SEO: Measurement & Growth` (#4), `Architecture Refactor` (#5), `Data Coverage` (#6), `Andrew (voice agent)` (#7). Every open issue is bucketed; the 10 new issues (#56–#64, #66) were added to project board #6.
- **Ticketed the untracked work:** refactor as #56–#60 (HappyHourEngine, Formatters, PerthNow.date, price_snapshots accessor, useUserLocation); data as #61–#62; Andrew as #63 (revive DNC/cooldown/post-call hardening) + #64 (voice-quality decision). #25 (www→apex) closed as a no-op.
- **Dependency triage (0 open PRs):** merged #18 (setup-node 4→6), #19 (checkout 4→6), #38 (minor/patch group), and #65 (consolidated lucide 1.11 + twilio 6 + @vercel/analytics 2.0.1 — one clean lockfile; tsc + 167 tests + build green). Next 14→16 (#21) deferred — peer-reviewed as a coordinated Next 16 + React 19 + ESLint 9 upgrade, closed + dependabot-ignored, tracked as **#66**. Prod smoke-tested green on deploy `755d156` (routes 200, lucide icons render).
- **Branch hygiene:** pruned all merged branches + 6 dead ones; kept `claude/audit-e2e-improvements-WQb6N` (it is #63's source). Remote branches now: `main` + that one.

### Documentation accuracy sweep (2026-05-31, PR #55)
- Audited every doc, the repo, and the open issues against what's actually live, then corrected or deprecated the drift. **Docs + issue metadata only — no code changes.**
- **CLAUDE.md / README:** lib count 11→13 (added `supabaseGateway`, `urls`); legacy `/pub`+`/suburb` stubs corrected 308→**301**; `/guides`+`/insights` noted as 308-redirects to `/discover`; homepage nav fixed (no "Pint Report" — it's Discover + Happy Hours + a "Submit a Price" CTA); dropped stale "pub crawl / 23 pages / leaderboard / pub golf / weekly report" references.
- **SEO-MASTER.md:** added a dated reconciliation banner; removed deleted features from the sitemap/ISR/keyword tables; repointed `/pub/[slug]`+`/suburb/[slug]` to the live `/[suburb]/[pub]`+`/[suburb]` routes; FID→**INP**; GBP marked deprioritised.
- **architecture-refactor-plan.html:** banner marking it **superseded** (CrawlPlanner/GolfScoring/Phase-6 moot post-deletion; CEO decisions resolved).
- **seo-action-plan.md:** #1 (www→apex) downgraded — proven live that `www` already 308-redirects and 308 ≡ 301, so it's not the "biggest win"; #2 (legacy 301) marked **done**; #4 GA4 event list pruned of the deleted `pint_crawl_start`/`pub_golf_start`.
- **Issues:** #25 corrected + downgraded; #28/#29/#31/#35 refreshed (deleted-feature refs removed, #31 unblocked).
- Live verification today: 857 pubs (API), sitemap 1022 URLs and clean, all 4 deleted-feature routes 404, `/suburb/*`→301, `llms.txt` still 404 (#35 open), pub pages still missing FAQPage/MenuItem schema (#27/#29 open).

### Refactor Phase 2 (Pub mapper): one row→Pub mapper (2026-05-30)
- **PR #52** (`39ef38d`). `getPubs` / `getPubBySlug` / `getNearbyPubs` / `getSimilarPricePubs` each carried a **byte-identical ~52-line block** that computed live happy-hour status + effective price and built the 30-field `Pub` object. Collapsed into a single `toPub(row)` in `src/lib/supabase.ts`; each accessor now delegates. **Net −133 lines**, behaviour unchanged.
- `getPubsLite` (smaller `PubLite` type) and `getPriceHistory` (different shape) left as-is.
- Verified: tsc clean; **167/167 tests**; `next build` green (service key unset) — all **857 pub pages prerender through `toPub`** on real data; live pub-detail page renders correct name/suburb/price. Independently reviewed (LGTM).

### Refactor Phase 1 (PubUrls): one suburb-slug source of truth (2026-05-30)
- **PR #50** (`957c886`). Collapsed 14 copy-pasted suburb-slug functions into one. `toSuburbSlug` moved into the pure `src/lib/urls.ts` seam (it had lived in `supabase.ts` — a backwards dependency for a URL helper); `supabase.ts` re-exports it for back-compat. Every pub/suburb link now builds via `pubUrl` / `suburbUrl` / `absolutePubUrl`. Deleted **13 byte-identical inline `toSuburbSlug` copies** across components + pages.
- **Fixed a live 404:** `SuburbLeague` used a *divergent* `toSlug` that omitted the apostrophe-strip, so it linked the suburb **O'Connor** to `/o-connor` (404) instead of the canonical `/oconnor` (200) — the only one of 150 live suburbs with an apostrophe. Now routed through `suburbUrl`.
- **SEO tripwire:** [`src/lib/urls.test.ts`](../src/lib/urls.test.ts) snapshots all **150 live production suburb slugs** (pulled from Supabase) so any future slug-logic change that would move a Google-indexed URL fails CI first.
- Verified: tsc clean; **167/167 tests** (snapshot stable ⇒ zero URL drift); `next build` green with the service key unset; `sitemap.xml` emits **1022 canonical URLs with zero `/o-connor`**; routes resolve (suburb/pub `200`, legacy `/pub/*` `301`). Independently reviewed (LGTM) before merge.

### DB security lockdown + architecture keystones (2026-05-30)
- **Refactor Phase 0 + SupabaseGateway** (PRs #45–#48): added `src/lib/perthClock.ts` (the time keystone) and `src/lib/supabaseGateway.ts` (`anonClient()` / `serviceClient()`), centralising 16 inline `createClient(...)` blocks and cutting the duplicated anon-JWT literal from ~14 files to 1. Fixed a real security bug — `admin/review` silently degraded service-role→anon (#47). Deleted 4 dead files. A CI **deploy gate** (#43) now runs `node:test` via `tsx` and blocks merges.
- **RLS audit + lockdown:** a probe-driven scare ("anyone can write prices") was a **false alarm** — `pubs` / `price_history` / `price_snapshots` were always service-role-only. The audit did find 3 over-permissive tables: after migrating their writer routes to the service-role key (#48), dropped the public WRITE + read-leak policies on `pub_price_cache`, `push_subscriptions`, and `agent_activity`. Also fixed the **stale Pint Index** (the weekly-snapshot crons had been failing silently on anon writes). The DB change is recorded in [`supabase/migrations/20260530120000_rls_lockdown.sql`](../supabase/migrations/20260530120000_rls_lockdown.sql).

### Removed non-core features (2026-05-30)
- Product call: killed everything that isn't the core pint-price experience. Deleted **pub-golf**, **pint-crawl**, **leaderboard**, and **weekly-report** (the "Pint Report" stats page) — all had **0 organic clicks/impressions over 90 days** and are rebuildable from git history.
- Removed the 4 page routes + the orphaned `/api/weekly-report`, and cleaned every reference: sitemap entries, the `/discover` "Activities" carousel, and nav/footer links (MobileNav incl. now-unused icon imports, Footer, SubPageNav, HomeClient, homepage SSR crawl-links). Fixed the weekly push deep-link (was broken at `/weekly`) → `/insights/pint-index`. **18 files, −2,635 lines.** tsc + `next build` green; `/discover` visually verified (no empty section, footer nav trimmed).
- Twilio left untouched (separate AI phone-call price-collection system). The refactor plan's CrawlPlanner/GolfScoring modules + Phase-6 game-teardown are now moot.
- Commit: `0f93002`

### Whole-app refactor plan + deploy gate (Phase -1) (2026-05-30)
- A 17-agent workflow (survey → 4 independent architects → reconcile → red-team → finalize) produced a full module architecture for the app, rendered as **`docs/architecture-refactor-plan.html`**. Headline: the app has ~8 problems copy-pasted 50+ times; the fix is **24 deep modules** across a 4-layer onion (substrate seams → pure kernels → data accessors → external-I/O → UI) + a giant teardown, in an **8-phase migration** (Phase -1..6). Builds on the earlier 7-candidate review (folded in).
- **Shipped Phase -1 (the deploy gate):** `main` auto-deploys to production but CI ran only tsc/lint/build — tests were not gated, and the two `node:test` unit tests couldn't even run (node couldn't resolve their extensionless TS imports). Added `tsx` + a `test` script and wired **Test + redirect-test steps into the existing `Typecheck, lint, build` CI job** (job name kept verbatim to preserve the branch-protection required check). Bumped CI Node 20 → 22.
- Surfaced (not yet fixed) **two live security holes** for later phases: an ElevenLabs HMAC shared-secret bypass (`post-call:66`) and a service-role→anon silent degrade (`admin/review:6`).
- **Two CEO decisions still open:** keep/kill the game features `pint-crawl` + `pub-golf` (both have **0 organic clicks/impressions over 90 days** per GSC; in-app usage is unmeasurable — no working GA4/first-party analytics), and whether Twilio (in `package.json` but unused in code) is still in the stack.
- Commits: `76f11aa` (plan doc), `5a716ca` (Phase -1 deploy gate)

### Live-bug fixes from architecture review (2026-05-30)
- A multi-agent architecture-review workflow surfaced three "live bugs"; two were real (fixed here), one was a false alarm.
- **Happy-hour badge** (`5247efb`): the pub list/card components re-parsed the lossy `pub.happyHour` string through `happyHour.ts`'s regex, which can't match Weekends, single days, or am-pm spans (and the generated string drops `:30` minutes), so the "HH" badge silently showed off during weekend/half-hour/midday happy hours. `PubCardList`, `SunsetSippers`, and `PuntNPints` now read the structured `pub.isHappyHourNow` (computed by `happyHourLive` from raw fields). `TonightsMoves` + `DiscoverClient` deferred — their `isToday`/countdown use needs the `happyHourLive` extension (arch-review rank 1).
- **Pint Index badge** (`f609b48`): `PintIndexBadge` fetched `price_snapshots` ascending + `limit(30)` = the 30 oldest snapshots, so the homepage badge price and "% this week" came from the start of history. Now fetches the newest 30 (descending) and reverses to chronological order.
- **Not a bug:** record-price not writing `happy_hour_price` — Andrew's tool never sends a happy-hour price, so nothing is dropped. Latent gap (arch-review rank 5), not a live bug; left untouched.
- Next body of work is the 7-candidate architecture deepening backlog from the same review (rank 1 = consolidate the happy-hour engine into one deep `happyHourLive` module and delete `happyHour.ts`).
- Commits: `5247efb`, `f609b48`

### SEO redirect consolidation (2026-05-03)
- Fixed the legacy redirect half of the highest-priority canonical redirect work:
  - Legacy `/suburb/[slug]` redirects now return `301` to the current `/[suburb]` URL in production.
  - Legacy `/pub/[slug]` redirects now return `301` to `/[suburb]/[pub]` in production.
- Updated the app-level `www.perthpintprices.com` redirect rule to request `301`, but production verification showed Vercel's project-domain redirect still returns `308` before app config. Issue #25 is reopened; remaining action is to update the Vercel domain configuration for `www.perthpintprices.com` with `redirectStatusCode: 301`.
- Added `npm run test:redirects` to guard the redirect status codes against regression.
- Commits: `8818575`, `6eea19a`

### Project governance + CI infrastructure (2026-04-27)
- README, CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md, CHANGELOG.md
- `.github/CODEOWNERS`, `dependabot.yml`, PR template, 5 issue forms (bug, feature, SEO action, content, data quality)
- CI workflow on every PR + push to main (typecheck, lint, build) — required status check on `main`
- ESLint wired up (was previously absent — `next lint` ran interactively); 9 pre-existing warnings tolerated, 3 pre-existing errors fixed
- Custom labels: triage, blocked, in-progress, p0/p1/p2, feature, chore, seo, andrew, content, data, security, performance, schema, indexing, ci, dependencies
- Repo description + 15 topics set, branch protection on main (no force-push, no deletion, required CI, required conversation resolution)
- Milestone "SEO Push — Q2 2026" with 12 issues filed against it (#25-#36)
- Commits: `c98bdf3`, `cf00ce5`, `c24cc72`, `7ef63b2`, `e30491d`

### SEO research + action plan (2026-04-27)
- Pulled GSC + GA4 data: 131 clicks / 5k impressions / 2.6% CTR / position 17.1 over 90 days, 838 unique queries, 28% of pages not indexed (439 of 1,573)
- `docs/seo-research-2026.md` — what's new in late-2026 SEO since SEO-MASTER was written. AI Overview / AEO / GEO playbook, Information Gain post March 2026 core update, MenuItem schema, AU local quirks, INP replaces FID. 27 sources cited.
- `docs/seo-action-plan.md` — prioritised 12-action punch list driven by the GSC + GA4 data. Each issue in milestone #1 maps to a section here.
- Headline gaps: www vs apex canonical splitting (~38 clicks at risk), legacy `/pub/`/`/suburb/` 308s still indexed, 373 "Discovered, currently not indexed", 0 GA4 key events, 12 zero-click queries on page 1
- Commit: `cf00ce5`

### Andrew voice agent: full pipeline + voice tuning (2026-04-26 + 2026-04-27)
- Production pipeline already shipped from a parallel session before this work began:
  - `src/app/api/agents/record-price/[slug]/route.ts` — mid-call webhook (partial-data tolerant, unit conversion)
  - `src/app/api/agents/post-call/route.ts` — HMAC-signed post-call webhook with Claude transcript fallback
  - `src/app/api/pintsweep/kickoff/route.ts` — batch trigger using ElevenLabs Batch Calling, 24h dedupe, openNow filter
  - 70-term Scribe v2 keyterm list, 6 few-shot transcripts, DTMF/IVR navigation
- First successful real-pub capture (2026-04-26): $12.80 Great Northern Super Crisp at Kalamunda Hotel from Cassie
- ElevenLabs MCP wired into `~/.claude.json` user-level
- Nexelle agent + phone number deleted from ElevenLabs; voice-proxy Vercel project deleted; local source removed
- Voice config tuned per `docs/andrew-voice-research.md`: model `eleven_flash_v2` → `eleven_v3_conversational` (Expressive Mode), stability 0.30 → 0.70, similarity_boost 0.85 → 0.75, turn eagerness `eager` → `patient`. `flash_v2_5` was rejected by API ("English Agents must use turbo or flash v2"), v3 conversational got through via expressive_mode toggle.
- `docs/andrew-voice-research.md` — voice model + TTS tuning research
- Commits: `d03b883`, `ae4b44e` (reverted in `6d4cd96` — duplicate of pre-existing route)

### Arvo → Perth Pint Prices rebrand finished (2026-04-27)
- Companion to the earlier code/SEO-title rebrand (`5b3df48`). Replaced remaining "Arvo" references in CLAUDE.md, PROJECT-STATUS.md, SEO-MASTER.md, the price verification kit, the service worker, the PWA manifest, and every guide/insight/suburb page.
- Homepage title now uses Next's `title.absolute` pattern; "Arvo" preserved as `alternateName` in WebSite JSON-LD for SEO continuity
- SubPageNav brand mark switched from SVG icon to text-only (`<amber>Perth</amber> Pint Prices`)
- Commit: `5a11568` (39 files, 157 insertions, 204 deletions)

### Pub location audit and fix (2026-03-10)
- Audited all 423 pub lat/lng coordinates against Google Places Text Search API
- Fixed 146 incorrect locations: 126 auto-applied, 11 user-confirmed, 9 geocoded from addresses
- Accuracy improved from 64.5% to 97.6% within 100m of Google's coordinates
- Scripts: `audit-locations.js`, `apply-confident-fixes.js`, `apply-manual-fixes.js` (gitignored)

### Homepage UX overhaul + dead code cleanup (2026-03-10)
- Filter section consolidated, distance dropdown swaps in for suburb when sorting Nearest, copy aligned with community-powered messaging
- 16 unused components removed (1,676 lines), `src/lib/emoji.ts` deleted, 163 testing screenshots deleted
- Commits: `48f139f`, `9fe1345`

### SEO + Humanizer audit (2026-03-09)
- BreadcrumbJsonLd schema bug fixed, Twitter cards added, sr-only H1s added, titles/descriptions trimmed
- Em dashes replaced with periods in 5 components
- Commits: `2a6e082`, `f3e93b5`

### Research agent merge (2026-03-09)
- 190 research agent JSON files merged: 49 updates + 3 new pubs into Supabase via `scripts/merge-research.js`

## What's still to do

### Architecture refactor (in progress — full plan in [`docs/architecture-refactor-plan.html`](./architecture-refactor-plan.html))
From the 2026-05-30 architecture review. **Done:** Phase -1 (deploy-gate CI), Phase 0 (PerthClock + SupabaseGateway keystones), DB security lockdown, Phase 1 (PubUrls — one slug source of truth + 150-suburb SEO snapshot test, fixed the O'Connor 404), Phase 2 (`toPub` row→Pub mapper, −133 lines). **Remaining, roughly by size:**
- **HappyHourEngine** (biggest / highest-value) — collapse `happyHour.ts` + `happyHourLive.ts` into one "effective-price-now" module and delete the lossy string parser. Also fixes **two deferred happy-hour badge bugs**: `TonightsMoves` + `DiscoverClient` re-parse the lossy `pub.happyHour` string instead of the structured `pub.isHappyHourNow`, so their badge/countdown is wrong for weekend / half-hour / am-pm windows (their `isActive` is entangled with `isToday`/countdown, which needs this engine first).
- **Formatters** — relocate `formatPrice.ts` / `priceLabel.ts` into one seam.
- **`PerthNow.date` footgun** (Phase-0 review nit) — its UTC fields hold Perth wall-clock, so `.getHours()`/`.getDate()` on it double-shifts. Rename or drop.
- **`price_snapshots` accessor** (5 fetch/coerce sites) and **`useUserLocation()` hook** (6 `getCurrentPosition` copies).
- Tiny: `getPubsLite`'s prelude still duplicates `toPub`'s happy-hour computation.

**Now ticketed** under milestone `Architecture Refactor` (#5): #56 HappyHourEngine (p1), #57 Formatters, #58 PerthNow.date footgun, #59 price_snapshots accessor, #60 useUserLocation. Plus **#66** — the coordinated Next 16 + React 19 + ESLint 9 upgrade (deferred from Dependabot #21).

Operating loop: each increment ships behind an independent code review + full verification (`tsc`, `node:test`, `next build` with `SUPABASE_SERVICE_ROLE_KEY` unset); merge to `main` = production deploy. Continue autonomously; only surface 100%-real blockers.

### SEO push — Q2 2026 (3 milestones: `SEO: Indexing & Technical` #2 · `SEO: Content & Schema (AEO)` #3 · `SEO: Measurement & Growth` #4)
See [`docs/seo-action-plan.md`](./seo-action-plan.md) for the prioritised punch list. Top of the list:
- #25 www → apex — **closed** (no-op: `www` already 308-redirects and Google treats 308 ≡ 301; `vercel.json` is set to 301). The only residual lever was a GSC reindex nudge; not a ranking risk.
- #27 Reclaim zero-click page-1 queries with answer-first blocks + FAQPage schema (4h, p1)
- #28 Configure GA4 Key Events (30m, p1)
- #29 Add answer-first block + MenuItem schema to all 857 pub pages (1-2d, p1)
- #30 Get 373 "Discovered not indexed" crawled (1d, p1)
- #31 Resolve 39 "Duplicate, Google chose different canonical" (unblocked — legacy 301 shipped + #25 closed; re-pull the current count from GSC)
- #32 Build missing high-intent landing pages (3-5d, p1)
- #33 Press-pitch the Pint Index to WA media (1w, p2)
- #34 Migrate to next/image + INP audit (4-6h, p1)
- #35 Add llms.txt + Article schema for AI citation (1h, p2)
- #36 Set up weekly SEO snapshot + GSC alerts (15m/wk, p2)

### Data
- **663 of 857 pubs missing regular prices** (was 222 in March; new pubs are being added faster than prices are being collected)
- Andrew (the voice agent) is the strategy — see `agents/andrew.json` and the `/api/pintsweep/kickoff` batch trigger
- Consider price refresh strategy for stale prices (some pubs haven't been updated in months)
- **Ticketed** under milestone `Data Coverage` (#6): #61 backfill the 663 missing prices (p1), #62 stale-price refresh strategy.

### Andrew voice agent (milestone `Andrew (voice agent)` #7)
- **#63** revive do-not-call + cooldown + post-call-fallback hardening — draft PR #68 is open from `codex/andrew-dnc-cooldown` (not merged/deployed yet). It supersedes the old unmerged `claude/audit-e2e-improvements-WQb6N` source branch; keep the old branch until #63 ships.
- **#64** voice-quality decision. Place test calls with phone OFF silent to evaluate cadence/volume after the v3 conversational + stability 0.70 change
- If sound quality is good: kick off Professional Voice Clone (PVC) per `docs/andrew-voice-research.md` §3 — book a 30 min recording session via Voicebooking / Voices.com or record a willing AU male mate. Cleanest signal for production phone bots.
- If still inconsistent: pilot Cartesia Sonic-3 + Line per research §6

### Dependabot — triaged 2026-05-31 (0 open PRs)
- **Merged:** #18 setup-node 4→6, #19 checkout 4→6, #38 minor/patch group, **#65** (lucide 1.11 + twilio 6 + @vercel/analytics 2.0.1, consolidated — one clean lockfile; tsc + 167 tests + build green).
- **Deferred:** next 14→16 (#21) — closed + `@dependabot ignore`'d; tracked as **#66** (coordinated Next 16 + React 19 + ESLint 9 upgrade) under milestone `Architecture Refactor`.

### Stale PRs to clean up (#1-#12)
Done — all of those old Feb–Mar 2026 PRs are closed (**0 open PRs ≤ #12**), and as of 2026-05-31 the Dependabot backlog is cleared too (see above) — **0 open PRs total**.

### Features (ideas, not committed)
- Price alerts / watchlist notifications
- Pub comparison tool
- Historical price charts on pub detail pages

### Manual setup the user owns
- **GA4 Key Events**: per issue #28, configure 6 key events in GA4 Admin → Events
- **Twilio cleanup**: the orphaned Nexelle phone number `+61851226384` is still allocated and billing on the Twilio side — release it in the Twilio console if you want it gone.

## Project board

**[Perth Pint Prices — Roadmap](https://github.com/users/iamjohnnymac/projects/6)** (v2 Project, Team Planning template).

- Linked to `iamjohnnymac/perthpintprices`; holds the roadmap issues across the 6 milestones (**22 items**). The 10 issues created 2026-05-31 (#56–#64, #66) were added to the board.
- Built-in views: **Backlog** (table grouped by Status), **Board** (Kanban: Todo / In progress / Done), **Current iteration**, **Roadmap**, **My items**
- Fields: `Status`, `Priority` (P0/P1/P2), `Size` (XS-XL — used as effort proxy: XS=Quick win, S=Half day, M=Full day, L=Multi-day, XL=Ongoing), `Estimate` (number), `Iteration` (sprint), `Start date`, `Target date`, plus custom **`Area`** (SEO / Andrew / Content / Performance / Schema / Indexing / Chore)
- Each item already tagged with Priority + Size + Area; Status defaults to Todo

Note: project was created via the GitHub web UI (Team Planning template + bulk import) after `gh project create` produced one where API-added items were silently invisible in views (forward query returned 0 even when reverse lookup confirmed items attached). UI-created project works. Don't recreate via CLI.

## Utility scripts (local only, gitignored)
- `scripts/merge-research.js`, `analyze-json.js`, `compare-prices.js`, `fix-seo.js`, `audit-locations.js`, `apply-confident-fixes.js`, `apply-manual-fixes.js`, `backfill-phones.mjs`, `backfill-place-ids.mjs`, `discover-venues.mjs`, `finalize-backfill.mjs`, `insert-discovered-venues.mjs`, `sample-voices.mjs`, `sample-voices-female.mjs`, `test-responsive.mjs`
