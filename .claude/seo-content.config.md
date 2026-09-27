# seo-content — project config

Written by the `seo-content` skill's `init`. Read by every mode. Keep it committed — it's the project's SEO contract.

```yaml
project:
  name: Perth Pint Prices
  framework: Next.js 16 (App Router)
  render_mode: hybrid          # See current rendering source in src/app and indexability policy in AGENTS.md
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
    Supabase `pubs` table → /[suburb]/[pub]; suburbs → /[suburb];
    indexable set in /sitemap.xml. A keyword is "covered" if a matching pub/suburb page exists.

content:
  blog:
    location: src/app/articles/[slug]/ , src/app/guides/* , src/app/insights/*
    format: data-driven tsx (article objects in code — NOT markdown/MDX)
    index_page: /discover  (/guides and /insights 301-redirect here in vercel.json)
    frontmatter: n/a (articles are typed objects, not files)
    output: brief
    writer_handoff: none dedicated — run the `humanizer` skill on new user-facing copy
  programmatic:
    exists: true
    route_pattern: /[suburb]/[pub]  (+ /[suburb] aggregate pages)
    data_source: Supabase `pubs` table
    template_file: >
      src/app/[suburb]/[pub]/PubDetailClient.tsx (+ page.tsx metadata/JSON-LD,
      src/lib/pubJsonLd.ts, src/lib/voiceCopy.ts, src/lib/pubIndexability.ts)
    matrix: pub × suburb (one page per real venue; suburb pages aggregate)
    output: audit                # audit/optimize only — never generate parallel duplicates
    ceiling: existing legitimate venues (see AGENTS.md and docs/seo/suburb-indexability-policy-2026-07-21.md for indexability)

voice:
  source: docs/brand-voice-brief.md (+ docs/archive/content-pack-v1.md §7 for historical context) — the "PPP dry register"
  reference_files: docs/   (voiceCopy.ts holds the rendered per-state strings)

images:
  provider: pexels             # key not yet wired (pending: rotate + add PEXELS_API_KEY)
  api_key_env: PEXELS_API_KEY

onpage:
  targets: internal_links 3-5  # follow current visible-link guidance in AGENTS.md and docs/seo/suburb-indexability-policy-2026-07-21.md

technical:
  sitemap: /sitemap.xml        # generated; see AGENTS.md and docs/seo/suburb-indexability-policy-2026-07-21.md for current membership policy
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
  property:                    # BLANK — confirm (likely sc-domain:perthpintprices.com; historical GSC data in docs/archive/seo-action-plan.md)
  sitemap_submitted: unknown

cadence:
  blog_per_day_start: 1
  blog_ramp:                   # data-driven articles, not a daily blog cadence
  service_ceiling: existing legitimate venues  # no net-new programmatic generation — audit/optimise the existing template only

guardrails:
  url_slug_freeze: true        # pub/suburb slugs are canonical; check vercel.json for redirect status before changing URLs
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
- `search_console.property` — likely `sc-domain:perthpintprices.com` (historical GSC + GA4 data in `docs/archive/seo-action-plan.md`).
- `keywords.store` — `docs/seo/keywords.md` exists; its keyword data is dated 2026-06-05.

## Notes
- **Render mode is crawlable** (server-rendered HTML) — the usual ranking-killer is not an issue here.
- **Pub pages are `output: audit`** — they're generated from the `pubs` table; optimise the template, never generate duplicates. Use `AGENTS.md` and `docs/seo/suburb-indexability-policy-2026-07-21.md` for current indexability policy.
- The real "money" pages for keyword work are the **suburb / discover / insight** pages (e.g. "cheap pints {suburb}", "happy hour perth") — that's where an Ahrefs `keywords` pass pays off next.
