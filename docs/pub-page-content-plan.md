# Pub Page Content Plan v2 — "Perth's practical pub-price layer"

**Status:** Historical delivery plan. The owner superseded its Tier-C noindex rule on 2026-07-21 in issue #230: every legitimate pub remains indexable and sitemap-listed regardless of price, verification, or freshness.
**Supersedes:** v1 (8-module draft). Owner decisions locked — see §0.

---

## 0. Locked decisions (owner)

1. **Pint price schema:** CUT `Menu`/`MenuItem`/`Offer` for v1. Win the citation via a visible answer-first sentence + crawlable price table. Revisit `Offer` only if real menu data lands.
2. **Price-less pubs:** **Tier-C = "honest missing-price page"** — keep each legitimate pub URL canonical, indexable, and in the sitemap. Price and verification status control truthful presentation only; they never control index eligibility.
3. **Phone/NAP:** only emit `telephone`/hours in schema when sourced from the **Google Places backfill** (Phase 4). No manual GBP reconciliation pass; don't publish unverified NAP.
4. **`revalidate`:** raise 300 → **3600** + event-driven `revalidatePath` from write paths (so the timer rarely matters).

---

## 1. Strategy

Pub pages are **decision pages, not articles**. Every page answers fast: *"Should I go here for a pint, what will it cost, when is it cheaper, what are better nearby options?"* Voice: practical, cheeky, data-first, local. **The unlock is unique usefulness per pub, not more words.**

Positioning: **Perth's practical pub-price layer.** We don't beat venue official sites on brochure content — we beat them on **pint price · happy-hour freshness · price vs suburb average · nearby cheaper options · Andrew/user verification loop · crawlable price tables.** No competitor (perthlocalista, buggybuddys, perthisok, Urban List, Yelp, Tripadvisor, Fanzo) surfaces price/freshness/structured-HH — that's the moat.

**Two corrections the panel forced vs v1:**
- Ship a **lean 4–5 module** answer-first page, not 8 stacked modules (8 buries the CTAs on mobile).
- The central anti-scaled-content move is **not gating alone** — gating 663 pubs to empty produces 663 *identical husks*, which is itself a templated fingerprint. The real safeguard is an explicit **indexability tier** (§5).
- **"pubs in [suburb]" is a `/[suburb]` job, not a pub-page job** (§4).

## 2. Final module set (pub page, render order)

1. **Answer block** — fused price + below/above suburb-avg + HH-now status + verified date in ONE scannable card. Primary CTA immediately after: **Directions** when priced, **Report-the-price as hero** when not. `NOW`
2. **Best Time To Go** — HH live now / later today / not today + savings vs normal price. `NOW`
3. **Cheaper Nearby** — merges v1 #3+#4 into one **geo-radius** block (lat/lng radius; fall back to suburb when sparse). 3–4 pubs + price + walking distance. Strongest internal-link graph. `NEW QUERY` (current `getNearbyPubs` is suburb-only — "nearby" is geographically false at suburb edges; must become radius-based)
4. **Mini-FAQ** — venue-specific, answer-first, built from modules 1–3. Renders **only when ≥3 real answers**; question phrasings drawn from a **2–3 variant pool seeded by pub id** (identical Q-strings across 850 pages = the scaled-content tell). `NOW`
5. **Verification stub** (price-less / Tier-C pages only) — truthful absence: *"No verified price yet — last Andrew call {date/never}; {N} nearby pubs have verified prices →"* + Report CTA. The one non-gated module safe on husks; feeds the data flywheel. `NOW`

**Cut from v1:** Venue Essentials (duplicates existing map + Website/Directions buttons → SEO sludge); What It's Good For (no trustworthy data, Google ignores `amenityFeature`, top fabrication risk — fold the one real `vibeTag` into the existing H1 subtitle). **Deferred:** Food/Menu Note (no ingestion pipeline yet — Phase 4).

**Voice is a deliverable, not emergent:** write 3–4 worked copy templates per module *state* (price-known / HH-live / HH-later / price-missing) as string builders BEFORE any module code, e.g. *"Happy hour's on right now — pints down to $X til Ypm"* not *"Happy Hour: active."* Run through the humanizer skill.

## 3. Separate template — `/[suburb]` (targets "pubs in [suburb]")

Add an answer-first block to the suburb page: ranked `ItemList` of pubs by pint price + lead sentence *"The cheapest pint in [Suburb] is $X at [Pub] (verified [date]); the average is $Y across N pubs."* + `ItemList`/`CollectionPage` schema. Reuses data we already have (suburb avg, rank, nearby). This — not the pub page — is what wins "pubs in [suburb]" / "cheapest pint in [suburb]".

## 4. Schema (final)

