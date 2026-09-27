# Playwright PR Proof

Every PR runs `npm run test:e2e` in CI and uploads the `playwright-proof` artifact. The HTML report includes attached desktop and mobile screenshots for the core smoke paths.

Use `npm run test:e2e:video` when motion, forms, maps, or multi-step UI need a recording. Regular CI keeps videos for failures and traces for first retries.

## Lessons

- `networkidle` waits for every request the page makes, third-party ones included, so one hung request holds a test until its 30 s timeout. A live Open-Meteo call did this to the sunset shifted-clock test until #295 stubbed it with `page.route`. Stub the third-party APIs a tested page calls. Analytics (Google Analytics, Clarity) and CARTO map tiles are still live in most page tests and carry the same risk.
