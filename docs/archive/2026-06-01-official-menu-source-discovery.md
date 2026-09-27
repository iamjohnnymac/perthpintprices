# Official Menu Source Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Discover likely official menu/drinks/PDF source URLs for missing-price pubs so crawler inputs can be reviewed before extraction.

**Architecture:** Keep discovery read-only. Pure link scoring lives in `src/lib/officialMenuSources.ts`; `scripts/discover-official-menu-sources.mjs` loads pubs with websites, fetches pages, ranks candidate links, and writes a local JSON review artifact.

**Tech Stack:** Node.js fetch/URL/fs, Supabase JS v2 read queries, TypeScript node tests.

---

### Task 1: Pure Link Discovery

**Files:**
- Create: `src/lib/officialMenuSources.ts`
- Create: `src/lib/officialMenuSources.test.ts`

- [ ] Extract links from HTML relative to a base URL.
- [ ] Score menu/drinks/PDF links higher than generic food/contact links.
- [ ] Categorise candidates as `html`, `pdf`, `image`, or `other`.
- [ ] Deduplicate by canonical URL.

### Task 2: CLI Review Artifact

**Files:**
- Create: `scripts/discover-official-menu-sources.mjs`
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] Query pubs with non-empty websites, defaulting to missing regular prices.
- [ ] Fetch each website with timeout and user agent.
- [ ] Rank up to 5 candidate source URLs per pub.
- [ ] Write `scripts/official-menu-source-candidates.json`.
- [ ] Never insert reports or update pubs.

### Task 3: Verify

- [ ] Run `npm test`.
- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Run `npm run discover:official-menu-sources -- --limit 5`.
- [ ] Run `git diff --check`.
