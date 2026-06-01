# Playwright PR Proof

Every PR runs `npm run test:e2e` in CI and uploads the `playwright-proof` artifact. The HTML report includes attached desktop and mobile screenshots for the core smoke paths.

Use `npm run test:e2e:video` when motion, forms, maps, or multi-step UI need a recording. Regular CI keeps videos for failures and traces for first retries.
