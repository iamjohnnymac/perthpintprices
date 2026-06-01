# Community + Reddit Discovery Loop

Status: issue #115 implementation plan, drafted 2026-06-01
Owner: Perth Pint Prices
Scope: Reddit/community discovery, not paid ads or synthetic mention-building

## Operating Rule

Use Reddit as a place to answer Perth pub-price questions with useful data, not as a place to plant mentions. Every reply or post must pass this check:

- It answers the thread in front of us.
- It says who we are when linking to Perth Pint Prices.
- It includes useful numbers in the comment itself, so the link is optional.
- It follows the community rules and the mood of the thread.
- It is posted from a real account, not a bought, aged, borrowed, or throwaway account.

Do not use inauthentic mention seeding, aged-account boosting, sockpuppets, vote manipulation, repeated cross-posting, unsolicited DMs, undisclosed promotion, or link-only replies.

Reddit's spam guidance warns against repeated or unsolicited mass engagement and says to be careful when contributions are mostly links to a business you run or benefit from. Reddit Pro's organic playbook points in the same direction: listen first, review community rules, add value in comments before posting, disclose the person behind the account, and get moderator blessing before making a community post.

Sources:

- [Reddit Help: Spam](https://support.reddithelp.com/hc/en-us/articles/360043504051-Spam)
- [Reddit Pro's Guide to Organic Engagement for Businesses](https://redditinc.com/hubfs/Reddit%20Inc/Content/Reddit%20Pros%20organic%20playbook.pdf)

## First Targets

These are the first 10 places to monitor, mine for content questions, or answer only when a current conversation clearly asks for the data. Older threads are mostly research inputs. Do not revive old threads just to drop a link.

| Priority | Thread / community | Why it matters | Self-promo norm to apply |
|---:|---|---|---|
| 1 | [r/perth: Pint Price tracker, would anyone be interested?](https://www.reddit.com/r/perth/comments/1tfoabs/pint_price_tracker_would_anyone_be_interested/) | Direct 2026 demand for a Perth pint-price map. Comments mention walking distance, shock prices, beer availability, and keeping data updated. | Best fit for a transparent reply if the thread is still active. Say "I run Perth Pint Prices"; give the current median, venue count, and missing-price caveat in the comment. Link once, only after the useful answer. |
| 2 | [r/perth: Any bars/pubs that sell cheap pints nowadays?](https://www.reddit.com/r/perth/comments/1nvo9mn/any_bars_pubs_that_sell_cheap_pints_nowadays/) | NOR cheap-pint demand, bowls clubs, $8-$10 mentions, happy-hour alternatives. | Old enough to mine, not revive. For future similar threads, answer with 3-5 current venue prices and a disclosure if linking. |
| 3 | [r/perth: $16 pint price-shock thread](https://www.reddit.com/r/perth/comments/1bk0dha) | Price shock, excise, bowls-club recommendations, and exact-price comments. | Treat as research. If a new price-shock thread appears, lead with data and context, not "use our site". |
| 4 | [r/perth: Where are the cheapest pints in the city?](https://www.reddit.com/r/perth/comments/1bku22j) | CBD-specific cheap-pint demand, after-3pm use case, happy-hour vs all-day price split. | Mine for `/cheapest-pints` and CBD landing-page copy. In future CBD threads, reply with exact current CBD rows and note freshness. |
| 5 | [r/perth: Best happy hour recommendations?](https://www.reddit.com/r/perth/comments/1ee95g2) | Happy-hour discovery demand, including low-price beer and non-beer specials. | Mine for day/time questions. In future threads, link `/happy-hour` only if the comment already includes current active/next-up examples. |
| 6 | [r/perth: Friday Happy Hour bar recommendations?](https://www.reddit.com/r/perth/comments/10anw4a) | Day-specific happy-hour demand. Good input for `/happy-hour/[day]`. | Old research only. Do not reply unless a fresh Friday happy-hour thread appears. |
| 7 | [r/perth: Schooners only, what is going on?](https://www.reddit.com/r/perth/comments/1oqmsw7) | Pint vs schooner value, shrinkflation, price per ml, Perth norms. | Answer future versions with maths first: pint 570ml, schooner 425ml, price-per-ml examples. Link only as a source for live pint rows. |
| 8 | [r/perth: We built a Guinness rating guide for Perth](https://www.reddit.com/r/perth/comments/1ses1qr/we_built_a_guinness_rating_guide_for_perth_wheres/) | Community-built pub-guide precedent. A commenter explicitly asks for price data. | Respect the other builder's thread. If engaging, add a helpful price note where asked, disclose PPP, and avoid redirecting the conversation away from their guide. |
| 9 | [r/perth: Gastro pub recommendations](https://www.reddit.com/r/perth/comments/1m10xwa) | Pub recommendations plus weeknight specials, good for pub-type landing-page questions. | Mine for content backlog. Reply in future only when price/happy-hour data improves the recommendation. |
| 10 | [r/perth: English pub in Perth with menu classics](https://www.reddit.com/r/perth/comments/1t69afq/english_pub_in_perth_with_menu_classics/) | Central pub style and menu-classic demand, adjacent to "proper pub" / pint questions. | Mine for guide ideas. If replying to fresh variants, be transparent that PPP tracks prices, not food quality. |

Lower-priority national thread to watch: [r/australian: What's the morally correct price for a pint?](https://dd.reddit.com/r/australian/comments/1bbryqp/whats_the_morally_correct_price_for_a_pint/). Use only when Perth data genuinely answers the national price question.

## First Pint Index Community Post Draft

Use this only after checking r/perth rules and, ideally, asking moderators if a weekly or fortnightly data post is welcome. Fill every bracket with live data from the Pint Index on the morning of posting. If the numbers are not ready, do not post.

Title:

```text
Perth Pint Index: [median] is the median pint this week
```

Body:

```text
I run Perth Pint Prices, so this is not me pretending to be a neutral passer-by.

This week's median verified pint is [median] across [priced venue count] Perth pubs. The cheapest checked pint we have is [price] at [pub] in [suburb], last verified [date]. [Count] pubs are still under $10, which feels rarer than it should, but the numbers are what they are.

A few notes before anyone quite reasonably asks:

- A pint means 570ml. Schooners are a different fight.
- TBC venues are not included in the median.
- Prices come from community reports, menu checks, and calls to pubs. If we cannot verify it, it stays out.
- If your local is wrong or missing, tell me in the comments and I will fix/check it.

Useful bits from this week's data:

- Cheapest suburb in the current set: [suburb] at [average]
- Dearest suburb in the current set: [suburb] at [average]
- Biggest "still reasonable" cluster: [suburb or area], with [count] checked pubs at or under [price]
- Happy-hour note: [one current or upcoming happy-hour stat, or "not enough clean happy-hour data this week"]

Link, with disclosure because it is my site: [Pint Index URL with UTM]

If this is useful, I can post a short monthly version here. If it is not, fair enough. Perth has survived worse.
```

No-link fallback if mods prefer no links:

```text
Happy to keep the numbers in-thread and skip the link. The short version this week: median [median], cheapest checked [price] at [pub], [count] pubs under $10, TBC venues excluded.
```

## #27 / #32 Content Backlog Questions

Add these Reddit-sourced questions to the answer-first and landing-page backlog. They map to #27 when they are visible Q&A blocks on existing pages, and #32 when they justify new landing pages.

| Source | User question to answer | Backlog target |
|---|---|---|
| r/perth pint tracker thread | "Is there a Perth site that shows pint prices on a map?" | #27 homepage/discover Q&A: explain the map, coverage, freshness, and missing-price caveat. |
| r/perth cheap pints thread | "Where can I find cheap pints near me, especially NOR?" | #32 `/cheapest-pints` plus suburb sections for NOR/SOR where data is strong enough. |
| r/perth cheapest city pints thread | "Where are the cheapest CBD pints after 3pm, not just happy hour?" | #32 CBD/Perth city cheap-pints section or landing page. |
| r/perth happy-hour threads | "Which pubs have Friday or day-specific happy hours?" | #32 `/happy-hour/[day]` pages and #27 FAQ on how live/starting-soon happy hours are calculated. |
| r/perth schooners-only thread | "Are schooners worse value than pints?" | #27 pint vs schooner answer block on Pint Index and #32 `how much is a pint in Perth` page. |
| r/perth Guinness guide thread | "Can pub guides include the price of the pint too?" | #27 pub-page Q&A and #32 guide/insight copy: price as the missing layer on taste/recommendation guides. |
| r/perth airport beer prices thread | "How much worse are airport beer prices than normal Perth pubs?" | #32 airport/stadium/transport-hub landing page if enough verified rows exist; otherwise hold as research. |
| r/australian morally correct pint thread | "What is a fair price for a pint in Australia, and where does Perth sit?" | #27 Pint Index Q&A: median Perth pint, cheap/dear bands, and why TBC venues are excluded. |

## Referral Tracking Plan

Use the existing weekly SEO snapshot template in `docs/seo-snapshots/TEMPLATE.md` and keep Reddit separate from other social/community sources.

Source matching must include:

- `reddit.com`
- `old.reddit.com`
- `reddit`
- `old-reddit`

UTM convention:

- `utm_source=reddit` for normal Reddit links
- `utm_source=old-reddit` only when a link is intentionally posted from old Reddit and GA4 needs that distinction
- `utm_medium=community`
- `utm_campaign=2026-06-pint-index`
- `utm_content=r-perth-post-1`, `r-perth-comment-pint-tracker`, or another placement-specific value

Example:

```text
https://perthpintprices.com/insights/pint-index?utm_source=reddit&utm_medium=community&utm_campaign=2026-06-pint-index&utm_content=r-perth-post-1
```

Weekly check:

1. In GA4, report `Session source / medium` and `Landing page + query string`.
2. Call out any Reddit source with more than 0 sessions.
3. Split organic referrers (`reddit.com`, `old.reddit.com`) from tagged campaign sessions (`reddit / community`, `old-reddit / community`) when both appear.
4. Record engaged sessions, engagement rate, average engagement time, and key events once #28 is configured.
5. Note which Reddit thread or post the traffic came from, using `utm_content` where available.

## Cadence

- Daily for 10 minutes: search Reddit for "Perth pint", "cheap pints Perth", "happy hour Perth", "schooner Perth", "Guinness Perth", and relevant suburb names.
- Weekly: add one or two Reddit questions to the #27/#32 backlog if they show repeated demand.
- Fortnightly or monthly: publish a Pint Index community post only if r/perth mods are comfortable with it and the prior post earned useful discussion.
- Always: reply to comments if people correct data, ask for a suburb, or report a price. Leaving corrections hanging is how a data site gets stale in public.

## Stop Conditions

Stop posting or linking if:

- Mods ask for fewer links or no links.
- Comments turn into promotion rather than answers.
- The same link would be posted twice in a short period.
- The data needed to answer the thread is stale, missing, or unverified.
- A reply would mostly benefit PPP and not the person asking.
