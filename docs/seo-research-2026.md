# SEO Research 2026 — What's New Since SEO-MASTER

Compiled: 2026-04-27. Companion to `docs/SEO-MASTER.md` — read that first for the existing playbook. This file captures only what's changed since the playbook was written (2026-03-08) and tactics specific to a 300-pub programmatic data site that the existing doc misses.

---

## TL;DR — Top 5 actions ranked by ROI for THIS site

1. **Rebuild every pub page around an "answer-first" 40-60 word factual block above the fold.** AI Overviews and Perplexity cite pages whose first 60 words directly answer the implied question. For `/[suburb]/[pub]` that means: "The cheapest pint at The Norfolk Hotel in Fremantle is $9 Swan Draught during 5–6pm happy hour, Mon–Fri." This single change compounds across 300 pages and is the highest-leverage AEO move available to us. Princeton's GEO study found expert-quote-style structures lift LLM citation by ~41%, statistics by ~30%. [1][2]

2. **Ship MenuItem + Menu schema on pub pages, plus FAQPage on every guide and suburb page.** Restaurant/MenuItem schema is now eligible for Google rich results showing prices directly in SERP. Schema-marked pages saw a +73% boost in AI Overview selection in Search Engine Land's controlled test. We have the price data; not exposing it as MenuItem is leaving table stakes on the table. [3][4][5]

3. **Treat the Pint Index as a PR asset, not just a page.** The single biggest win in Backlinko's 2026 trend report is "third-party signals." LLMs cite multiple sources per query. We need WAtoday/Perth Now/6PR mentions saying "according to perthpintprices.com, the average Perth pint is now $X." Quarterly press release with original data, pitched to 5 named WA journalists. This also feeds our existing Tier-1 link plan in SEO-MASTER §5. [6]

4. **Stop trying to "rank in the local 3-pack." Ranking in the local pack without a physical address is essentially impossible in 2026 — confirmed by Sterling Sky and Whitespark.** Pivot the GBP plan in SEO-MASTER to: skip GBP entirely, double-down on city/suburb landing pages with editorial depth (matches the Whitespark "exceptional city pages" model). The existing doc still lists "GBP setup" as high-priority — that's now wrong for our shape of business. [7][8]

5. **Add visible "last verified" timestamps and structured `dateModified` to every pub page.** AI Overviews prefer content that is on average 25.7% fresher than top organic. We already have `price_history` data — surfacing it as "Verified Tue 22 Apr 2026 by [user] — $9 Swan" and feeding it to schema is a free freshness signal. [4][9]

---

## What's changed since the existing playbook (delta)

The existing `SEO-MASTER.md` is broadly correct on fundamentals but materially out of date on five points. Calling them out explicitly:

