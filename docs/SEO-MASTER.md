# SEO Master Reference — Arvo (perthpintprices.com)

Last updated: 2026-03-08

This is the SEO playbook for Arvo. Reference this document before making any SEO-related changes. All best practices sourced from Backlinko (backlinko.com) unless noted otherwise.

---

## 1. Current implementation

### Sitemap (`src/app/sitemap.ts`)

Dynamic XML sitemap with tiered priorities:

| Priority | Routes |
|----------|--------|
| 1.0 | Homepage |
| 0.9 | discover, insights, guides, happy-hour, pub-golf, pint-crawl |
| 0.8 | pint-of-the-day, pint-index, tonights-best-bets, beer-weather, sunset-sippers, suburb pages |
| 0.7 | suburb-rankings, venue-breakdown, punt-and-pints, dad-bar, cozy-corners |
| 0.6 | leaderboard, individual pub pages |

All entries use current timestamp for `lastModified`. Dynamic routes (pubs, suburbs) generated from Supabase at build time.

### Robots (`src/app/robots.ts`)

```
User-Agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Sitemap: https://perthpintprices.com/sitemap.xml
```

### Global metadata (`src/app/layout.tsx`)

- **metadataBase**: `https://perthpintprices.com`
- **Title**: "Arvo | Perth's pint prices, sorted."
- **Description**: Dynamic — pulls venue count, suburb count from database
- **Keywords**: Perth, pint prices, beer, pubs, happy hour, Western Australia, cheap drinks, Arvo
- **OG image**: Static `/og-image.png` (1200x630) — shared across all pages
- **Twitter card**: `summary_large_image` on homepage, `summary` on detail pages
- **Locale**: `en_AU`
- **Theme color**: `#FDF8F0`
- **Analytics**: Google Analytics `G-1WN68Q85SY`

### Per-page metadata

Every page has: title, description, canonical URL, Open Graph tags. All set via Next.js `metadata` exports or `generateMetadata()` for dynamic pages.

### JSON-LD structured data

| Page | Schema types |
|------|-------------|
| Homepage | WebSite |
| Pub detail (`/pub/[slug]`) | BreadcrumbList + BarOrPub (address, geo, priceRange) |
| Suburb detail (`/suburb/[slug]`) | BreadcrumbList + ItemList (all pubs ranked by price) |
| All content pages | BreadcrumbList (via `BreadcrumbJsonLd` component) |

### ISR (Incremental Static Regeneration)

| Revalidation | Pages |
|-------------|-------|
| 300s (5 min) | Homepage, pub pages, suburb pages, suburbs list |
| 3600s (1 hr) | Weekly report, pub golf, pint crawl |

### Static pre-generation

- **Pub pages**: All slugs pre-built via `generateStaticParams()`
- **Suburb pages**: Top 15 suburbs pre-built (northbridge, fremantle, perth, subiaco, leederville, mount-lawley, victoria-park, scarborough, joondalup, mandurah, cottesloe, claremont, east-perth, south-perth, midland). Others generated on-demand via `dynamicParams: true`

### Canonical URLs

Set on every page via `alternates: { canonical: '...' }`. Format: `https://perthpintprices.com/[path]`

---

## 2. Audit findings

### High priority

| Issue | Impact | Fix |
|-------|--------|-----|
| No dynamic OG images | Social sharing shows generic image for every page. Kills click-through from Facebook, Reddit, Twitter | Build `opengraph-image.tsx` for `/pub/[slug]` and `/suburb/[slug]` showing pub name, price, suburb |
| No `next/image` usage | No WebP conversion, no responsive sizing, no lazy loading. Hurts Core Web Vitals (LCP) | Migrate map tile images and any other images to `next/image` |
| No content targeting informational keywords | We only rank for navigational queries. Missing all "cheapest pints perth", "perth happy hour" traffic | Create SEO landing pages (see keyword targets below) |
| FAQ section missing FAQPage schema | Homepage FAQ exists but isn't marked up. Missing rich snippet opportunity in search results | Add `FAQPage` JSON-LD to homepage FAQ component |

### Medium priority

| Issue | Impact | Fix |
|-------|--------|-----|
| Some page titles >60 chars | Get truncated in Google search results | Trim titles: "Perth Suburb Pint Price Rankings: Cheapest Suburbs for Beer \| Arvo" is 67 chars |
| No Google Business Profile | Missing from local search entirely | Create GBP as "service area business" — free, high impact |
| /guides and /insights redirect to /discover | If these are 302s (not 301s), link equity doesn't pass | Verify they're 301 redirects |
| No internal search logging | Don't know what users search for on the site | Log filter/search queries to understand demand |

