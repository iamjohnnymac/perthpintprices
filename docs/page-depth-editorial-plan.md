# Page Depth & Pub Editorial Plan

Status: route audit for issue #133
Date: 2026-06-03
Milestone: #9 Page Depth & Pub Editorial

## 1. Reference Pattern

The supplied Perthisok pages were reviewed in the in-app browser on 2026-06-03:

- `https://perthisok.com/eat-drink/`
- `https://perthisok.com/eat-drink/the-best-restaurants-in-perth/`

Useful patterns to translate, not copy:

- A strong visual category front door: oversized category title, lead image, and a feed of article cards.
- Article cards with category, author, published date, large image, and a headline with a real local angle.
- Long-form guide articles with a large hero, author/date/share metadata, short intro, jump links by occasion or use case, and named venue sections.
- Local prose that feels reported rather than templated: a place, a reason, a date, an address, a dish, a room, a view, or a specific observation.

PPP translation:

- The price is the differentiator. Personality should come from live pint price, freshness, suburb average, happy-hour timing, nearby cheaper pubs, price history, and the verification loop.
- Avoid generic "best pubs" filler. A page earns more words only when it has real data or a useful editorial frame.
- Use images where the surface is editorial or hub-like. Keep pub/suburb template pages primarily data-led unless there is verified visual/source material.

## 2. Existing Work to Preserve

Do not re-ticket these as if they are missing:

- `/discover` already has an answer-first standfirst, Pint of the Day, Best Buys, Happy Hours, Pub Picks, and Report a price CTA.
- `/[suburb]` already has a data-fed answer-first lead, hero stats, live happy-hour block, venue table, and nearby-suburb links.
- `/[suburb]/[pub]` already has price, freshness, provenance, happy hour, Tier-C verification stub, report CTA, price history, map, and nearby verified prices.
- `/insights/pint-index` already has a methodology block and CSV citation asset.
- Homepage already has FAQPage JSON-LD and server-rendered crawlable links.
- `/guides` and `/insights` currently redirect to `/discover`; their child pages remain live.

## 3. Route-by-route Plan

### `/`

Current role: primary transactional entry point for searching/filtering pubs.

Next useful depth:

- "Right now in Perth" module: cheapest verified pint, median pint, number checked in last 30 days, live happy-hour count.
- "Where to start" editorial rail: Cheapest pints, happy hours, suburb rankings, Pint Index, and first editorial posts once live.
- Trust strip: how prices are checked, what "verified" means, why TBC pages are honest.
- Optional visual: one real or generated hero/OG-style pint-price image, but do not turn the homepage into a magazine layout.

Data sources:

- `getPubs()`, `getSiteStats()`, `price_snapshots`, `price_reports`, `last_verified`, happy-hour status.

Internal links:

- `/discover`, `/happy-hour`, `/suburbs`, `/insights/pint-index`, `/insights/tonights-best-bets`, future `/blog` or chosen editorial path.

SEO target:

- "perth pint prices", "cheapest pints perth", "cheap beer perth".

Voice note:

- Keep it blunt and useful. The homepage should sound like a price board with a pulse, not a publication front page.

Visual assets:

- Nice-to-have. Data-led first.

Related issues:

- Feeds #136 and #140.

### `/discover`

Current role: broad hub with guide cards and live price modules.

Next useful depth:

- Tighten the visual hierarchy so it feels like the PPP equivalent of an Eat & Drink front door.
- Add a stronger lead feature slot: Pint of the Day or "Tonight's best value" with image/illustration optional.
- Add editorial rail once posts exist: "Read next" cards for cheap-pint and suburb stories.
- Add clearer section labels: Cheap now, Happy hour, Pub picks, Data reads.
- Avoid adding more prose to the intro; it already does the job.

Data sources:

- `getPubs()`, `/api/pint-of-the-day`, happy-hour status, pub attributes.

Internal links:

