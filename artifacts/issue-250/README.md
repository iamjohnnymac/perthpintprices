# Issue #250 visual evidence

All captures use the same Chromium project, browser context, viewport and device pixel ratio on both revisions. Desktop uses a 1280×800 CSS viewport; mobile uses the project's 375×812 Pixel 5 viewport. Mobile PNGs retain the emulated device pixel ratio.

## Before

- `before/admin/authenticated-{desktop,mobile}.png` — the authenticated admin overview from `origin/main`, before the Andrew tab exists.
- `before/ai-price-demo/route-absent-{desktop,mobile}.png` — the public route's 404 on `origin/main`.

## After

- `after/ai-price-demo/ready-{desktop,mobile}.png` — illustrative, explicitly fictional worked example in its ready state.
- `after/ai-price-demo/completed-{desktop,mobile}.png` — deterministic illustrative capture and ready-for-review state.
- `after/admin/ready-{desktop,mobile}.png` — authenticated Andrew tab with masked target, consent and no-write guard.
- `after/admin/completed-{desktop,mobile}.png` — mocked completed vendor response showing privacy-safe call events and strictly validated proposed fields. Raw conversation text is withheld. No real call was placed.

`tests/e2e/issue-250-andrew.spec.ts` produced the evidence with `ISSUE_250_BASELINE_URL` pointing at an `origin/main` server while the normal Playwright base URL pointed at this branch. The test authenticates both admin views, mocks only the stats and Andrew API payloads needed for deterministic display, and verifies the public route on both revisions.

The same test also exercises the checked-in Andrew MP3: playback advances, the ended state can replay, reset pauses and seeks to zero, and the sequence completes with reduced motion enabled. The checked-in demo configuration is preflighted against the production Andrew TTS contract. No phone call was placed.

The unlisted `noindex` presentation route intentionally uses a compact branded presentation header instead of `SubPageNav`: it is a slide-ready worked example rather than a normal discoverable sub-page. It retains a home link and the standard footer.
