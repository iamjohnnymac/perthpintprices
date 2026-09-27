# Site Content Pack v1 — Perth Pint Prices

**Status:** Surface specs / not yet wired. Drafted 2026-05-31 in the recalibrated dry voice.
**Standard:** [docs/brand-voice-brief.md](brand-voice-brief.md) — read it first. Target register: perthisok's dry, specific, deadpan tone. No exclamation marks, slang rationed, the price is the punchline.
**Relationship to other docs:** Pub-page *modules* are owned by [docs/pub-page-content-plan.md](pub-page-content-plan.md) — this doc supplies the **voice strings** for those modules, it does not redefine them. Keyword targets come from [docs/SEO-MASTER.md](SEO-MASTER.md).

## Conventions

- `{slot}` = real data, rendered from Supabase. Never hand-typed, never invented.
- `[bracket]` = illustrative example value, for review only.
- Every line is a **string builder fed by real data** — true for every pub/suburb the moment data lands, or it doesn't render (truthful absence beats a guess).
- Anti-sameness: where a surface repeats across many pages (pub pages, suburb pages), phrasings come from a **small pool seeded by pub/suburb id** so no two pages share a sentence. See pub-page-content-plan §5.

---

## 1. Global

**Default title:** `Perth Pint Prices | Perth's pints, sorted.`
**Default meta description:** `What a pint costs across {venueCount} Perth pubs — checked, dated, and sorted cheapest first.`
**Nav (MobileNav):** `Discover` · `Happy hours` · CTA `Report a price`
**Footer tagline:** `Real pint prices across {venueCount} Perth pubs. Community-powered, est. 2026.`
**404:** `Couldn't find that one. Try the suburbs index, or search for a pub.`
**Install prompt:** `Add Perth Pint Prices to your home screen — the cheapest pint, one tap away.`
**Global CTAs:** `Report a price` (not "Submit") · `Directions` · `See nearby prices` · price-missing hero → `Know the price here? Add it →`

---

## 2. Homepage (`/`)

**H1 (keep):** `Perth's pints, sorted.`
**Subhead:** `What a pint actually costs, across {venueCount} Perth pubs.`
**Meta strip (keep):** `Community-powered · Est. 2026`
**Stat strip labels (keep):** `Venues` · `Suburbs` · `Cheapest`

**How it works (3 steps, in voice):**
1. `Punters and Andrew report what a pint costs.`
2. `We date-stamp every price, so you see how fresh it is.`
3. `You find the cheapest pint near you.`

**Social proof (data-fed, no invented numbers):** `{reportCount} prices reported this month. {verifiedCount} pubs checked in the last 30 days.`

