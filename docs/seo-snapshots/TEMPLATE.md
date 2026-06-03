# Weekly SEO Snapshot - YYYY-MM-DD

Use this template for issue #36's Monday SEO snapshot. Replace the placeholder values, keep zero-session rows out of the AI and community callouts, and link the saved GA4 explorations where possible.

## Summary

- Date range:
- Snapshot owner:
- GSC property: `sc-domain:perthpintprices.com`
- GA4 property: `Perth Pint Prices` (`G-1WN68Q85SY`)
- Headline movement:
- Actions for next week:

## Search Console

### Performance

| Metric | This period | Previous period | Change |
|---|---:|---:|---:|
| Clicks |  |  |  |
| Impressions |  |  |  |
| CTR |  |  |  |
| Average position |  |  |  |

### Top Queries

| Query | Clicks | Impressions | CTR | Average position | Note |
|---|---:|---:|---:|---:|---|
|  |  |  |  |  |  |

### Top Landing Pages

| Page | Clicks | Impressions | CTR | Average position | Note |
|---|---:|---:|---:|---:|---|
|  |  |  |  |  |  |

### Indexing Watch

- New crawl/indexing errors:
- Pages still "Discovered, currently not indexed":
- Sitemap status:

## GA4 Traffic Acquisition

Traffic acquisition should use these dimensions:

- `Session source`
- `Session medium`
- `Session source / medium`
- `Session default channel grouping`
- Landing page dimension: `Landing page + query string`
- Key event metrics by channel once issue #28 is configured

### Channel Mix

| Channel | Sessions | Engaged sessions | Engagement rate | Average engagement time | Key events |
|---|---:|---:|---:|---:|---:|
| Organic Search |  |  |  |  |  |
| Direct |  |  |  |  |  |
| Referral |  |  |  |  |  |
| Organic Social |  |  |  |  |  |
| Unassigned |  |  |  |  |  |

### Search Sources

Use `Session source` or `Session source / medium` to split Google, Bing, and DuckDuckGo. DuckDuckGo should be called out separately from Google/Bing where GA4 exposes it.

| Source / medium | Sessions | Engaged sessions | Engagement rate | Landing pages | Key events |
|---|---:|---:|---:|---|---:|
| google / organic |  |  |  |  |  |
| bing / organic |  |  |  |  |  |
| duckduckgo / organic |  |  |  |  |  |

## Editorial & Page-Depth Measurement

Use this section for the article system and beefed-out pub/suburb pages. The first baseline should be captured within one week of publishing a new article batch, then compared weekly.

### Editorial URL Baseline

| URL | GSC clicks | GSC impressions | CTR | Average position | Indexed status | Note |
|---|---:|---:|---:|---:|---|---|
| `/articles` |  |  |  |  |  |  |
| `/articles/pints-under-10-perth` |  |  |  |  |  |  |
| `/articles/perth-happy-hours-by-day` |  |  |  |  |  |  |
| `/articles/proper-pint-schooner-middy-perth` |  |  |  |  |  |  |

### Editorial Engagement

Use GA4 pages + screens for page engagement, then the events below for internal movement and report-price intent.

| Surface | Sessions | Engaged sessions | Avg engagement time | `article_click` | `article_internal_click` | `article_pub_click` | `report_price_click` | Note |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| `/articles` |  |  |  |  |  |  |  |  |
| Article detail pages |  |  |  |  |  |  |  |  |
| Pub pages |  |  |  |  |  |  |  |  |
| Suburb pages |  |  |  |  |  |  |  |  |

### Pub-Page Engagement

| Surface | `report_price_click` | `pub_nearby_click` | `pub_external_click` | `pub_internal_click` | Note |
|---|---:|---:|---:|---:|---|
| Priced pub pages |  |  |  |  |  |
| Tier-C pub pages |  |  |  |  |  |
| Pub pages from article clicks |  |  |  |  |  |

Tracked event names:

