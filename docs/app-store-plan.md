# App Store plan — Perth Pint Prices on iOS + Android

Goal: real native push notifications (signals, price drops, happy hour
alerts) and store presence, without rebuilding the site.

## The approach: wrap, don't rebuild

**Capacitor** wraps the existing Next.js site in a native shell with real
native APIs (push, share sheet, geolocation, deep links). One web codebase
stays the product; the apps are thin shells. A React Native/Expo rebuild is
months of work for no extra user value — ruled out.

Reality check on notifications first: **Android web push already works
today** (Chrome + the existing `push_subscriptions` table), and iOS
supports web push for home-screen-installed PWAs since 16.4. The stores buy
us *reliable* iOS push (APNs), discoverability, and the legit-app factor —
not the only path to notifications.

## Phase 0 — prep (repo work, ~2 days)
- **Deep links**: serve `/.well-known/assetlinks.json` (Android App Links)
  and `/.well-known/apple-app-site-association` (iOS Universal Links) so
  `perthpintprices.com/signal/...` opens the app when installed.
- **Token plumbing**: extend `push_subscriptions` with `platform`
  ('web'|'ios'|'android') and `native_token` columns; `/api/push/subscribe`
  accepts both shapes; `/api/push/send` fans out web-push AND FCM.
- **One messaging backend**: Firebase Cloud Messaging for both platforms
  (APNs routed through FCM). Free tier covers us indefinitely.
- **Assets**: icons/splash generate from the brand set we rebuilt
  (scripts/generate-brand-assets.mjs gets a splash + adaptive-icon target).

## Phase 1 — Android first (~1-2 weeks to production)
- Google Play Console: $25 one-off, fast review, relaxed policies.
- Capacitor Android project in `apps/mobile` (repo subfolder), pointing at
  the production site with a bundled offline fallback page.
- `@capacitor/push-notifications` → FCM token → `/api/push/subscribe`.
- Tracks: internal testing (us) → closed beta (the Freo crew — genuinely
  useful: they're the signal testers) → production.
- Store listing: the answer-page screenshots we already generate, "Real
  pint prices across 849 Perth pubs", content rating questionnaire
  (alcohol references → rated for it).

## Phase 2 — iOS (~3-4 weeks including review buffer)
- Apple Developer Program: $99/yr. APNs key wired into FCM.
- Same Capacitor shell, iOS target. TestFlight beta first.
- **Review risks to design around (this is the real work):**
  - *Guideline 4.2 minimum functionality* — pure web wrappers get
    rejected. Our mitigation: native push, native share sheet on signals,
    geolocation "near me", offline last-known-prices view, home-screen
    quick actions ("Light a signal", "Happy hours now"). Each is small but
    together they read as an app, not a website in a box.
  - *Guideline 1.2 user-generated content* — Pint Signal names/notes are
    UGC. Apple wants a report mechanism: add a "report" link on signal
    pages + a moderation note in the admin dashboard. Small build, do it
    before submission.
  - *Alcohol content* — age rating 17+, keep "drink responsibly" visible
    (already in the footer).
  - No accounts = no Sign in with Apple requirement. Genuine advantage.

## Phase 3 — make push earn its keep
- Signal lit → push the crew (this is Pint Signal Phase 2, now on native
  rails instead of web push).
- Opt-in alerts: price drop on a watched pub (WatchlistButton already
  exists), pint-of-the-day, "happy hour near you starts in 30min" (geo).
- Quiet by default. One bad notification week kills the install.

## Costs + cadence
- $25 Google once, $99/yr Apple, FCM free, no new servers.
- Suggested order: Phase 0 → Android beta in the crew's hands → iOS
  TestFlight → both stores live. Realistic end-to-end: 4-6 weeks part-time.

## What I'd cut if pressed
Skip the offline view and quick actions for Android (not needed there);
they're iOS-review insurance only. Don't build Phase 3 alerts until the
stores are live and signals are being lit weekly.