**FAQ (visible Q&A — doubles as AEO; FAQPage rich results retire Jun 2026, so don't bank on a snippet):**
- **How do you know the prices are real?** — `Two ways. Punters report what they paid, and Andrew — a recorded line — rings pubs and asks. Every price shows the date we last checked it. If we haven't confirmed one, we say so.`
- **How often are prices updated?** — `As they come in. Some pubs we check weekly; others rely on punter reports. The date next to each price is the honest answer for that pub.`
- **Is this every pub in Perth?** — `Most of them — {venueCount} and counting. Some don't have a verified price yet; those pages say as much and point you to nearby pubs that do.`
- **What's the cheapest pint in Perth right now?** — `${minPrice} at {minPub} in {suburb}, checked {date}. The figure up top is always the current verified low.`

---

## 3. `/discover` (hub)

*Targets: "perth pub guide", "cheapest pints perth", "cheap drinks perth"*

> **# Where to find a cheap pint in Perth**
>
> We track the price of a pint across **{venueCount}** Perth pubs and check them often enough to be worth trusting. Right now the cheapest verified pint is **${minPrice}** at {minPub}, in {suburb}. The median across the city sits at **${median}**.
>
> This is the practical layer the glossy bar guides skip — not the fit-out or the cocktail list, just what a pint costs, when it's cheaper, and where's cheaper nearby. Prices come from punters reporting in and from Andrew, our recorded line that rings pubs and asks. Each one carries the date we last checked, so you can see how fresh it is.
>
> Start with **tonight's cheapest pints**, filter by **suburb**, or see which pubs have a **happy hour** on now.

---

## 4. `/happy-hour`

*Targets: "perth happy hour deals", "happy hour perth"*

> **# Perth happy hours, on now**
>
> **{liveCount}** Perth pubs have a happy hour running right now, pints from **${minHhPrice}**. We list them live — start, finish, and what the pint actually drops to — so you're not turning up to a board that changed last month.
>
> Happy hours move around. The ones below are the windows we've verified, each showing when we last confirmed it. Sort by what's on now, what starts within the hour, or by price.

---

## 5. `/suburbs` (index)

*Targets: "pint prices by suburb perth", "perth suburbs pubs"*

> **# Pint prices by Perth suburb**
>
> Every suburb we cover, cheapest pint first — **{suburbCount}** suburbs, **{venueCount}** pubs, each price showing when we last checked. {cheapestSuburb} is the cheapest right now at a ${cheapestAvg} average; {dearestSuburb} the dearest at ${dearestAvg}.

---

## 6. `/[suburb]` (suburb page)

*Targets: "best pubs in {suburb}", "cheapest pint in {suburb}", "pubs in {suburb}"*

**Lead block (template):**
> The cheapest pint in **{Suburb}** is **${minPrice}** at {minPub} (checked {date}) — ${delta} under the suburb average of ${avg} across {n} pubs. {dataObservation} Sort by price below, or see what's cheaper nearby in {neighbour1} or {neighbour2}.

`{dataObservation}` is **derived from the strongest real signal, not hand-written** (anti-corny + anti-sameness):
- HH density → `Four have a happy hour on right now.`
- price spread → `Prices run tight here — most sit between ${p25} and ${p75}.`
- thin data → `Only {verifiedN} have a verified price, so this list will grow.`

**Worked examples (illustrative):**
- *Northbridge:* "The cheapest pint in Northbridge is $9 at [The Brisbane] (checked 28 May) — $3 under the suburb average of $12 across 14 pubs. Four have a happy hour on right now. Sort by price below, or see what's cheaper a short walk away in Perth or Highgate."
- *Fremantle:* "The cheapest pint in Fremantle is $10 at [Pub] (checked 27 May) — about a dollar under the Freo average of $11 across 19 pubs. Prices run tight; most sit between $10 and $13. Sort by price, or look north to North Fremantle."

**Suburb meta description:** `Cheapest pint in {Suburb}: ${minPrice} at {minPub}. Average ${avg} across {n} pubs, each with the date we checked.`

---

## 7. `/[suburb]/[pub]` (pub page)

Modules are defined in [pub-page-content-plan.md §2](pub-page-content-plan.md). Below are the **voice strings per module state** that §7 item 8 calls for ("per-state voice templates as string builders, gate before module code").

**H1 / subtitle (conditional on data per plan §5):**
- `{Pub} — pint prices & happy hour` (only when data supports both)
- subtitle folds in the one real `vibeTag`: `{vibeTag} in {Suburb}.`

**Module 1 — Answer block (price + vs-average + freshness):**
```
price, below avg   →  ${price} a pint at {Pub} — ${delta} under the {Suburb} average. Checked {date}.
price, above avg   →  ${price} a pint at {Pub}. That's ${delta} over the {Suburb} average, if you're counting. Checked {date}.
price, at avg      →  ${price} a pint at {Pub} — about the {Suburb} average. Checked {date}.
```

**Module 2 — Best time to go:**
```
HH on now          →  Best time is right now — happy hour runs til {end}, pints at ${hhPrice} (${saving} off the usual).
HH later today     →  Cheapest window today: {start}–{end}, pints drop to ${hhPrice}.
no HH confirmed    →  No happy hour we've confirmed here. The price is the price: ${price}.
```

**Module 3 — Cheaper nearby (geo-radius):**
```
found              →  Cheaper within walking distance: {pub1} (${p1}, {d1} away), {pub2} (${p2}, {d2}).
sparse             →  Nothing cheaper we've verified within {radius}. {Pub} is the local low.
```

**Module 4 — Mini-FAQ (seeded variant pool, renders only at ≥3 real answers):**
| Question (2–3 variants, seeded by pub id) | Answer template |
|---|---|
| "How much is a pint at {Pub}?" / "What's a pint cost at {Pub}?" | `A pint at {Pub} is ${price} as of {date} — ${delta} the {Suburb} average.` |
| "Does {Pub} have a happy hour?" / "When's happy hour at {Pub}?" | `{Pub}'s happy hour runs {days} {start}–{end}, pints down to ${hhPrice}.` *(or)* `No happy hour we've confirmed. {nearbyPub} nearby runs one {days}.` |
| "Anywhere cheaper near {Pub}?" / "Cheaper pint near {Pub}?" | `{cheaperPub}, {distance} away, has a pint at ${price} — ${delta} less.` |

**Module 5 — Verification stub (Tier-C / price-less pages):**
> `No verified price here yet. Last Andrew call: {date | never}. {n} nearby pubs have a checked price — start with {nearestPub} at ${price} →`

**Pub meta description:** `{Pub} pours a ${price} pint ({delta} the {Suburb} average), checked {date}. {hhClause | nearbyCheaperClause}`

---

## 8. Guides (5)

Feature pages under `/guides/*`. Each needs a dry standfirst (the SEO + voice surface); the interactive component supplies the rest.

- **`/guides/beer-weather`** — `# Beer weather in Perth` / `What the forecast says about where to drink. Hot one → beach pubs and beer gardens. Rain → somewhere with a roof and a fireplace. We match today's weather to the pubs that suit it.`
- **`/guides/cozy-corners`** *(URL slug stays; prose is "cosy")* — `# Cosy Perth pubs` / `Low light, a fireplace, a corner you don't have to share. The Perth pubs built for a slow pint when it's cold or wet out.`
- **`/guides/dad-bar`** — `# Perth pubs with a playground` / `Pubs where the kids can run riot and you can still get a pint. Beer gardens, playgrounds, and what a pint costs at each.` *(existing DadBar one-liners are on-voice — keep them.)*
- **`/guides/punt-and-pints`** — `# Pubs for a punt and a pint` / `A TAB, the races on, and a pint that won't clean you out. The Perth pubs that do both.`
- **`/guides/sunset-sippers`** — `# Perth pubs for a sundowner` / `West-facing, a view, and a pint timed to the sunset. Where to be when the sun drops over the Indian Ocean.`

---

## 9. Insights (5)

Data pages under `/insights/*`. Each leads with the headline number.

- **`/insights/pint-index`** — `# The Perth Pint Index` / `The median pint in Perth is ${median} this week. A year ago it was ${medianLastYear}. The Index tracks that number across {venueCount} pubs and updates as prices come in, so it moves with the city rather than with a press release. Below: the spread by suburb, which way prices have moved this quarter, and the pubs still holding the line under $10.`
- **`/insights/pint-of-the-day`** — `# Pint of the day` / `One pub, one price, picked daily for value. Today it's {pub} in {suburb}: ${price}, ${delta} the suburb average, checked {date}.`
- **`/insights/suburb-rankings`** — `# Perth suburbs ranked by pint price` / `Cheapest to dearest, by average verified pint. {cheapestSuburb} leads at ${x}; {dearestSuburb} sits at ${y}. {n} suburbs ranked, each price dated.`
- **`/insights/tonights-best-bets`** — `# Tonight's best bets` / `The cheapest pints and live happy hours, right now. {liveCount} happy hours on, cheapest pint ${x} at {pub}. Updates as the night moves.`
- **`/insights/venue-breakdown`** — `# Perth pubs by the numbers` / `How {venueCount} pubs stack up: the price spread, how many sit under $10, which suburbs run cheap. The data behind the Index.`

---

## 10. Corny-drift fixes (live copy the brief now flags)

In the weather/guide components ([BeerWeather.tsx](../src/components/BeerWeather.tsx), [RainyDay.tsx](../src/components/RainyDay.tsx), [SunsetSippers.tsx](../src/components/SunsetSippers.tsx), [PuntNPints.tsx](../src/components/PuntNPints.tsx)):

| Live (corny) | Fix (dry) |
|---|---|
| `Scorcher! Head to the beach pubs for a cold one` | `Hot one today — head for the beach pubs.` |
| `Mint conditions. Get outside and grab a pint!` | `Good pub weather. Worth getting outside for.` |
| `Cozy up inside with a cold one` | `Rain's in. Good day to be inside with a pint.` |
| `Perfect excuse for a cheeky pint by the window` | `A good excuse for a pint by the window.` |
| `Nothing beats rain on the roof and a cold one in hand` | `Rain on the roof, a pint in hand. Hard to beat.` |

Full sweep + exact line list to be confirmed against the components during build.

---

## Acceptance (per surface)

A surface is "done" when: (1) copy renders from real data slots (no invented values, truthful absence handled); (2) it passes the brief's 7-question Voice Test, especially Q7 (read aloud — dry, not a brand trying to be fun); (3) AU spelling clean; (4) repeated surfaces draw phrasing from a seeded pool (no identical sentences across pages); (5) title <60 chars, meta description <160, canonical + OG present (SEO-MASTER rules).
