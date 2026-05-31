# Perth Pint Prices Project Status

Last updated: 2026-05-31

## What this is

Perth Pint Prices (perthpintprices.com) tracks pint prices across **857 Perth pubs** (up from 423 in March). Users can discover cheap pints, find happy hours, and report prices. The site is live on Vercel.

Stack, database, routes, components, and lib files are documented in `CLAUDE.md` (auto-loaded every session). This file covers history, recent work, and the backlog.

## What's done recently

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