### Low priority

| Issue | Impact | Fix |
|-------|--------|-----|
| Uniform title pattern (X: Y \| Arvo) | Every page uses identical structure — looks templated | Vary a few titles (drop subtitle on some, use dash instead of colon) |
| Single static OG image for all pages | Less impactful than dynamic images but worth noting | Addressed by dynamic OG images above |

---

## 3. Keyword targets

### Primary keywords (create or optimise pages for these)

| Keyword | Search intent | Suggested page | Priority | Status |
|---------|--------------|----------------|----------|--------|
| cheapest pints in perth | Transactional | Dedicated landing page or enhanced homepage | High | Not started |
| perth happy hour deals | Transactional | `/happy-hour` — needs more text content | High | Page exists, needs content |
| best pubs in northbridge | Local + informational | `/suburb/northbridge` — needs editorial content | High | Page exists, needs content |
| best pubs in fremantle | Local + informational | `/suburb/fremantle` — needs editorial content | High | Page exists, needs content |
| perth beer prices | Informational | `/insights/pint-index` — needs intro text | Medium | Page exists, needs content |
| pub crawl perth | Transactional | `/pint-crawl` — needs intro text about popular routes | Medium | Page exists, needs content |
| cheap drinks perth | Transactional | Broader version of cheapest pints page | Medium | Not started |
| perth pub guide | Informational | `/discover` — needs intro paragraph | Medium | Page exists, needs content |
| best pubs in scarborough | Local | `/suburb/scarborough` — needs editorial | Medium | Page exists, needs content |
| best pubs in cottesloe | Local | `/suburb/cottesloe` — needs editorial | Medium | Page exists, needs content |
| best pubs in subiaco | Local | `/suburb/subiaco` — needs editorial | Medium | Page exists, needs content |
| best pubs in leederville | Local | `/suburb/leederville` — needs editorial | Medium | Page exists, needs content |
| perth beer garden | Informational | `/guides/beer-weather` or new page | Low | Partial |

### Keyword research process (Backlinko)

1. Start with seed keywords from your niche ("perth pints", "cheap beer perth")
2. Evaluate search intent by checking what currently ranks (are results lists? guides? tools?)
3. Pick keywords where your data gives you an unfair advantage (real-time prices beat static blog posts)
4. Target long-tail variations: "cheapest pint in northbridge right now" vs "cheap beer perth"
5. Match content format to intent: transactional = prices/CTAs, informational = depth/guides

Source: backlinko.com/keyword-research

---

## 4. Content strategy

### The Skyscraper Technique (Backlinko)

Our biggest advantage: **real-time, verified data**. Most competing content for "cheapest pints perth" is:
- Blog posts from 2023-2024 (stale)
- Timeout/Broadsheet listicles (5-10 pubs, no prices)
- Reddit threads (anecdotal, outdated)

**Our play:**
1. Google each target keyword
2. Analyse what currently ranks and who links to it
3. Create a better version using our live data (300+ venues, real prices, updated weekly)
4. Reach out to anyone linking to the inferior content

Source: backlinko.com/skyscraper-technique

### Content types to create

**Evergreen pages (update automatically from database):**
- "Cheapest pints in Perth" — ranked list, auto-updated from Supabase
- "Perth happy hour deals this week" — filtered view of happy hour data
- Suburb guides: "Best pubs in Northbridge" with prices, descriptions, map

**Editorial content (manual, periodic):**
- "Perth Pint Report" — weekly email/page with price movements
- "Beer price trends in Perth" — quarterly analysis of Pint Index data
- Suburb spotlights — deep dives on specific areas

### On-page content rules (Backlinko)

- Every data-heavy page needs at least 200-300 words of intro text for Google to understand context
- Target 1,500+ words on competitive keyword pages
- Use target keyword in: title tag, H1, first 100 words, URL slug
- Use related keywords naturally throughout (LSI keywords)
- Internal link to related pages using descriptive anchor text
- Break content with H2/H3 subheadings containing keyword variations
- Add alt text to all images with relevant keywords

Source: backlinko.com/on-page-seo

### Search intent matching (Backlinko)

| Intent type | What user wants | Our content format |
|-------------|----------------|-------------------|
| Transactional | Find a cheap pint NOW | Price tables, live data, "near me" filters, CTAs |
| Informational | Learn about Perth pub scene | Guides, suburb profiles, trend analysis |
| Local | Find pubs in a specific area | Suburb pages with maps, directions, prices |
| Navigational | Find Arvo specifically | Homepage — already covered |