| Existing item | Status | What's actually true in 2026 |
|---|---|---|
| "Google Business Profile setup — high impact" (§2 audit, medium pri) | **Wrong for our model.** | A web-only aggregator with no physical premises cannot rank in the 3-pack. Whitespark's 2026 survey and Sterling Sky both confirm SAB ranking depends on the verified physical address, not the service area. Skip GBP. Invest the time in city landing pages instead. [7][8] |
| "FID < 100ms" (§6 technical, Backlinko principles) | **Outdated metric.** | FID was retired and replaced by **INP** in March 2024. The 2026 threshold is **INP < 200ms**, with >500ms classed as poor. ~43% of sites currently fail it; it's the most-failed CWV. [10] |
| "Title under 60 chars" / generic on-page rules | **Still true but insufficient.** | The bar in 2026 is "Information Gain" — Google's March 2026 core update re-weighted this signal. Pages assembled from the same sources as the top 5 competitors no longer clear the bar even at length and keyword density. We need original commentary, not just fresh prices. [9][11] |
| "1,500+ words for competitive pages" | **Partial.** | Length still correlates with backlinks (long-form +77% backlinks per Backlinko's 2026 stats) but quality of structured chunks matters more for AI citation. Frase's 2026 AEO guidance: 200–400 word self-contained sections with H2/H3 questions outrank one long essay for AI citation. [3][12] |
| "Skyscraper Technique" (§4) | **Still works for backlinks, weaker for rankings.** | Brian Dean's own 2026 piece downgrades volume-based content tactics in favour of "newsworthiness" and "persona-driven" content. We can keep skyscraper as a link-building tool but it won't fix the ranking problem alone. [6] |

**One thing the existing doc nails and should keep**: the "data is our unfair advantage" thesis (§4). That's more true in 2026 than 2024 — original first-party data is the single strongest signal for both Google's core update direction and AI citations.

---

## AI Overview / Answer Engine Optimisation playbook (new — not in existing doc)

The existing playbook predates serious AEO/GEO guidance. This section is the gap.

### Why this matters for us specifically

AI Overviews now appear on most informational queries. CTR drops 34–61% when an AIO shows. [13][14] AIO CTR has recovered from 1.3% to 2.4% between Dec 2025 and Feb 2026 — citation in the AIO itself drives clicks now. [15] For "cheapest pint near [suburb]" we are in the citation race, not the blue-link race.

### Concrete content patterns that get cited

**Answer-first chunking** — every H2 or H3 should pose a question, and the first 40–60 words must answer it directly. Mirror exact-match user phrasing ("what is", "how much", "where can I find"). [3][12]

**Statistics every 150–200 words.** Specific numbers ($9.50 average, 12.4% YoY, 47 pubs under $10) get cited; vague language doesn't. We have the data — surface it inline rather than only in tables. [3]

**Semantic triples** — write factual sentences as Subject-Predicate-Object: "The Norfolk Hotel pours Swan Draught at $9 during happy hour." Easier for LLMs to chunk into knowledge graphs. [12]

**Multimodal density** — Lily Ray notes YouTube and image content is heavily cited inside AIO. Even short pub photos with descriptive alt text and `ImageObject` schema lift visibility. We are weak here. [16]

### Schema priorities for AEO (in addition to what's in the existing doc)

1. **`Restaurant` / `BarOrPub` with full `Menu` → `MenuSection` → `MenuItem` → `Offer{price, priceCurrency}`.** Eligible for menu rich result. We currently have BarOrPub but no menu schema. [17][18]
2. **`acceptsReservations`** boolean/URL on each pub.
3. **`FAQPage`** on every guide and suburb page (homepage FAQ is already on the to-do list in §6 of existing doc — extend it).
4. **`Article` with `author` + `dateModified` + `dateReviewed`** on the Pint Index, weekly report and any editorial. Required for AI source-credibility signal. [19]
5. **`Organization`** with `sameAs` linking to our future Reddit, Instagram, X profiles. Helps entity recognition. [16]
6. **`SpeakableSpecification`** on key Q&A snippets — picked up by Google Assistant and indirectly by voice/AI surfaces.

### What NOT to do

- **No AI-generated content at scale** — Lily Ray is explicit this is dangerous in 2026. The humanizer skill rule in CLAUDE.md is correct and should stay. [16]
- **No hidden LLM instructions** (white-on-white prompts). Violates guidelines. [16]
- **Don't chase every long-tail "fan-out" query.** LLM stochasticity makes whack-a-mole impossible. Build topical authority instead. [16]

---

## Programmatic + faceted SEO opportunities (300 pubs is a programmatic site — own it properly)

Google's March 2026 core update did NOT kill programmatic SEO. It killed **thin** programmatic SEO. Wise, Zillow, Zapier still print money. The dividing line is Information Gain per page. [9][11][20]

### Where we sit on the thin↔valuable spectrum

- **Per-pub**: Borderline. Unique data, templated copy. Add a 100-word "what's notable here" paragraph generated from structured fields (5–10 hand-written templates per amenity combo, not GPT slop).
- **Per-suburb**: Weakest tier. Add commentary — median price, top 3 cheapest, walking distance between venues, parking notes.
- **Guides**: Strong on data, light on editorial. Each should open with 200 words of original take.

### Faceted opportunities we're missing

We have the database for these; they don't exist as pages yet. Each is a programmatic page worth building **only if** we layer commentary on top.

| Facet | URL pattern | Search intent |
|---|---|---|
| Price band | `/under-10-dollars`, `/under-12-dollars` | "cheap pints perth", "pint under $10 perth" |
| Amenity + suburb | `/fremantle/beer-garden`, `/northbridge/dog-friendly` | "[suburb] beer garden", "dog-friendly pubs perth" |
| Day of week | `/happy-hour/monday`, `/happy-hour/sunday` | "monday happy hour perth" — high underserved volume |
| Beer brand | `/swan-draught`, `/great-northern` | Long-tail brand+location queries |
| Distance from CBD | `/walking-distance-from-cbd` | "pubs near perth station" |

**Faceted nav rules (essential to avoid index bloat):** Whitelist a small set of indexable facet combos. `noindex,follow` on combinations that don't have stable demand. Canonical the rest back to parents. Segment sitemaps by facet type. [21]

### Internal linking automation

Auto-generate "More like this" rails on each pub page using:
- Same-suburb cheapest 3
- Same price band, different suburb
- Same amenities, nearest 3
Each link with descriptive anchor text ("cheapest pint in Northbridge", not "click here"). This is the single highest-leverage technical SEO change available — every page should be reachable from every other relevant page in 2 clicks. [21]

---

## Local AU SEO (concrete moves)

Australia is a single Google-dominant market — Google has ~95% share, Bing ~3%. Half of all AU Google searches are local intent. [22]

### What works for us specifically

1. **Skip GBP** (covered above — dead end for our model).
2. **AU directories** — keep the existing list and add Eatability AU, Zomato AU, Concrete Playground Perth, OpenTable AU partner pages. Entity consistency (same brand description) matters more than NAP consistency in 2026. [22]
3. **Apple Business Connect** — free, 15 min setup. Apple Maps powers ~90% of iPhone nav in AU and feeds Siri. Reviews come from Yelp/TripAdvisor, so push review-encouragement there. [23]
4. **Bing Places** — Microsoft owns ~49% of OpenAI; Bing feeds ChatGPT search. One-click import. [22]
5. **Local entity citations** — r/perth, Cheap Beer In Perth Facebook group, Perth Now comments. AI-citation gold per Solis and Ray. [16][24]

### Competitor map for "cheap pints perth" / "perth happy hour"

SERP is dominated by `eatdrinkcheap.com.au` (live but shallow), `perthunderground.com.au` (listicle), `timeout.com/perth` (high-DA editorial), `tripadvisor.com.au` forums, `dropt.beer`. Only EatDrinkCheap has live deal data and theirs is shallow — we win on data depth (300 vs ~50 venues) and freshness. Skyscraper their pages with our database. [25]

---

## Content opportunities (target keywords + estimated effort)

| Page | Target keyword | Estimated effort | Format | Why it works in 2026 |
|---|---|---|---|---|
| `/cheapest-pints` (new) | "cheapest pints perth", "cheap pints perth" | Medium (1 day) | Live-updated ranked list with editorial intro, price-band facets | Beats `eatdrinkcheap` on data; FAQPage schema for AIO |
| `/happy-hour/[day-of-week]` (new, 7 pages) | "monday happy hour perth", etc | Medium (programmatic + 200 words ed per page) | Day-filtered list | Underserved long-tail; current results are stale listicles |
| `/[suburb]/beer-garden` etc (facet) | "[suburb] beer garden", "outdoor pubs [suburb]" | Low if templated | Filtered list per amenity per suburb | High-intent, high-conversion local |
| Suburb editorials (15 pages) | "best pubs in [suburb]" | Medium (200 words/page, hire freelancer) | List + 200w editorial + map | Existing pages thin; content fixes ranking gap |
| `/perth-pint-index` (enhance) | "perth beer prices", "perth pint price trends" | Low | Add YoY commentary, chart, share-stat callouts | Linkable PR asset; cite-able by media |
| Quarterly Pint Index PR | "perth pint price [year]" | High (PR pitch effort) | Press release + landing page | News links; brand mentions feed AI citations |
| `/pubs-near-[transport-hub]` (4 pages) | "pubs near perth station", "pubs near optus stadium" | Low | Geo-filtered list | High commercial intent; near-zero competition |
| `/student-pints-perth` | "cheap pubs UWA", "cheap pints curtin" | Low | Filtered for sub-$10 near campuses | Backlink magnet for student media |

**On the homepage FAQ**: existing doc has FAQPage schema as a TODO. Push that — it's the single highest-impact-per-hour technical change available. [3]

---

## Technical / structured data wins

### Schema additions (priority order)

1. `MenuItem` + `Offer` per pub — enables price rich result. [17]
2. `FAQPage` on homepage, every guide, every suburb. [3][4]
3. `Article` + `dateModified` on Pint Index and weekly report. [19]
4. `ImageObject` with descriptive `caption` on all pub photos.
5. `Event` schema for happy-hour windows (treat each happy hour as a recurring `Event`). Eligible for event rich result.
6. `SpeakableSpecification` on FAQ blocks for voice/AI surfacing.
7. `Organization` with `sameAs` array linking all our social profiles. [16]
8. `BreadcrumbList` with `url` (already done, but verify since the existing doc mentions a `url` vs `item` gotcha).

### Performance — INP is our weak metric

INP < 200ms is the 2026 bar. Top INP killers in Next.js App Router apps: [10][26]

- Heavy client components on initial paint — audit which interactive components could be `'use server'` or React Server Components.
- Map tile loading on suburb/pub pages — confirmed not yet on `next/image`. Migration is in existing TODO list; bump priority.
- Filter handlers on `/discover` and `/happy-hour` — wrap in `useDeferredValue` or `useTransition`.
- Third-party scripts (GA, push notifications) — load with `next/script` `strategy="lazyOnload"`.

### Other technical wins not in existing doc

- **`hreflang`** isn't useful (single market) but **`<link rel="alternate" type="application/rss+xml">`** for the weekly report = AI training signal.
- **Server-rendered structured data** — confirm JSON-LD ships in initial HTML payload, not via client JS. AI crawlers often don't execute JS. [16]
- **`llms.txt`** — emerging standard (analogue to `robots.txt`) for AI training/citation hints. Cheap to ship. Add `/llms.txt` listing canonical URLs of our most cite-worthy pages (Pint Index, weekly report, methodology). [27]
- **Sitemap segmentation** — split current single sitemap into `sitemap-pubs.xml`, `sitemap-suburbs.xml`, `sitemap-content.xml`. Faster crawl prioritisation per Whitespark/Sitebulb 2026 guidance. [21]

---

## Sources

1. Princeton GEO study via Frase — `https://www.frase.io/blog/what-is-answer-engine-optimization-the-complete-guide-to-getting-cited-by-ai`
2. AEO citation tactics overview — `https://llmrefs.com/answer-engine-optimization`
3. Frase 2026 AEO guide — `https://www.frase.io/blog/what-is-answer-engine-optimization-the-complete-guide-to-getting-cited-by-ai`
4. Schema markup AI Overviews study — `https://searchengineland.com/schema-ai-overviews-structured-data-visibility-462353`
5. Wellows AI Overview ranking factors — `https://wellows.com/blog/google-ai-overviews-ranking-factors/`
6. Backlinko 5 SEO trends 2026 — `https://backlinko.com/seo-this-year`
7. Sterling Sky on SAB ranking — `https://www.sterlingsky.ca/does-the-service-area-in-google-my-business-impact-ranking/`
8. Whitespark city-pages for SAB — `https://whitespark.ca/blog/rank-in-cities-with-no-physical-address/`
9. Evertune on March 2026 core update — `https://www.evertune.ai/resources/insights-on-ai/googles-march-2026-core-update-a-content-best-practices-guide-for-seo-and-ai-search`
10. INP optimization 2026 — `https://www.bknddevelopment.com/seo-insights/core-web-vitals-inp-optimization-guide-2026/`
11. ALM Corp on March 2026 core — `https://almcorp.com/blog/google-march-2026-core-update-complete/`
12. Aleyda Solis on chunk retrieval — `https://www.aleydasolis.com/en/ai-search/ai-search-winning-brands-characteristics/`
13. Seer Interactive AIO CTR study via Search Engine Journal — `https://www.searchenginejournal.com/impact-of-ai-overviews-how-publishers-need-to-adapt/556843/`
14. Ahrefs AI Overview CTR study — `https://www.dataslayer.ai/blog/google-ai-overviews-the-end-of-traditional-ctr-and-how-to-adapt-in-2025`
15. Search Engine Land AIO CTR recovery — `https://searchengineland.com/google-ai-overviews-ctr-recovery-study-475566`
16. Lily Ray, A Reflection on SEO and AI Search — `https://lilyraynyc.substack.com/p/a-reflection-on-seo-and-ai-search`
17. Restaurant/MenuItem schema 2026 — `https://richmenu.io/restaurant-schema-markup/`
18. Schema.org MenuItem reference — `https://schema.org/MenuItem`
19. Wellows on E-E-A-T and AI citations — `https://wellows.com/blog/google-ai-overviews-ranking-factors/`
20. Ahrefs programmatic SEO — `https://ahrefs.com/blog/programmatic-seo/`
21. Faceted navigation 2026 — `https://venue.cloud/news/insights/tame-faceted-navigation-seo-safe-ia-internal-linking-and-crawl-control-for-e`
22. Local SEO Australia 2026 — `https://birdeye.com/blog/local-seo-australia/`
23. Apple Maps SEO 2026 — `https://www.directoryone.com/blog/apple-maps-seo-step-by-step-guide-to-improving-local-rankings.html`
24. Aleyda Solis 10 winning brand traits — `https://www.aleydasolis.com/en/ai-search/ai-search-winning-brands-characteristics/`
25. EatDrinkCheap Perth pints — `https://eatdrinkcheap.com.au/perth/pints-specials` (competitor benchmark)
26. web.dev INP article — `https://web.dev/articles/inp`
27. llms.txt proposal — emerging standard referenced widely in 2026 AEO literature; see Frase/Surmado guides at sources [3] and `https://www.surmado.com/blog/answer-engine-optimization-aeo-geo-guide/`
