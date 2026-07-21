# Historical technical cohorts — 2026-07-21

This inventory reconciles GSC's Page indexing snapshot dated 2026-07-10 with the production checks and handling merged for [#236](https://github.com/iamjohnnymac/perthpintprices/issues/236). It is deliberately separate from the 99/18 submitted-sitemap export: neither report is a live exclusion instruction.

## Canonical mismatch

| GSC URL | Current classification | Current evidence |
| --- | --- | --- |
| `/henley-brook/the-henley-brook` | Historic Google-chosen-canonical mismatch | Current `200`, self-canonical; no rewrite required. |

## Redirect errors

| GSC URL | Current classification | Current handling |
| --- | --- | --- |
| `/guides` | Intentional retired section root | Edge `301` to `/discover`. |
| `/insights` | Intentional retired section root | Edge `301` to `/discover`. |

GSC validation was already started. These roots are intentionally absent from the sitemap.

## Historical 404 report (15 URLs)

| URL | Current handling |
| --- | --- |
| `/midland/the-7th-ave-bar-and-restaurant` | `301` to `/midland/7th-ave-bar-and-restaurant` |
| `/northbridge/i-darts-nix-perth` | `301` to `/northbridge/idartsnix` |
| `/scarborough/sk-l` | `301` to `/scarborough/skol` |
| `/perth-cbd/helvetica-bar` | `301` to `/perth/399-small-bar` |
| `/henley-brook/the-naked-fox-wine-bar` | `301` to `/henley-brook/the-naked-fox-wine-bar-kitchen-and-caf` |
| `/pub/badlands-bar` | Intentional `410 Gone` retired legacy path |
| `/pub/jack-rabbit-slims` | Intentional `410 Gone` retired legacy path |
| `/pub/w-churchill` | Intentional `410 Gone` retired legacy path |
| `/pub/wolf-lane` | Intentional `410 Gone` retired legacy path |
| `/pub/ruin-bar` | Intentional `410 Gone` retired legacy path |
| `/pub/the-flying-scotsman` | Intentional `410 Gone` retired legacy path |
| `/northbridge/ruin-bar` | Intentional `404`; removed venue, no replacement |
| `/mount-lawley/five-bar` | Intentional `404`; removed venue, no replacement |
| `/perth-cbd/halford-bar` | Intentional `404`; removed venue, no replacement |
| `/pub-golf` | Intentional `404`; retired feature, no relevant replacement |

The detailed response matrix and faithful terminal capture live in [`docs/seo/index-cleanup-2026-07-21.md`](../../index-cleanup-2026-07-21.md) and [`artifacts/index-cleanup-236/route-evidence-terminal.png`](../../../../artifacts/index-cleanup-236/route-evidence-terminal.png). No price completeness, price freshness, or verification field was used in any canonical, redirect, sitemap, or indexability decision.