Always check what Google currently shows for your target keyword. If page-1 results are all lists, create a list. If they're guides, create a guide. Don't fight the intent.

Source: backlinko.com/hub/seo/search-intent

---

## 5. Link building playbook

### Tier 1: Local media (highest value, do first)

| Target | Angle | Contact method |
|--------|-------|---------------|
| Perth Now | "New site tracks every pint price in Perth — here's the data" | Newsroom email / journalist DM |
| WAtoday | Same angle, focus on price trends | Newsroom email |
| The West Australian | "The Perth Pint Index shows beer prices rose X% this year" | Newsroom email |
| 6PR / Nova93.7 | Radio segment: "Where to find Perth's cheapest pint" | Station email / social DM |

**Why this works:** Journalists love data stories. You have unique data nobody else has. A single Perth Now link is worth more than 50 directory listings.

### Tier 2: Community (free, builds audience)

| Target | Action |
|--------|--------|
| r/perth | Post: "I built a site that tracks every pint price in Perth. Here's the data." Don't be salesy. |
| r/australia | If r/perth does well, cross-post with Perth context |
| Perth Facebook groups | Share in "Perth Foodies", "What's on in Perth", "Perth Social" |
| Product Hunt | Launch as a product — "Arvo: Perth's pint prices, sorted" |

### Tier 3: Local directories and citations (NAP consistency)

List Arvo on these as a "service area business" with consistent name/URL:
- True Local
- Yelp AU
- Hotfrog
- Yellow Pages AU
- StartLocal
- Aussie Web

**NAP consistency** (Backlinko local SEO): Name, Address, Phone must be identical across every listing. For a web-only business, use consistent name + URL everywhere.

Source: backlinko.com/local-seo-guide

### Tier 4: Niche outreach

| Target | Angle |
|--------|-------|
| UWA Pelican / Curtin Crib | "Cheapest pints near campus — we have the data" |
| Perth food/drink bloggers | Personalised email showing data for their suburb |
| Hostel/backpacker sites | "Where to find cheap pints in Perth" — perfect for backpacker audience |
| Tourism WA resource pages | "Things to do in Perth" — suggest adding Arvo as a resource |
| Event sites (Eventbrite, Meetup) | Sponsor or feature in pub crawl events |

### Tier 5: Resource page link building

1. Google: `"things to do in Perth" inurl:resources` or `"Perth links" inurl:links`
2. Find pages that list Perth resources, tools, or guides
3. Email the site owner: "Hey, I noticed your Perth resources page. We built perthpintprices.com — real-time pint prices across 300+ venues. Might be useful for your readers."

Source: backlinko.com/link-building

---

## 6. Technical SEO checklist

### Done

- [x] Dynamic XML sitemap with priority tiers
- [x] robots.txt (blocks /admin, /api/)
- [x] Canonical URLs on all pages
- [x] JSON-LD: WebSite, BarOrPub, ItemList, BreadcrumbList
- [x] Open Graph tags on all pages
- [x] Twitter Card tags
- [x] ISR with appropriate revalidation periods
- [x] Static pre-generation for pub and suburb pages
- [x] Clean URL structure (kebab-case, semantic)
- [x] Proper heading hierarchy (H1 → H2 → H3)
- [x] ARIA labels and sr-only text for accessibility
- [x] Google Analytics installed
- [x] PWA manifest configured
- [x] HTTPS enabled
- [x] Mobile-responsive design
- [x] Humanizer audit complete (AI text patterns removed from copy)

### To do

- [ ] **Dynamic OG images** for pub and suburb pages
- [ ] **next/image migration** for all images
- [ ] **FAQPage schema** on homepage FAQ section
- [ ] **Google Business Profile** setup
- [ ] **Google Search Console** — submit sitemap, monitor indexation
- [ ] **Core Web Vitals audit** — measure LCP, FID, CLS
- [ ] **301 redirect verification** for /guides → /discover and /insights → /discover
- [ ] **Title tag audit** — trim any over 60 characters
- [ ] **Internal search logging** — capture user filter/search queries
- [ ] **FAQ schema** on guide pages with Q&A content
- [ ] **LocalBusiness schema** — consider for featured/partner venues
- [ ] **Intro text** on data-heavy pages (Discover, Happy Hour, Suburbs list)

### Technical SEO principles (Backlinko)