- Pub detail pages through `pubUrl`, `/happy-hour`, `/suburbs`, `/insights/*`, `/guides/*`, future editorial posts.

SEO target:

- "perth pub guide", "cheap drinks perth", "cheapest pints perth".

Voice note:

- More magazine-like structure, still price-first. Do not make this a glossy bar guide.

Visual assets:

- Yes, for editorial cards or category feature slots.

Related issues:

- Feeds #135 and #136. Overlaps #32, but #32 owns new high-intent landing pages, not the existing hub polish.

### `/happy-hour`

Current role: live list of active happy hours only.

Next useful depth:

- Add "on now", "later today", and "by day" planning states. Active-only is useful but leaves the page thin outside peak hours.
- Add day-of-week rails that can later become `/happy-hour/[day]`.
- Add "what to check before you go" trust note: price, start/end, last confirmed.
- Add short FAQ for "what is happy hour in Perth right now" style queries.

Data sources:

- `happyHourDays`, `happyHourStart`, `happyHourEnd`, `happyHourPrice`, `regularPrice`, `last_verified`, `getHappyHourStatus()`.

Internal links:

- Active pub pages, `/discover`, day anchors or future day routes, relevant editorial posts like Friday happy hours.

SEO target:

- "happy hour perth", "perth happy hour deals", "friday happy hour perth", day-specific happy-hour queries.

Voice note:

- Practical and current. "Happy hours move around" is the core truth; lead with what we know right now.

Visual assets:

- Mostly data-led. Small editorial cards can use images once the article system exists.

Related issues:

- Feeds #136 and #139. Strong dependency/overlap with #32.

### `/suburbs`

Current role: searchable suburb index.

Next useful depth:

- Add leader modules above the alphabet list: cheapest suburb, dearest suburb, most verified pubs, most happy hours.
- Add "pub suburbs worth checking tonight" rail based on verified prices and active happy hours.
- Link to suburb spotlight/editorial posts when available.
- Keep the alphabet index; it is useful and crawlable.

Data sources:

- `SuburbInfo`, suburb averages, cheapest prices, pub counts, happy-hour counts, freshness counts if available.

Internal links:

- All `/[suburb]` pages, `/discover`, future suburb posts.

SEO target:

- "pint prices by suburb perth", "perth suburbs pubs", "cheapest suburb for pints perth".

Voice note:

- This is the table of contents for Perth's pub-price geography. It can be dry and comparative.

Visual assets:

- Data-led first. No hero image required.

Related issues:

- Feeds #136 and #137.

### `/[suburb]`

Current role: local price table and suburb answer block.

Next useful depth:

- Add a compact "suburb story" module that uses the strongest available real signal: price spread, cheap leader, happy-hour density, stale-data count, or nearby cheaper suburb.
- Add "best for tonight" rail: cheapest verified, active happy hour, nearest checked pub if location is available.
- Add mini FAQ when enough data exists.
- Add editorial cross-links for suburb spotlights or articles that mention the suburb.
- Add visual only when there is an editorial suburb spotlight; otherwise data is stronger.

Data sources:

- `SuburbInfo`, `pubs`, `nearbySuburbs`, `perthAvgPrice`, `suburbObservation()`, freshness helpers, happy-hour status.

Internal links:

- Pub detail pages, nearby suburbs, `/happy-hour`, `/suburbs`, future editorial posts tagged to suburb.

SEO target:

- "best pubs in {suburb}", "cheapest pint in {suburb}", "pubs in {suburb}".

Voice note:

- One sharp local observation beats three generic paragraphs. If the suburb has thin data, say that and ask for a report.

Visual assets:

- Usually no. Editorial suburb spotlights may need images.

Related issues:

- Directly feeds #137. Overlaps #27 and #32 for answer-first blocks and landing-page expansion.

### `/[suburb]/[pub]`

Current role: pub decision page.

Next useful depth:

- Add a more explicit "Should you go here for a pint?" answer line above or inside the price card.
- Add "best time to go" state for happy hour live/later/no confirmed happy hour.
- Add related editorial links: articles mentioning the pub, suburb guides, nearby crawls.
- Add source-backed food/menu note only after official menu review/import is approved.
- Add mini FAQ only when at least three answers are real.
- Keep Tier-C pages sparse and honest. Do not pad missing-price pubs.

Data sources:

- `pub`, `priceRecency`, `nearbyPubs`, `avgPrice`, `latestAndrewCallAt`, `nearestVerifiedPub`, provenance fields, price history, official menu leads after approval.

Internal links:

- Same suburb, nearby verified pubs, cheaper nearby pubs, future editorial posts, report-price flow.

SEO target:

- "{pub name} pint price", "{pub name} happy hour", "{pub name} menu" only when source-backed.

Voice note:

- Pub pages are decision pages, not articles. Specificity should come from price, delta, freshness, happy-hour window, and cheaper nearby options.

Visual assets:

- No generic stock. Use map/data first. Venue photos only if sourced safely and worth maintaining.

Related issues:

- Directly feeds #138. Depends on #72 for string-builder discipline. Food/menu note depends on #79 and approved official-menu data.

### `/guides/*`

Current role: feature wrappers around interactive guide components.

Next useful depth:

- Preserve the interactive guide components; add a stronger editorial wrapper only where it helps the guide rank and explain itself.
- Add a short intro, "why this list exists", and "how pubs are picked" per guide.
- Add jump links or filters when a guide naturally splits by use case.
- Add related editorial posts once the article system exists.

Per-guide direction:

- `/guides/beer-weather`: weather-led pub picks, add "hot/rain/cold" jump sections and link to live forecast logic.
- `/guides/cozy-corners`: rainy/cold pub guide, use "cosy" in prose, not "cozy".
- `/guides/dad-bar`: family-friendly pub angle; keep the human one-liners.
- `/guides/punt-and-pints`: TAB/sports use case; include price/value rather than betting copy.
- `/guides/sunset-sippers`: sundowner guide; timing and west-facing/view signals should do the work.

Data sources:

- Pub attributes, location, weather/sun position helpers, verified prices, happy-hour status.

Internal links:

- Matching pub pages, `/discover`, `/happy-hour`, related editorial posts.

SEO target:

- "perth beer garden", "cosy pubs perth", "perth pubs with playground", "perth pubs with TAB", "sunset pubs perth".

Voice note:

- More personality is welcome here, but every joke needs a fact left behind after the joke is cut.

Visual assets:

- Yes. Guides should use actual or generated bitmap imagery where it helps the use case.

Related issues:

- Feeds #136 and #139. Related to completed Site Voice milestone, but not superseded by it.

### `/insights/*`

Current role: data pages for Pint Index, Pint of the Day, suburb rankings, tonight, and venue breakdown.

Next useful depth:

- Give each insight page a visible headline number and one compact explainer block.
- Add "cite this" or shareable stat treatment where the page is media/search useful.
- Link each insight to related editorial posts and underlying data pages.
- Keep `/insights/pint-index` as the strongest citation asset.

Per-page direction:

- `/insights/pint-index`: add stronger current headline number, latest movement, and media-ready stat callouts.
- `/insights/pint-of-the-day`: explain why today's pub was picked and link to runners-up.
- `/insights/suburb-rankings`: add fastest path to cheapest/dearest suburb and notable movers.
- `/insights/tonights-best-bets`: make this the night-out decision page: cheapest, happy hour, nearby.
- `/insights/venue-breakdown`: explain price brackets and which suburbs/pubs sit in each.

Data sources:

- `price_snapshots`, `PintIndex`, `PintOfTheDay`, `SuburbLeague`, `TonightsMoves`, `VenueIntel`, pub prices, freshness.

Internal links:

