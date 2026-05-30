# Perth Pint Prices — SEO Action Plan (2026-04-27)

Companion doc to `SEO-MASTER.md` (the playbook) and `seo-research-2026.md` (what's new in late-2026 SEO). This file is a **prioritised punch list** built from real GSC + GA4 data pulled today, ranked by ROI per hour of effort.

> **Note — 2026-05-31 reconciliation.** Some items have since shipped or been re-scoped:
> - **#1 (www→apex):** downgraded. Verified live that `www` already 308-redirects to apex, all canonicals point to apex, and Google treats 308 as equivalent to a 301 — so this is **not** the "single biggest mechanical win." The only residual lever is a GSC reindex nudge.
> - **#2 (legacy /pub + /suburb → 301):** **done** (shipped 2026-05-03).
> - **#4 (GA4 events):** drop `pint_crawl_start` and `pub_golf_start` — those features were deleted.
> - References to a **weekly report** page (in #5/#8/#11) are moot — it was deleted; use the Pint Index as the Article-schema / PR asset.
> - The GSC/GA4 numbers below are a dated 2026-04-27 snapshot.

---

## State of play (data, last 90 days)

### Search Console
- **131 clicks** / 5,030 impressions / 2.6% CTR / **avg position 17.1** (bottom of page 2)
- **838 unique queries** earning impressions — long-tail demand is real
- **766 pages** earning at least one impression
- **1,134 indexed / 439 NOT indexed (28% loss)** — biggest leak in the funnel

### Page indexing breakdown — 439 not indexed across 7 reasons
- 373 — *Discovered, currently not indexed* (Google won't crawl them — authority/depth signal)
- 39 — *Duplicate, Google chose different canonical than user* (canonical leak)
- 15 — *Crawled, currently not indexed* (rejected after crawl — content quality)
- 8 — Page with redirect (legacy `/pub/*` and `/suburb/*` being de-indexed — fine)
- 2 — Redirect error
- 1 — Not found 404
- 1 — Duplicate without user-selected canonical

### GA4 (last 28 days)
- **172 sessions** / 103 active users / 98 new users / **39.5% engagement rate** / 23s avg engagement
- **95% of users are new** — basically no repeat visitors. Site behaves as one-shot transactional ("find a cheap pint, leave")
- Channel mix:
  - **Organic Search**: 137 sessions (79.65%) — 41.6% engagement, 23s
  - **Direct**: 32 sessions (18.6%) — 25% engagement, 13s
  - **Referral**: 2 sessions — 100% engagement, 2m07s (high-quality but tiny volume)
- Top landing pages: `/` (99 sessions), `/fremantle` (8), `/cottesloe`, `/insights/pint-index`, `/mandurah`, `/northbridge/northbridge-brewing-company`, `/perth`, `/rockingham` (all 2 each)
- **Zero key events configured** — no conversion tracking exists at all

---

## The 12 prioritised actions

Order is roughly **highest ROI per hour first**. Items 1–4 are technical bleeds you should fix this week; items 5–8 are content moves that compound over months; 9–12 are infrastructure that pays off once everything else is sound.

---

### 1. Fix the www vs apex canonical — RESOLVED / DOWNGRADED (see 2026-05-31 banner)

**Evidence**: GSC top pages shows `https://www.perthpintprices.com/` with **23 clicks / 522 impressions** AND `https://perthpintprices.com/` with **15 clicks / 424 impressions**. They're competing for the same content. Plus 39 pages flagged as "Duplicate, Google chose different canonical than user".

**Action**: Pick one (recommend apex `perthpintprices.com` since it matches your `metadataBase` in `src/app/layout.tsx`) and 301 every `www.*` request to apex. Vercel project settings → Domains → set apex as primary, redirect `www` → apex. After deploying, request reindex of homepage in GSC.

**Expected impact**: ~~Consolidates ~38 clicks and ~946 impressions onto one URL. Single biggest mechanical win.~~ **Correction (2026-05-31):** `www` already 308-redirects to apex and 308 is equivalent to 301 for Google, so there is no split to "consolidate" via a redirect change. Low/no remaining value, and not a ranking risk either way.

---

### 2. Force the legacy `/pub/[slug]` and `/suburb/[slug]` to actually 301 (2 hours) — DONE (shipped 2026-05-03)

**Evidence**: GSC top pages still shows `/suburb/fremantle` (41 imp, 2 clicks) outranking the new `/fremantle` (20 imp, 3 clicks). Same for `/pub/northbridge-brewing-company` (16 imp) and `/pub/ocean-beach-hotel` (15 imp). They're 308s per `SEO-MASTER.md §2`, but 308 doesn't pass authority as cleanly as 301 in the wild.

**Action**: Convert the legacy stubs from 308 to **301 (Moved Permanently)**. Verify with `curl -I https://perthpintprices.com/suburb/fremantle` — you want `HTTP/2 301` not `308`. Then request "Validate fix" in GSC's "Page with redirect" report. Submit each old URL to URL Inspection for re-crawl.

**Expected impact**: Speeds the consolidation Google has been running for weeks. Should clear the 8 "Page with redirect" pages and stop the new URLs being outranked by their own legacy versions.

---

### 3. Reclaim the highest-impression-zero-click queries with title + answer-first content (4 hours)

**Evidence**: GSC found 12 queries ranking page 1 (positions 5–10) earning **0 clicks** across hundreds of impressions. Classic AI Overview cannibalisation — the snippet answers the question for free.

| Query | Impressions | Position | Target page | Fix |
|---|---|---|---|---|
| "perth beer prices" | 72 | 7.6 | `/insights/pint-index` | Add answer-first block: "Perth's average pint costs $X.XX as of [date]. Across 300+ tracked venues, the cheapest sits at $X." |
| "how much is a pint" | 77 | 16.9 | new `/how-much-is-a-pint-in-perth` page | 40-word answer first, then pint vs schooner explainer, link to live data |
| "how much is a pint of beer in perth" | 23 | 7.0 | same | exact-match H2, statistic-dense |
| "how much is a pint in perth" | 13 | 5.8 | same | already top of page 1 — give Google something to cite |
| "cheapest pints in perth" | 11 | 9.5 | new `/cheapest-pints` (per research §6) | live ranked list with FAQPage schema |
| "happy hour perth" | 8 | 51.1 | `/happy-hour` is page 5 — content-thin | rewrite intro 200 words + FAQPage schema |
| "paradise karaoke bar" | 20 | 8.3 | the pub page | the page exists but isn't being clicked — title + meta description audit |
| "ruin bar" | 35 | 27.2 | the pub page | rank-improvement, not CTR — needs internal links + thin-content fix |
| "skol scarborough" | 31 | 28.1 | pub page | same |
| "jackadders" | 23 | 12.4 | pub page | edge of page 1 — 1 click away from real volume |

**Action**: For each of the top 5, write the answer-first 40–60 word block per `seo-research-2026.md §3`. Stat-dense, exact-match phrasing. Ship FAQPage schema on the same page.

**Expected impact**: If each of these moves from 0% to even a 3% CTR (well below industry avg for that position), that's roughly 8–10 extra clicks/day = doubling current organic clicks.

---

### 4. Configure GA4 Key Events / conversions (30 minutes)

**Evidence**: GA4 shows **0 key events** across all 28 days. You have no idea what "success" looks like in analytics. Engagement rate (39.5%) and 23s avg engagement are low because the goal is invisible.

**Action**: Set these as Key Events in GA4 → Admin → Events:
- `view_pub` (when a user lands on a `/[suburb]/[pub]` page)
- `report_price` (when the price-report form submits — already an event presumably)
- ~~`pint_crawl_start`, `pub_golf_start`~~ (removed — these features were deleted)
- `outbound_pub_link` (clicks to pub website)
- `crowd_report_submit`
- `install_pwa`

Once these fire, the 39.5% engagement rate will climb because GA's engagement signal includes "key event fired = engaged session".

**Expected impact**: No traffic gain itself, but unblocks every future decision ("does this page convert?"). Required before any A/B-style experiments.

---

### 5. Apply the answer-first + MenuItem schema rebuild to all 300 pub pages (1–2 days)

**Evidence**: This is recommendation #1 from `seo-research-2026.md` and matches the GSC pattern of pub-name queries getting impressions but no clicks (Google answering inline). Combined with stat #11 in the research doc — schema-marked pages get +73% AI Overview selection in Search Engine Land's controlled test.

**Action**: Update `src/app/[suburb]/[pub]/page.tsx`:

```typescript
// Above-the-fold answer-first block (server-rendered, ~50 words)
<p className="lead">
  The cheapest pint at <strong>{pub.name}</strong> in {pub.suburb} is{' '}
  <strong>${pub.price}</strong> for a {pub.beerType}
  {pub.happyHour && <>, dropping to <strong>${pub.happyHourPrice}</strong> during happy hour ({pub.happyHourLabel})</>}.
  Verified {formatRelative(pub.lastVerified)}.
</p>
```

Plus extend the JSON-LD with full `Restaurant` → `Menu` → `MenuItem` → `Offer{price, priceCurrency: "AUD"}`. Cite: schema.org MenuItem, Google Restaurant rich result eligibility.

**Expected impact**: Compounds across 300 pages. Single highest-leverage change available.

---

### 6. Bring up the 373 "Discovered, currently not indexed" pages (1 day)

**Evidence**: 373 pages Google has *seen* via your sitemap or internal links but won't crawl. Common causes per Google's own guidance:
1. Low domain authority (we have ~0 backlinks)
2. Pages too similar to each other (the templated pub-page problem)
3. Low internal-link signal (some pubs are 4+ clicks from homepage)

**Action**: A two-pronged fix.

**(a) Build internal-link rails** on every pub page:
- "Cheapest 3 in {suburb}"
- "Same price band, different suburb"
- "Same amenities nearby"

Each link uses descriptive anchor text — *"cheapest pint in Northbridge"* not *"more"*.

**(b) Sitemap split** — `src/app/sitemap.ts` currently emits a single sitemap. Split into:
- `sitemap-pubs.xml`
- `sitemap-suburbs.xml`
- `sitemap-content.xml` (guides + insights)
- `sitemap-index.xml` referencing the three

Re-submit each in GSC. Forces Google to re-prioritise crawl per facet.

**Expected impact**: Google crawls more of the 373 over the next 4–8 weeks. Each additional indexed pub page is +1 search-eligible asset.

---

### 7. Fix the 39 "Duplicate, Google chose different canonical" pages (1 hour audit + fix)

**Evidence**: GSC says Google is *overriding* your `<link rel="canonical">` on 39 pages. Almost certainly the same www/apex issue from action #1 plus the legacy `/pub/*` and `/suburb/*` 308 chain.

**Action**: After actions #1 and #2 land, click through GSC → Pages → Duplicate Google chose different canonical → see the actual list. Some will resolve themselves once www→apex is forced. The remainder probably need: explicit `<link rel="canonical" href="...">` matching the actual served URL on every page, no trailing-slash mismatches, no UTM-tagged versions creeping in.

**Expected impact**: Reclaims the canonical authority Google is currently splitting.

---

### 8. Build the missing high-intent landing pages (3–5 days)

**Evidence**: GSC shows specific underserved query clusters:
- "happy hour [day-of-week]" (e.g. "monday happy hour perth", "el grotto happy hour", "como hotel happy hour", "northbridge brewing co happy hour", etc.) — 30+ unique HH-related queries ranked deep
- "cheap pints [suburb]" — variations across most major suburbs
- "[suburb] beer garden", "pubs in [suburb]" — already partially covered but thin

**Action**: Per `seo-research-2026.md §6`, build:
1. `/cheapest-pints` (live ranked list, FAQPage schema, editorial intro)
2. `/happy-hour/[day]` (7 pages — Mon–Sun, programmatic + 200w editorial each)
3. `/[suburb]/beer-garden`, `/[suburb]/dog-friendly` etc. (faceted, only for suburbs with ≥3 venues matching)
4. `/student-pints-perth` (sub-$10 venues near UWA, Curtin, Murdoch — link bait for student media)
5. `/pubs-near-perth-station`, `/pubs-near-optus-stadium` (4 transport-hub pages)

Each one needs: 200-word original editorial intro, answer-first block, FAQPage schema, internal-link rail.

**Expected impact**: Captures a layer of demand that has zero quality competition right now.

---

### 9. Get one Tier-1 link before doing anything else for Pint Index PR (1 week)

**Evidence**: GA4 shows 2 referral sessions in 28 days — basically zero off-site. Both `seo-research-2026.md` and `SEO-MASTER.md §5` agree: a single Perth Now / WAtoday / 6PR link beats 50 directory listings.

**Action**: Press-pitch the Pint Index. Email template attached as appendix. Five named WA journalists in 30 minutes via LinkedIn or station contact pages. Subject line: "Perth pint prices rose X% in [quarter] — full data attached".

Pre-work: Pint Index page needs YoY chart, "share this stat" callouts, methodology paragraph. ~2 hours of design + copy.

**Expected impact**: One placement in WAtoday or Perth Now would 3-5× current click volume directly, plus referring-domain authority → unblocks indexation for the 373 "Discovered not indexed" pages.

---

### 10. Migrate to `next/image` and audit INP (4–6 hours)

**Evidence**: `SEO-MASTER.md §6` lists this as "to do" (still). `seo-research-2026.md §7` notes INP < 200ms is the 2026 bar — replaced FID two years ago, ~43% of sites fail it. Map tile loading + filter-heavy pages on `/discover` and `/happy-hour` are the most likely failure points for us.

**Action**:
- Run a fresh PageSpeed Insights audit on `/`, `/discover`, `/happy-hour`, `/[suburb]/[pub]`.
- Migrate map tile and pub photos to `next/image`.
- Wrap filter handlers in `useDeferredValue` or `useTransition`.
- Lazy-load `next/script` with `strategy="lazyOnload"` for GA + push notifications.

**Expected impact**: Better Core Web Vitals score = better ranking signal + better engagement (which lifts the 23s engagement-time metric).

---

### 11. Add `llms.txt` and `Article` + `dateModified` schema for AI citation (1 hour)

**Evidence**: `seo-research-2026.md §7` and §AEO. AI Overviews preferentially cite content that's fresher (25.7% on average) and that signals canonical citation paths via `llms.txt`.

**Action**:
- Create `src/app/llms.txt/route.ts` that emits a markdown file listing canonical URLs of cite-worthy pages: Pint Index, weekly report, methodology, top suburb pages.
- Add `Article` JSON-LD with `author`, `dateModified`, `dateReviewed` to `/insights/pint-index` and `/weekly-report`.
- Surface "Last verified [date]" with `time` element on every pub page.

**Expected impact**: Compounding AI-citation signal. Cheap to ship.

---

### 12. Set up a quarterly review cadence (15 min/week)

**Evidence**: `SEO-MASTER.md §7` already has a maintenance schedule, but with no key events in GA4 and no GSC alerting it's not being followed.

**Action**:
- GSC → Settings → Email preferences → enable all alerts
- Calendar block: 15 min every Monday for the GSC weekly Performance + Pages reports
- Add a `npm run seo-snapshot` script that pulls GSC top-100 queries and pages each Monday into `docs/seo-snapshots/2026-MM-DD.md` for trend tracking
- Quarterly: re-pull this exact data and check movement against the above 11 actions

**Expected impact**: Compounds via faster spotting of regressions and opportunities.

---

## What we're explicitly NOT doing

Per `seo-research-2026.md §1` — these are in the existing playbook but should be deprioritised:

- **Google Business Profile setup** — service-area aggregator can't rank in 3-pack in 2026. Not worth the time.
- **Tier-3 directory submissions** at scale — entity consistency matters more than volume; do the top 4 (Eatability AU, Zomato AU, Apple Business Connect, Bing Places) and stop.
- **Skyscraper-only content strategy** — keep it as a link-building tool, but don't expect it to fix rankings on its own.

## Estimated 90-day outcomes if all 12 ship

| Metric | Now | 90-day target |
|---|---|---|
| Clicks (90d) | 131 | 600–900 |
| Impressions (90d) | 5,030 | 15,000+ |
| Avg position | 17.1 | 11–13 |
| Indexed pages | 1,134 | 1,400+ |
| Key events tracked | 0 | 6+ |
| Tier-1 backlinks | 0 | 1–2 |

Conservative — most of the lift comes from action #3 (CTR fixes on existing rankings) and #6 (indexing more of the 373). Each compounds on the others.

---

## Sources & further reading

- `docs/SEO-MASTER.md` — the playbook (still mostly correct, see deltas in research doc)
- `docs/seo-research-2026.md` — what's new in 2026 SEO with full citations
- GSC dashboard: https://search.google.com/search-console?resource_id=sc-domain:perthpintprices.com
- GA4: https://analytics.google.com/analytics/web/#/p527219875
