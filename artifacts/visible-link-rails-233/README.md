# Visible link rails evidence — issue #233

Captured on 21 July 2026 from a local production build using the scoped
Infisical `supabase-read` bundle. Desktop screenshots use a 1280×800 viewport;
mobile screenshots use a 375×812 viewport.

## Before

- `before-discover-desktop.png`
- `before-discover-mobile.png`
- `before-pub-desktop.png`
- `before-pub-mobile.png`
- `before-suburb-desktop.png`
- `before-suburb-mobile.png`

The representative pub is the missing-price Federal Hotel page. The suburb is
Fremantle, which includes both checked and TBC venues.

## After

- `after-discover-desktop.png`
- `after-discover-mobile.png`
- `after-pub-desktop.png`
- `after-pub-mobile.png`
- `after-suburb-desktop.png`
- `after-suburb-mobile.png`

Targeted screenshots put the new navigation in the viewport:

- `after-discover-data-tools-desktop.png`
- `after-discover-data-tools-mobile.png`
- `after-pub-links-desktop.png`
- `after-pub-links-mobile.png`
- `after-suburb-links-desktop.png`
- `after-suburb-links-mobile.png`
- `after-suburb-ranking-desktop.png`
- `after-suburb-ranking-mobile.png`

## Checks

- The Discover rail shows all five Data & Tools destinations without overflow.
- Federal Hotel visibly recommends nearby TBC pubs and links to its suburb,
  Perth's cheapest pints and Perth happy hours.
- Fremantle's visible, scrollable list contains all 63 legitimate venues,
  including TBC rows, followed by nearby-suburb and comparison links.
- Canonical-link eligibility is applied before Discover's slim payload removes
  business status, and the Tier-C checked-price fallback excludes confirmed
  closures without excluding legitimate missing or unverified-price pubs from
  contextual links.
- New contextual and suburb-ranking links provide at least a 48px touch target;
  the targeted mobile and desktop captures show the final sizing without
  clipping.
- Raw initial HTML contained all five data-tool links, the Cheapest Pints
  destination, TBC pub recommendations and 63 unique Fremantle pub links.
- No layout clipping was found at either viewport.

Automated verification passed with 358/358 unit tests, 9/9 focused link-policy
tests, TypeScript, lint, redirect and security-header contracts, an
Infisical-backed production build, and all 8 PR-proof Playwright checks across
desktop and mobile Chromium.

The missing Google venue photo in the Federal Hotel captures is unchanged from
the before evidence and is external to this issue. A pre-existing Leaflet map
double-initialisation overlay occurs in local development mode only; the
production build used here renders cleanly.