Single connected **`@graph` with stable `@id`s** (fixes today's disconnected nodes):
- `WebPage` (`#webpage`, `mainEntity`→`#pub`, `breadcrumb`→`#breadcrumb`, **`dateModified` = pub.lastVerified** — the freshness moat made machine-readable, highest-ROI single field)
- `BarOrPub` (`#pub`, `hasMap`, `geo`, NAP; `telephone` only when Places-sourced)
- `BreadcrumbList` (`#breadcrumb`)
- Happy hour → `openingHoursSpecification` (special-hours window), gated on real `happyHourLive` data
- Pint price → **visible answer-first sentence + crawlable table** (NOT Menu markup — cut per §0.1)

**Live schema bugs to fix at the same time:**
- `priceRange: "$X.XX per pint"` is **invalid** (expects `$`/`$$` band, not a sentence) — replace with `$`/`$$` derived from price-vs-suburb-avg.
- Nodes currently disconnected (no `@graph`/`@id`/`WebPage`/`dateModified`).

**Do NOT use:** fake/self-serving `aggregateRating` or first-party star markup (manual-action risk); copied reviews; `openingHours` unless authoritatively sourced; `Menu`/`Offer` in v1; `FAQPage` for rich results (gone Jun 2026 — keep visible Q&A for AEO only); stale/guessed menu items.

## 5. Scaled-content safeguards (non-negotiable) — 3-tier indexability

Keyed on a per-pub **`dataScore`**, wired into **both** robots metadata **and** sitemap (they must agree):
- **Tier A** (fresh price OR HH + attributes) → index + prerender + sitemap.
- **Tier B** (price OR HH, little else) → index, ISR, sitemap, low priority.
- **Tier C** (NAP + map only) → index + sitemap with an honest missing-price state and report-price CTA. It remains Tier C for presentation and quality measurement only.

Plus:
- `getIndexablePubSlugPairs()` includes every legitimate pub; the separate, evidence-backed permanent-closure rule remains the only current sitemap exclusion.
- Every module renders from real per-pub data; **no AI-generated blurbs from nothing**; no copied menus.
- **Titles conditional on data** — don't promise "Pint Prices & Happy Hour" on a page with neither. New title: `[Venue] Pint Prices & Happy Hour | [Suburb]` (<60 chars) only when data supports it.
- **De-dup meta descriptions** — drop the constant "Community-verified… updated daily" suffix; let price-delta / HH-window / nearest-cheaper-pub clauses carry uniqueness.
- **CI duplicate-cluster guard** — hash rendered main-content DOM (module presence + order, values stripped) per pub; assert high distinct-fingerprint count. Quantifies husk exposure before Google sees it.

## 6. Rendering / ISR

The "migration" is **largely already done** — `page.tsx` already has `revalidate` + default `dynamicParams=true`. Not a static→ISR rewrite; the only change is shrinking `generateStaticParams` to a subset. **Lowest-reward technical item — do it last.**
- Raise `revalidate` 300 → 3600; add **event-driven** `revalidatePath('/${suburb}/${slug}')` (or `revalidateTag`) from `/api/agents/record-price` and `/api/price-report` write paths.
- **Fix sitemap `lastModified`** → real `last_verified`/`updated_at`, not `Date.now()` (currently tells Google every page changed every hour, training it to ignore the signal).
- Wrap pub Supabase reads in `unstable_cache` tagged `pub:${slug}` + `revalidateTag` on write (protects Supabase from crawler regeneration storms on the tail).
- Set `dynamicParams=true` explicitly; confirm `notFound()` returns no soft-404 indexable HTML.

## 7. Build sequence (single source of truth → issues)

**Phase 0 — Indexability & honesty (do FIRST; protects the whole template)**
1. `dataScore` presentation tiers + preservation-first robots metadata and sitemap membership (`getIndexablePubSlugPairs`). **M / NOW**
2. Sitemap `lastModified` → real `last_verified`/`updated_at`. **S / NOW**
3. Raise `revalidate`→3600; event-driven `revalidatePath`/`revalidateTag` from write paths. **M / NOW**

**Phase 1 — Schema correctness (cheap, unblocks AI citation)**
4. Connected `@graph` + `@id`s + `dateModified` + valid `priceRange` band; HH as `openingHoursSpecification`. **S / NOW**
5. Confirm AI crawlers (GPTBot, PerplexityBot, Google-Extended) allowed in robots; add/verify `llms.txt`. **S / NOW**

**Phase 2 — Data spine for trust**
6. Persist per-field provenance (`source` + `verified_at` + `confidence`) → dated verification widget. **M / NOW**
7. Price-recency tier (fresh <30d / aging / stale-null) drives render + prerender selection. **M / NOW**

**Phase 3 — Content (lean, answer-first)**
8. Per-state cheeky-local voice templates (price-known / HH-live / HH-later / price-missing) as string builders → humanizer. **M / NOW** (gate before any module code)
9. Ship modules 1, 2, 4 + dated verification widget + price-missing Report-hero CTA. **M / NOW**
10. Geo-aware `getNearbyPubs` (radius, suburb fallback) → merged "Cheaper Nearby" module 3. **M / NOW**
11. Verification stub (module 5) on Tier-C pages. **S / NOW**
12. `/[suburb]` answer-first ranked-price `ItemList` block + schema. **M / NOW**

**Phase 4 — Backfill (separately-sourced; NOT one pipeline)**
13. Widen pintsweep Places FieldMask (`regularOpeningHours, nationalPhoneNumber, types, websiteUri`) + standalone backfill sweep over place_id pubs → hours/phone + `openingHoursSpecification`. **M / NOW** (run BEFORE freezing prerender; this is what unlocks phone per §0.3)
14. Extend `menu-scan` vision prompt → food type / kitchen hours (high-confidence only) → Food note module (link official menu, never copy). **M / DEFER**

**Phase 5 — Low-reward / guards (last)**
15. Shrink `generateStaticParams` to GSC-impression + complete-data subset. **S / DEFER**
16. CI duplicate-cluster fingerprint guard (standing check). **M / DEFER**
17. Re-request indexing + audit the 58 crawled-not-indexed / 67 discovered (only after thinness fixed). **M / DEFER**

**Cut entirely:** Menu/MenuItem/Offer schema (§0.1); generic amenities module + `amenityFeature` schema; adding hours/food/amenity questions to Andrew (keep it on its 3-field price mission).

## 8. Key reframes vs v1 (so the delta is clear)

- 8 modules → 4–5 (cut Venue Essentials + What It's Good For; merged the two "nearby" modules).
- Tier-C pages stay honest and lightweight, but price thinness is no longer an index or sitemap exclusion signal.
- Re-sequenced: indexability + sitemap honesty + schema fixes move FIRST; the headline "rendering migration" demoted to last (mostly already live).
- Killed Menu/Offer schema; fixed the live invalid `priceRange` bug; mandated connected `@graph` + `@id` + `dateModified`.
- "BACKFILL" hid three different sources: hours/phone come near-free from a Places call pintsweep already pays for; food from menu-scan vision; generic amenities cut. Andrew stays price-only.
- Added `/[suburb]` as the real target for "pubs in [suburb]".
- Conversion made explicit: price-missing pages (the majority) flip the Report CTA to hero; freshness date promoted to an unmissable trust/AEO signal; pre-written voice templates required before module code.

## 9. Success metrics (verifiable done-states)

Baselines captured 2026-05-31 (GSC + Ahrefs). Each metric names the phase that should move it.

| # | Metric | Baseline | Target | Verified by |
|---|---|---|---|---|
| M1 | **Clicks on `[venue] menu` / `[venue] happy hour` queries** (sir henrys menu, fuse bar menu, sweetwater/sandbar happy hour, etc.) | 0 clicks at pos 9–30 | ≥1 click on each of the top-20 such queries within 60d of Phase 3 ship | GSC query report |
| M2 | **Crawled-not-indexed + discovered-not-indexed pub URLs** | 58 + 67 | Trend down while every legitimate Tier-C URL remains eligible for indexing | GSC Pages report |
| M3 | **Indexable pub URLs in sitemap** | ~850 | = full legitimate pub inventory across Tiers A, B, and C (`getIndexablePubSlugPairs`) | sitemap.xml diff |
| M4 | **Sitemap `lastModified` honesty** | 100% stamped build-time `Date.now()` | 0% build-time; every URL = real `last_verified`/`updated_at` | sitemap.xml inspection |
| M5 | **Schema validity on indexable pub pages** | invalid `priceRange` string sitewide; disconnected nodes | 0 invalid `priceRange`; connected `@graph` + `@id` + `dateModified` on 100% | Rich Results Test / schema validator |
| M6 | **Distinct rendered-DOM fingerprint count** (scaled-content guard) | not measured | High distinct-shell count; CI duplicate-cluster guard passes (no collapse to 1–2 shells) | Phase 5 CI guard (#16) |
| M7 | **`/[suburb]` ranking for "pubs in [suburb]" / "cheapest pint in [suburb]"** | absent from top 10 | impressions > 0 and climbing on tracked suburb terms | GSC + Ahrefs rank tracker |
| M8 | **Report-price submissions from price-less (Tier-C) pages** (the data flywheel) | ~0 (no CTA hero) | measurable submissions/week feeding price backfill | `price_reports` table + analytics |

**Per-issue acceptance:** each build-sequence issue (§7) cites the metric(s) above it advances; "done" = the code ships AND its named metric is instrumented/observable (not necessarily moved yet — some are lagging indicators).
