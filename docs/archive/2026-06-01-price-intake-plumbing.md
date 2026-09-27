# Price Intake Plumbing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add structured provenance/evidence to pending price reports and make admin approval safe for regular prices, happy-hour reports, stale flags, and future official menu leads.

**Architecture:** Keep the current public-report -> admin-review -> canonical-pub update flow. Add report-level columns in one migration, centralize source/confidence mapping in `src/lib/priceProvenance.ts`, and keep non-Andrew sources pending until admin approval.

**Tech Stack:** Next.js 14 App Router route handlers, TypeScript strict, Supabase Postgres/Supabase JS v2, Node test runner.

---

### Task 1: Add Report Provenance Columns

**Files:**
- Create: `supabase/migrations/20260601010000_price_report_intake_provenance.sql`

- [ ] Add nullable `price_reports` columns: `submission_source`, `source_url`, `evidence_text`, `observed_at`, `raw_extraction`, `extractor_version`.
- [ ] Backfill existing rows to `manual`, except note-marker menu scans to `menu_scan` and old Tier-C note markers to `tier_c_report_hero`.
- [ ] Add a check constraint for the approved source labels.
- [ ] Verify locally with `git diff --check`.

### Task 2: Centralize Source And Confidence Mapping

**Files:**
- Modify: `src/lib/priceProvenance.ts`
- Modify: `src/lib/priceProvenance.test.ts`

- [ ] Add `ReportSubmissionSource` and helpers to normalize incoming source labels.
- [ ] Map report source/confidence from structured `submission_source`, using notes only for legacy fallback rows.
- [ ] Cover official menu evidence, community evidence, menu scan confidence, stale flags, and legacy note fallbacks in unit tests.
- [ ] Run `npm test -- src/lib/priceProvenance.test.ts` if supported; otherwise run `npm test`.

### Task 3: Store Structured Fields From Public Reports

**Files:**
- Modify: `src/app/api/price-report/route.ts`
- Create: `src/app/api/price-report/route.test.ts`

- [ ] Accept optional structured fields in `POST`.
- [ ] Default omitted `submission_source` to `manual`; force stale reports to `stale_flag`.
- [ ] Use `submission_source === "menu_scan"` for bulk rate limiting while still allowing old note-marker menu scan payloads.
- [ ] Insert only validated provenance fields into `price_reports`.
- [ ] Test default source and structured evidence inserts.

### Task 4: Fix Menu Scan Caller And Rate Limit

**Files:**
- Modify: `src/app/api/menu-scan/route.ts`
- Modify: `src/components/SubmitPubForm.tsx`

- [ ] Count recent scans by `submission_source = "menu_scan"` plus legacy note-marker rows.
- [ ] Submit menu scan extracted items with `submission_source: "menu_scan"`.
- [ ] Submit Tier-C hero reports with `submission_source: "tier_c_report_hero"` instead of relying on note parsing.
- [ ] Submit outdated flags with `submission_source: "stale_flag"`.

### Task 5: Harden Admin Approval

**Files:**
- Modify: `src/app/api/admin/review/route.ts`
- Create: `src/app/api/admin/review/route.test.ts`

- [ ] Use structured report provenance for `pubs.price_source` and confidence.
- [ ] Reject approval of `aggregator_lead` unless a later explicit design adds reviewer evidence.
- [ ] Mark `outdated_flag` reports as reviewed without changing `pubs.price`.
- [ ] For `happy_hour_report`, update only happy-hour fields and do not insert regular `price_history`.
- [ ] Test regular approval provenance, happy-hour no-history behavior, outdated no-price-update behavior, and aggregator lead blocking.

### Task 6: Count All Pending Reports In Admin Stats

**Files:**
- Modify: `src/app/api/admin/stats/route.ts`

- [ ] Add a dedicated exact count query for `price_reports.status = "pending"`.
- [ ] Keep the existing recent 10 rows for display only.
- [ ] Use the dedicated count in the JSON payload.

### Task 7: Verify

- [ ] Run `npm test`.
- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Run `git diff --check`.
- [ ] No Playwright screenshots are required unless visible UI changes are introduced.
