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
- `tiktok.com`
- `instagram.com`
- `x.com`
- Other visible community sources that sent sessions

GA4 exploration definition:

- Exploration type: Free form
- Date range: same as the weekly snapshot
- Rows: `Session source / medium`, then `Landing page + query string`
- Values: `Sessions`, `Engaged sessions`, `Engagement rate`, `Average engagement time per session`, and key event metrics once #28 is configured
- Filter: `Session source` exactly matches or contains the community sources above

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
