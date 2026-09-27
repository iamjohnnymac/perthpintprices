# Official Menu Crawler MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a small manual crawler that turns curated official menu URLs into pending `price_reports` rows without updating canonical pub prices.

**Architecture:** The crawler is a CLI-only operational tool. Pure extraction lives in `src/lib/officialMenuExtract.ts` with tests; `scripts/crawl-official-menus.mjs` handles env loading, seed-file parsing, fetching, pub lookup, dry-run output, and optional insertion into `price_reports`.

**Tech Stack:** Node.js fetch, Supabase JS v2 service-role script, TypeScript unit tests via `tsx --test`.

---

### Task 1: Seed Contract

**Files:**
- Create: `scripts/official-menu-seeds.example.json`

- [ ] Define the curated seed format as `{ "sources": [{ "pub_slug": "...", "url": "...", "label": "..." }] }`.
- [ ] Keep real production writes behind an explicit copied local seed file.

### Task 2: Pure Extraction

**Files:**
- Create: `src/lib/officialMenuExtract.ts`
- Create: `src/lib/officialMenuExtract.test.ts`

- [ ] Convert HTML/text to readable menu lines.
- [ ] Extract conservative pint-price candidates from beer/pint/tap/draught lines with `$3`-`$30` prices.
- [ ] Skip happy-hour/special/deal lines in v1.
- [ ] Preserve reviewer evidence text.

### Task 3: Manual Crawler CLI

**Files:**
- Create: `scripts/crawl-official-menus.mjs`
- Modify: `package.json`

- [ ] Load `.env.local`.
- [ ] Default to `--dry-run`.
- [ ] Accept `--file`, `--limit`, and `--write`.
- [ ] Fetch each URL with timeout and a normal user agent.
- [ ] Look up seeded `pub_slug` values in `pubs`.
- [ ] Insert pending `price_reports` with `submission_source = "official_menu"`, `source_url`, `evidence_text`, `observed_at`, `raw_extraction`, and `extractor_version`.
- [ ] Never update `pubs`.

### Task 4: Verify

- [ ] Run `npm test`.
- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Run `git diff --check`.
