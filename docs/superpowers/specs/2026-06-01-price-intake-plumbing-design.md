# Price Intake Plumbing Design

Date: 2026-06-01

## Context

Andrew is paused for price collection until call quality is reliable. The next data push should come from official menus, menu photos, venue submissions, community reports, and manual sweeps. Those sources should not write directly to `pubs.price`.

The existing path already has the right broad shape: public submissions create `price_reports`, admin approval promotes a report into `pubs` and `price_history`, and current-price provenance is stored on `pubs`. The weak point is that report-level provenance and evidence are implicit or missing, so more ingestion would make the moderation queue harder to trust.

## Goal

Build the smallest safe intake foundation before adding crawlers or new acquisition loops.

Success means every incoming price candidate can say:

- where it came from,
- what evidence supports it,
- when it was observed or captured,
- how confident the system is,
- and whether approving it should update regular price, happy-hour data, or only mark a venue as stale.

## Non-Goals

- Do not build the official menu crawler in this slice.
- Do not run Andrew calls.
- Do not auto-approve broad automated extracts.
- Do not add a full user account, leaderboard, or rewards system.
- Do not expand schema markup beyond what is required to keep existing writes safe.

## Data Model

Add report-level fields to `price_reports`:

- `submission_source text`: first-class source label.
- `source_url text`: official menu, QR menu, social post, or other evidence URL.
- `evidence_text text`: short extracted snippet or reviewer-readable evidence.
- `observed_at timestamptz`: when the reporter says the price was seen.
- `raw_extraction jsonb`: optional machine output for OCR, menu crawler, or future extractors.
- `extractor_version text`: optional parser/model version.

Allowed initial `submission_source` values:

- `manual`
- `menu_scan`
- `tier_c_report_hero`
- `official_menu`
- `venue_submission`
- `community_bounty`
- `aggregator_lead`
- `stale_flag`

Use a check constraint for these values. Future source labels should be added by migration, not silently accepted through free text.

Keep current canonical fields on `pubs`:

- `price_source`
- `price_verified_at`
- `price_confidence`

Map accepted reports into those fields through the existing admin approval path.

## Source And Confidence Rules

Initial confidence mapping:

- `official_menu`: high when `source_url` and clear `evidence_text` exist, otherwise medium.
- `venue_submission`: medium by default.
- `menu_scan`: low by default.
- `community_bounty`: medium when evidence exists, low without evidence.
- `manual`: medium.
- `tier_c_report_hero`: medium.
- `aggregator_lead`: low and not auto-approvable.
- `stale_flag`: no price confidence; it marks review need only.

`priceReportSource` should stop parsing free-form notes for menu scans once `submission_source` exists. Notes can remain as human context, not the routing mechanism.

## API Changes

Update `/api/price-report` to accept optional:

- `submission_source`
- `source_url`
- `evidence_text`
- `observed_at`
- `raw_extraction`
- `extractor_version`

Default `submission_source` to `manual` when omitted. Keep the public form compatible.

Menu-scan submissions should send `submission_source: "menu_scan"` instead of relying on `notes: "Submitted via menu scan"`.

Tier-C report hero submissions should send `submission_source: "tier_c_report_hero"` instead of encoding that source only in notes.

## Admin Review Semantics

Approval rules:

- `price_report`: may update `pubs.price`, `beer_type`, current-price provenance, and regular `price_history`.
- `happy_hour_report`: may update happy-hour fields, but must not write a regular `price_history.price` row.
- `outdated_flag`: must not approve as a `$0` price. It should mark the report reviewed and leave the current price untouched. A later implementation may add a dedicated stale queue or set `price_verified = false`, but this slice should avoid changing live price state without stronger product approval.
- `aggregator_lead`: should remain pending/manual-review only. It cannot be accepted into `pubs.price` without independent source evidence added by the reviewer.

Admin stats should count all pending `price_reports`, not just pending reports inside the latest 10 rows.

## Menu Scan Rate Limiting

Fix `/api/menu-scan` rate limiting to match actual stored reports.

Current problem: the route checks for `report_type = "menu_scan"`, but submitted menu-scan rows are saved as normal `price_report` / `happy_hour_report` rows with a note marker.

New rule: rate limits should look for `submission_source = "menu_scan"` once the migration exists. During rollout, also treat old note-marker rows as menu-scan rows for backwards compatibility.

## Future Crawler Contract

The future official-menu crawler should only insert pending `price_reports` with:

- `submission_source = "official_menu"`
- `source_url`
- `evidence_text`
- `observed_at` or `captured_at` encoded in `observed_at`
- `raw_extraction`
- `extractor_version`

It should not update `pubs` directly. Any auto-approval rule must be a separate, explicit change with tests.

## Testing

Add or update tests for:

- `/api/price-report` stores `submission_source` and evidence fields.
- omitted `submission_source` defaults to `manual`.
- menu-scan submissions are recognised through `submission_source`.
- admin approval maps `submission_source` to `price_source` and confidence.
- happy-hour approval does not write regular price history.
- outdated flags cannot update `pubs.price`.
- admin stats pending count is not capped by the latest 10 reports.

Verification commands:

- `npm test`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `git diff --check`

No Playwright screenshots are required unless the implementation changes visible UI.

## Rollout

1. Add and apply the migration.
2. Update server routes and helper functions.
3. Update menu-scan and Tier-C submission callers.
4. Add focused tests.
5. Merge plumbing.
6. Start the official-menu crawler design as the next slice.
