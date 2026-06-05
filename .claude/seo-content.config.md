# seo-content — project config

Written by the `seo-content` skill's `init`. Read by every mode. Keep it committed — it's the project's SEO contract.

```yaml
project:
  name: Perth Pint Prices
  framework: Next.js 14 (App Router)
  render_mode: hybrid          # SSG for Tier-A pubs (generateStaticParams) + ISR (revalidate 3600) + dynamicParams for Tier-B; all server-rendered HTML → crawlable ✓ (verified via curl)
  language: en-AU
  primary_domain: https://perthpintprices.com

data_layer:
  provider: ahrefs-mcp
  ahrefs_project_id: 9843078   # Perthpintprices (verified, owned by macca.mck@gmail.com; rank-tracker has 0 keywords set up yet)
  csv_path:
  notes: >
    Ahrefs MCP connected. Money values are USD cents (÷100). Per-pub queries
    ("[pub] pint price") are long-tail with ~no individual volume — their value is
    aggregate + AI/answer citations (the SERP is wide open; nobody answers the price).
    Use Ahrefs for the higher-volume suburb/discover money pages, not the pub template.

keywords:
  store: docs/seo/keywords.md  # written 2026-06-05 — money-page keyword set (Ahrefs AU)
  published_index: >
    Supabase `pubs` table (857 rows) → /[suburb]/[pub]; suburbs → /[suburb];
    indexable set in /sitemap.xml. A keyword is "covered" if a matching pub/suburb page exists.

content:
  blog:
    location: src/app/articles/[slug]/ , src/app/guides/* , src/app/insights/*
    format: data-driven tsx (article objects in code — NOT markdown/MDX)
    index_page: /discover  (the /articles, /guides, /insights hubs 308-redirect here)
    frontmatter: n/a (articles are typed objects, not files)
    output: brief
    writer_handoff: none dedicated — run the `humanizer` skill on new user-facing copy
  programmatic:
    exists: true
    route_pattern: /[suburb]/[pub]  (+ /[suburb] aggregate pages)
    data_source: Supabase `pubs` table (857 pubs)
    template_file: >
      src/app/[suburb]/[pub]/PubDetailClient.tsx (+ page.tsx metadata/JSON-LD,
      src/lib/pubJsonLd.ts, src/lib/voiceCopy.ts, src/lib/pubIndexability.ts)
    matrix: pub × suburb (one page per real venue; suburb pages aggregate)
    output: audit                # audit/optimize only — never generate parallel duplicates
    ceiling: 857 (1 per real venue; thin/dataless pubs gated to noindex by pubIndexability tier C)

voice:
  source: docs/brand-voice-brief.md (+ content-pack-v1.md §7) — the "PPP dry register"
  reference_files: docs/   (voiceCopy.ts holds the rendered per-state strings)

images:
  provider: pexels             # key not yet wired (pending: rotate + add PEXELS_API_KEY)
  api_key_env: PEXELS_API_KEY

onpage:
  targets: internal_links 3-5  # pub pages already emit sr-only crawler links + nearby + breadcrumb

technical:
  sitemap: /sitemap.xml        # generated; lists indexable (Tier A/B) pubs, excludes Tier C noindex + permanently-closed
  robots: /robots.txt
  lighthouse_target: 100
  schema: >
    BarOrPub (LocalBusiness) with Offer/MenuItem (exact pint + happy-hour price),
    FAQPage, BreadcrumbList, WebPage, OpeningHoursSpecification,
    LocationFeatureSpecification, PostalAddress, GeoCoordinates

deploy:
  platform: vercel
  repo: github.com/iamjohnnymac/perthpintprices
  branch_flow: >
    PR to main via gh; GitHub Actions "Typecheck, lint, build" (incl. Playwright
    pr-proof e2e) is the gate — Vercel passing is NOT enough; Vercel auto-deploys main.

search_console:
  property:                    # BLANK — confirm (likely sc-domain:perthpintprices.com; GSC data already used in docs/seo-action-plan.md)
  sitemap_submitted: unknown

cadence:
  blog_per_day_start: 1
  blog_ramp:                   # data-driven articles, not a daily blog cadence
  service_ceiling: 857         # no net-new programmatic generation — audit/optimize the existing template only

guardrails:
  url_slug_freeze: true        # pub/suburb slugs are canonical + 308-redirected; never change existing URLs
  notes: >
    Run `humanizer` on new user-facing copy. Verify pub pages via DOM reads — Chrome
    screenshots wedge on the sticky Leaflet map (see memory). tsc + full test suite +
    the pr-proof e2e must pass before merge.

integrations:
  writer: humanizer skill (copy de-AI-ing)
  editor: /code-review , /simplify
  voice_ci: humanizer (manual)
```

## Blanks to confirm
- `data_layer.ahrefs_project_id` — which Ahrefs project is perthpintprices.com.
- `search_console.property` — likely `sc-domain:perthpintprices.com` (GSC + GA4 data already referenced in `docs/seo-action-plan.md`).
- `keywords.store` — proposed `docs/seo/keywords.md`; not created yet.

## Notes
- **Render mode is crawlable** (server-rendered HTML) — the usual ranking-killer is not an issue here.
- **Pub pages are `output: audit`** — they're generated from the `pubs` table; optimize the template, never generate duplicates. Thin pubs are gated to `noindex` by `src/lib/pubIndexability.ts` (Tier C), so there's no thin-content ceiling risk.
- The real "money" pages for keyword work are the **suburb / discover / insight** pages (e.g. "cheap pints {suburb}", "happy hour perth") — that's where an Ahrefs `keywords` pass pays off next.