- `/discover`, `/happy-hour`, `/suburbs`, pub pages, CSV, future editorial explainers.

SEO target:

- "perth beer prices", "perth pint index", "cheapest suburb pints perth", "pint of the day perth".

Voice note:

- These pages can be nerdier. Let the number lead, then explain it in plain English.

Visual assets:

- Mostly data-led. Pint Index and editorial citation cards may need share images later.

Related issues:

- Feeds #136, #139, and #140. Overlaps #27 and #118.

### Editorial lane: `/blog` or `/articles`

Recommended route: `/articles`.

Reason:

- `blog` sounds generic and personal. `articles` is clear enough for users and leaves room for guides, explainers, price reports, and suburb stories.
- Keep existing `/guides` and `/insights` child pages as specialised product/data pages. Use `/articles` for manually authored pub/drinking posts.

Required surfaces:

- `/articles`: visual hub with feature story, category rails, recent posts, and data-led internal links.
- `/articles/[slug]`: article page with hero image, title, deck, category, author, published/updated date, Article schema, related pubs/suburbs, and report-price CTA.

Starting categories:

- Cheap pints
- Happy hour
- Suburb guides
- Pub data
- Perth drinking basics
- Weather and sport

First post batch:

- Where to get a pint under $10 in Perth
- Perth happy hours by day of the week
- The cheapest pint in Northbridge, Fremantle, Leederville, Subiaco, and the CBD
- Proper pint, schooner, middy, pot: what Perth venues actually pour
- Perth pubs for a rainy pint
- Perth pubs for a sundowner where the pint price does not sting
- How Perth Pint Prices checks a pint price
- Best train-line pub crawls by verified pint price

Data sources:

- Static article content plus live modules fed by pubs, suburbs, happy-hour status, price snapshots, and verification data.

Internal links:

- Every article should link to at least one pub, one suburb or hub, and one data/guide surface where relevant.

SEO target:

- Long-tail pub/drinking queries where live data improves the answer.

Voice note:

- Use Perthisok's confidence and local specificity as the benchmark. PPP should be dryer, more price-led, and less glossy.

Visual assets:

- Yes. This lane needs real/generated bitmap hero imagery and card imagery. Avoid dark stock-like photos where the reader cannot inspect the place/use case.

Related issues:

- Directly feeds #134, #135, #139, and #140.

## 4. Dependency and Supersession Map

- #27 remains active. This plan supplies where answer-first blocks and visible Q&A should appear.
- #32 remains active. This plan separates existing-page depth from new high-intent landing pages.
- #72 remains active. Pub-page copy still needs string-builder discipline before more modules are added.
- #118 remains active. The proper-pint/glass-size explainer should become an early article and cross-link from Pint Index, pub pages, and FAQs.
- #134 should start after this audit: build article template/content model.
- #135 should follow #134: build `/articles` hub.
- #136, #137, #138 are implementation slices for existing pages.
- #139 should wait until #134 and #135 provide the editorial container.
- #140 should start alongside #134 so article and page-depth impact is measured from day one.

## 5. Priority Order

1. Build `/articles` system and article data model (#134).
2. Build `/articles` hub (#135).
3. Add measurement for article and page-depth surfaces (#140).
4. Publish three starter articles: under-$10 pints, happy hours by day, proper-pint/glass-size explainer (#139).
5. Beef out `/happy-hour` with later-today/day planning states (#136).
6. Beef out `/[suburb]` pages with local price story modules (#137).
7. Beef out pub pages with best-time-to-go and related editorial links (#138).
8. Polish `/discover` and homepage rails with the new editorial cards (#136).

## 6. Acceptance Checklist

- Route-by-route modules are mapped.
- Each route has proposed data sources.
- Each route has internal-link targets.
- Each route has SEO target notes.
- Each route has voice notes.
- Each route flags visual asset needs.
- Dependencies on #27, #32, #72, and #118 are explicit.
