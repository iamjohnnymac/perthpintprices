# Perth Pint Prices

[![CI](https://github.com/iamjohnnymac/perthpintprices/actions/workflows/ci.yml/badge.svg)](https://github.com/iamjohnnymac/perthpintprices/actions/workflows/ci.yml)
[![Live site](https://img.shields.io/badge/live-perthpintprices.com-D4740A)](https://perthpintprices.com)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-000)](https://nextjs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-postgres-3ecf8e)](https://supabase.com)

Perth's pint prices, sorted. A community-data site tracking pint prices across **300+ Perth pubs** so locals can find a cheap one and check happy hours.

> Live at **[perthpintprices.com](https://perthpintprices.com)**

## What's in here

- **Next.js 16 App Router** site (TypeScript strict, Tailwind, Lucide icons)
- **Supabase** for venue data, user-submitted price reports, weekly snapshots, push subscriptions
- **ElevenLabs Conversational AI** voice agent ("Andrew") that calls real pubs to crowdsource pint prices — see `agents/andrew.json` and `docs/andrew-voice-research.md`
- **Vercel** hosting — auto-deploys from `main`

## Quick start

```bash
git clone https://github.com/iamjohnnymac/perthpintprices.git
cd perthpintprices
npm install
cp .env.example .env.local      # then fill in the values
npm run dev                     # http://localhost:3000 by default
```

Required env vars (see `.env.example` once you create it locally):

| Variable | Source | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project | Public DB URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project | Anon read key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project | Server writes (admin, agent webhooks) |
| `ELEVENLABS_API_KEY` | ElevenLabs | Convai + TTS for the voice agent |
| `ELEVENLABS_AGENT_ID` | ElevenLabs | Andrew's agent id |
| `ELEVENLABS_DEMO_AGENT_ID` | ElevenLabs | Separate Andrew owner-test agent id |
| `ELEVENLABS_PHONE_NUMBER_ID` | ElevenLabs | Andrew's Twilio number id |
| `AI_DEMO_TEST_PHONE_E164` | Project owner | Fixed owner-test destination; server-only E.164 value |
| `AGENT_WEBHOOK_SECRET` | shared secret | Andrew's `record_price` callback auth |
| `GOOGLE_PLACES_API_KEY` | Google Cloud | Pub-discovery + open-now filter |
| `OPENAI_API_KEY` | OpenAI | Menu scanner + post-call fallback extraction |
| `UPSTASH_REDIS_REST_URL`/`_TOKEN` | Upstash | Rate limiting + crowd reports cache |

Before an owner-only Andrew test, run `npm run access:preflight -- andrew-owner-demo --online`. The preflight checks required variables without printing the destination, rejects matching production/demo agent IDs or a malformed E.164 destination, and verifies that `agents/andrew-demo.json` retains the production Andrew TTS contract.

## Scripts

```bash
npm run dev      # local dev on :3000 by default
npm run lint     # eslint . --max-warnings 50 (CI gate)
npm run build    # production build (CI gate)
npm start        # serve the prod build
```

## Routes

The site has pub and suburb pages (`/[suburb]/[pub]`, `/[suburb]`), `/discover`, and other content routes. `/guides` and `/insights` redirect to `/discover`; legacy `/pub/*` and `/suburb/*` routes also redirect. See [`AGENTS.md`](./AGENTS.md) for route guidance and [`src/app`](./src/app) for the current route tree.

## Reference docs

| Doc | What |
| --- | --- |
| [`AGENTS.md`](./AGENTS.md) | Current repository guidance and task routing; `CLAUDE.md` imports it |
| [`docs/PROJECT-STATUS.md`](./docs/PROJECT-STATUS.md) | Historical status log and backlog |
| [`docs/SEO-MASTER.md`](./docs/SEO-MASTER.md) | Historical SEO strategy; see its current-policy pointers |
| [`docs/seo-research-2026.md`](./docs/seo-research-2026.md) | April 2026 SEO research (AEO/GEO, programmatic, AU local) |
| [`docs/archive/seo-action-plan.md`](./docs/archive/seo-action-plan.md) | Archived GSC and GA4 SEO action list |
| [`docs/andrew-voice-research.md`](./docs/andrew-voice-research.md) | Dated voice model and tuning research for Andrew |
| [`docs/archive/price-verification-kit.md`](./docs/archive/price-verification-kit.md) | Archived price verification field kit |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Reports of pint prices by anyone are very welcome — the site has a built-in submission form on every pub page.

## Security

Found something? See [SECURITY.md](./SECURITY.md).

## Licence

This repository is public for transparency but does not yet carry an open-source licence. Default copyright applies — please ask before reusing code. Pint prices on the live site are community-contributed and free to view.