- **Crawlability**: Make sure Google can find and crawl all important pages. Sitemap + internal links are your two tools. Block what shouldn't be indexed (admin, API).
- **Indexation**: Monitor Search Console for "Excluded" pages. Fix "Discovered — currently not indexed" issues by adding internal links and content.
- **Site speed**: Core Web Vitals matter. LCP < 2.5s, FID < 100ms, CLS < 0.1. Use next/image, compress assets, minimise third-party scripts.
- **Mobile-first**: Google indexes mobile version first. Test all pages on mobile. Touch targets > 48px.
- **Structured data**: Use schema.org markup for rich snippets. Test with Google Rich Results Test.
- **Canonical tags**: One canonical per page. Prevents duplicate content issues.
- **Internal linking**: Every important page should be reachable in 3 clicks from homepage. Use descriptive anchor text.

Source: backlinko.com/technical-seo-guide

---

## 7. Ongoing maintenance

### Weekly

- [ ] Check Google Search Console for crawl errors and indexation issues
- [ ] Review "Performance" report for keyword impressions and clicks
- [ ] Check for any new "Page experience" warnings
- [ ] Verify sitemap is being crawled (check "Sitemaps" report)

### Monthly

- [ ] Review keyword rankings for target keywords
- [ ] Check backlink profile (new links, lost links)
- [ ] Update any stale content or outdated prices
- [ ] Review Core Web Vitals scores
- [ ] Check competitor content for target keywords — have they published anything new?

### Quarterly

- [ ] Full technical SEO audit (crawl errors, broken links, redirect chains)
- [ ] Update structured data if schema.org specs change
- [ ] Review and update keyword targets based on Search Console data
- [ ] Audit page titles and descriptions for click-through rate
- [ ] Review internal linking structure

---

## 8. Backlinko reference summary

### On-page SEO (backlinko.com/on-page-seo)

- Title tags: under 60 chars, include primary keyword, front-load important words
- Meta descriptions: under 160 chars, include keyword, write for click-through
- H1: one per page, include target keyword naturally
- Content: comprehensive, addresses search intent fully, 1,500+ words for competitive topics
- Internal links: descriptive anchor text, link related content, build topical clusters
- URLs: clean, keyword-containing, hyphen-separated
- Images: descriptive alt text, compressed, relevant filenames

### Local SEO (backlinko.com/local-seo-guide)

- Google Business Profile is #1 factor for local visibility
- NAP consistency across all citations (Name, Address, Phone/URL)
- Location-specific keywords in titles and headers
- Local schema markup (LocalBusiness, BarOrPub)
- Encourage and respond to reviews
- Create location-specific landing pages
- Build local backlinks from community organisations and news

### Technical SEO (backlinko.com/technical-seo-guide)

- Site speed: optimise images, minimise JS, use caching
- Mobile-first: responsive design, touch-friendly, fast mobile load
- Crawlability: XML sitemap, clean robots.txt, internal linking
- Structured data: schema.org markup for rich results
- HTTPS: security signal, required for modern SEO
- Core Web Vitals: LCP, FID, CLS — measure and optimise

### Content marketing (backlinko.com/content-marketing-strategy)

- Create content worth linking to (data, original research, comprehensive guides)
- Linkable assets: statistics, frameworks, tools, calculators
- Promote content through targeted outreach
- Build topical authority through consistent coverage
- Demonstrate expertise with detailed, actionable information

### Link building (backlinko.com/link-building, backlinko.com/skyscraper-technique)

- Skyscraper Technique: find linked content, make better version, outreach
- Build relationships before asking for links
- Focus on relevance over volume
- Local links (news, community, directories) are most valuable for local sites
- Resource page outreach: find "resources" or "links" pages in your niche
- Create data-driven content that earns natural links

### Search intent (backlinko.com/hub/seo/search-intent)

- Match content format to what Google already shows for that keyword
- Transactional intent: prices, comparisons, CTAs
- Informational intent: guides, explanations, depth
- Navigational intent: brand pages
- Study top-ranking pages to understand what Google thinks users want

---

## Key files

| File | Purpose |
|------|---------|
| `src/app/sitemap.ts` | Dynamic XML sitemap |
| `src/app/robots.ts` | Robots.txt configuration |
| `src/app/layout.tsx` | Global metadata, OG image, analytics |
| `src/app/page.tsx` | Homepage metadata + WebSite JSON-LD |
| `src/app/pub/[slug]/page.tsx` | Pub detail metadata + BarOrPub JSON-LD |
| `src/app/suburb/[slug]/page.tsx` | Suburb metadata + ItemList JSON-LD |
| `src/components/BreadcrumbJsonLd.tsx` | Reusable breadcrumb schema component |
| `src/components/FAQ.tsx` | Homepage FAQ (needs FAQPage schema) |
| `public/og-image.png` | Static OG image (1200x630) |
| `public/manifest.json` | PWA manifest |
| `docs/SEO-MASTER.md` | This file |
