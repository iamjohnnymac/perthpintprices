# Indexing technical cleanup — 2026-07-21

Issue [#236](https://github.com/iamjohnnymac/perthpintprices/issues/236) resolves the current, one-to-one replacements found in the dated GSC Page indexing report. The Search Console snapshot is dated 2026-07-10; this record separates that historic cohort from production checks made on 2026-07-21.

## Canonical and redirect findings

`/henley-brook/the-henley-brook` now returns `200` and its production HTML has the self-canonical `https://perthpintprices.com/henley-brook/the-henley-brook`. The route is the current pub URL, so the March canonical mismatch is a stale GSC classification. No canonical rewrite is required.

`/guides` and `/insights` each return an edge `301` with `Location: /discover`. They no longer use page-component redirects, and their former layouts have been removed so a redirected root has no section-level canonical metadata source. The GSC redirect-error validation was already Started; no request was made from this change.

## Reported 404 cohort

| GSC URL | Classification | Current handling |
| --- | --- | --- |
| `/midland/the-7th-ave-bar-and-restaurant` | One-to-one renamed pub | `301` to `/midland/7th-ave-bar-and-restaurant` |
| `/northbridge/i-darts-nix-perth` | One-to-one renamed pub | `301` to `/northbridge/idartsnix` |
| `/scarborough/sk-l` | One-to-one renamed pub | `301` to `/scarborough/skol` |
| `/perth-cbd/helvetica-bar` | One-to-one renamed pub | `301` to `/perth/399-small-bar` |
| `/henley-brook/the-naked-fox-wine-bar` | One-to-one renamed pub | `301` to `/henley-brook/the-naked-fox-wine-bar-kitchen-and-caf` |
| `/pub/badlands-bar` | Retired legacy pub namespace | `410 Gone` |
| `/pub/jack-rabbit-slims` | Retired legacy pub namespace | `410 Gone` |
| `/pub/w-churchill` | Retired legacy pub namespace | `410 Gone` |
| `/pub/wolf-lane` | Retired legacy pub namespace | `410 Gone` |
| `/pub/ruin-bar` | Retired legacy pub namespace | `410 Gone` |
| `/pub/the-flying-scotsman` | Retired legacy pub namespace | `410 Gone` |
| `/northbridge/ruin-bar` | Removed pub with no current replacement | Intentional `404` |
| `/mount-lawley/five-bar` | Removed pub with no current replacement | Intentional `404` |
| `/perth-cbd/halford-bar` | Removed pub with no current replacement | Intentional `404` |
| `/pub-golf` | Retired feature with no relevant replacement | Intentional `404` |

The five replacement destinations were confirmed in the live public catalogue before adding redirects. No price-verification, freshness, or missing-price field was used to make a redirect, 404, 410, canonical, sitemap, or indexing decision.

## Titles and structured data

The GSC evidence available for this issue contains no URL-level impressions evidence for a title change. No bulk title rewrite was made. Existing JSON-LD graphs are unchanged.

## Evidence

The final local response and canonical matrix, along with the verification result, is recorded in [the issue #236 artifact](../../artifacts/index-cleanup-236/final-response-matrix.png). It is a generated terminal-proof image; it contains no credentials or raw GSC exports.