- `article_click`: card/link clicks into article detail pages from hubs and rails.
- `article_hub_click`: clicks back to `/articles`.
- `article_internal_click`: article related-link clicks to non-pub site pages.
- `article_pub_click`: article live-module clicks into pub pages.
- `report_price_click`: report-price CTA clicks from article, home, and pub surfaces.
- `report_price_open`: form auto-opens from `?submit=1`, useful for direct/shared article CTAs.
- `pub_nearby_click`: pub-page nearby-price clicks, including Tier-C nearest checked pub links.
- `pub_external_click`: pub-page website and directions clicks.
- `pub_internal_click`: pub-page clicks to non-pub site pages such as suburb pages.

### Thin-Content Watch

- Article URLs with impressions but weak engagement:
- Pub/suburb pages gaining impressions after page-depth work:
- Pages to rewrite, noindex, or consolidate:

## AI-Referral Callouts

Report every AI/search-assistant source with more than 0 sessions. If none are present, write `None observed this period`.

Source matching:

- `chatgpt.com`
- `perplexity.ai`
- `copilot.microsoft.com`
- `bing.com` when the landing context indicates Copilot or AI search
- Any other AI referrer GA4 exposes

GA4 exploration definition:

- Exploration type: Free form
- Date range: same as the weekly snapshot
- Rows: `Session source / medium`, then `Landing page + query string`
- Values: `Sessions`, `Engaged sessions`, `Engagement rate`, `Average engagement time per session`, and key event metrics once #28 is configured
- Filter: `Session source` exactly matches or contains the AI sources above

| Source / medium | Sessions | Engaged sessions | Engagement rate | Top landing pages | Key events | Notes |
|---|---:|---:|---:|---|---:|---|
|  |  |  |  |  |  |  |

## Community-Referral Callouts

Report every community/social source with more than 0 sessions. If none are present, write `None observed this period`.

Source matching:

- `reddit.com`
- `old.reddit.com`
- `reddit`
- `old-reddit`
- `tiktok.com`
- `tiktok`
- `instagram.com`
- `instagram`
- `x.com`
- `x`
- Other visible community sources that sent sessions

GA4 exploration definition:

- Exploration type: Free form
- Date range: same as the weekly snapshot
- Rows: `Session source / medium`, then `Landing page + query string`
- Values: `Sessions`, `Engaged sessions`, `Engagement rate`, `Average engagement time per session`, and key event metrics once #28 is configured
- Filter: `Session source` exactly matches or contains the community sources above, including both referrer domains and the matching UTM `utm_source` values

| Source / medium | Sessions | Engaged sessions | Engagement rate | Top landing pages | Key events | Notes |
|---|---:|---:|---:|---|---:|---|
|  |  |  |  |  |  |  |

## UTM Convention

Use lowercase kebab-case values. Do not add UTMs to internal links.

Required parameters:

- `utm_source`: platform or outlet, for example `reddit`, `old-reddit`, `tiktok`, `instagram`, `x`, `perthnow`, `watoday`, `6pr`
- `utm_medium`: channel type, for example `community`, `organic-social`, or `pr-outreach`
- `utm_campaign`: campaign name in `yyyy-mm-topic` format, for example `2026-06-pint-index-pr`
- `utm_content`: post, placement, or pitch variant, for example `r-perth-comment-1`, `journalist-email-a`, `bio-link`
- `utm_term`: optional query, audience, or suburb tag; leave blank unless it adds analysis value

Examples:

- Reddit comment: `?utm_source=reddit&utm_medium=community&utm_campaign=2026-06-pint-index&utm_content=r-perth-comment-1`
- Instagram bio/link sticker: `?utm_source=instagram&utm_medium=organic-social&utm_campaign=2026-06-pint-index&utm_content=story-link-1`
- PR outreach link: `?utm_source=watoday&utm_medium=pr-outreach&utm_campaign=2026-06-pint-index-pr&utm_content=journalist-email-a`

## Decisions

- Keep doing:
- Stop doing:
- Test next:
