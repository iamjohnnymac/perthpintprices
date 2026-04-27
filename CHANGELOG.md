# Changelog

All notable changes to Perth Pint Prices are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning loosely follows [SemVer](https://semver.org/) (`MAJOR.MINOR.PATCH`).

## [Unreleased]

### Added
- Project governance: README, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, this CHANGELOG
- GitHub issue + PR templates, CODEOWNERS, Dependabot config
- CI workflow on every PR (typecheck, lint, build)
- `docs/seo-action-plan.md` — prioritised SEO punch list from real GSC + GA4 data
- `docs/seo-research-2026.md` — late-2026 SEO landscape research
- `docs/andrew-voice-research.md` — voice model + TTS tuning research

### Changed
- Andrew's voice config: `eleven_flash_v2` → `eleven_v3_conversational` (Expressive Mode), stability 0.30 → 0.70, similarity_boost 0.85 → 0.75, turn eagerness `eager` → `patient`

## [1.2.0] — 2026-04-26

### Added
- ElevenLabs convai voice agent "Andrew" with the full pipeline:
  - `/api/agents/record-price/[slug]` mid-call webhook
  - `/api/agents/post-call` HMAC-signed post-call webhook with Claude transcript fallback
  - `/api/pintsweep/kickoff` batch trigger using ElevenLabs Batch Calling, 24h dedupe, business-hours filter
  - 70-term Scribe v2 keyterm list, 6 few-shot transcripts, DTMF/IVR navigation
- First successful real-pub capture: $12.80 Great Northern Super Crisp at Kalamunda Hotel

### Changed
- Brand rebranded Arvo → Perth Pint Prices across docs, UI, PWA manifest, service worker (Arvo retained as `alternateName` in WebSite JSON-LD)
- URL silo: `/{suburb}/{pub}` is the canonical path; `/pub/{slug}` and `/suburb/{slug}` redirect
- Andrew prompt tuning across many small commits — banned-word list, mate budget, eager `record_price`, hold-on handling, transfer handling, longer silence timeout

## Earlier

See `git log` for the full pre-1.2 history. Project was renamed from "Arvo" in early April 2026.
