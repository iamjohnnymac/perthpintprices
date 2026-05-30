# Perth Pint Prices

[![CI](https://github.com/iamjohnnymac/perthpintprices/actions/workflows/ci.yml/badge.svg)](https://github.com/iamjohnnymac/perthpintprices/actions/workflows/ci.yml)
[![Live site](https://img.shields.io/badge/live-perthpintprices.com-D4740A)](https://perthpintprices.com)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-000)](https://nextjs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-postgres-3ecf8e)](https://supabase.com)

Perth's pint prices, sorted. A community-data site tracking pint prices across **300+ Perth pubs** so locals can find a cheap one and check happy hours.

> Live at **[perthpintprices.com](https://perthpintprices.com)**

## What's in here

- **Next.js 14 App Router** site (TypeScript strict, Tailwind, Lucide icons)
- **Supabase** for venue data, user-submitted price reports, weekly snapshots, push subscriptions
- **ElevenLabs Conversational AI** voice agent ("Andrew") that calls real pubs to crowdsource pint prices — see `agents/andrew.json` and `docs/andrew-voice-research.md`
- **Vercel** hosting — auto-deploys from `main`

## Quick start

```bash
git clone https://github.com/iamjohnnymac/perthpintprices.git
cd perthpintprices
npm install
cp .env.example .env.local      # then fill in the values
npm run dev                     # http://localhost:3001
```

Required env vars (see `.env.example` once you create it locally):

| Variable | Source | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project | Public DB URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project | Anon read key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project | Server writes (admin, agent webhooks) |
| `ELEVENLABS_API_KEY` | ElevenLabs | Convai + TTS for the voice agent |
| `ELEVENLABS_AGENT_ID` | ElevenLabs | Andrew's agent id |
| `ELEVENLABS_PHONE_NUMBER_ID` | ElevenLabs | Andrew's Twilio number id |
| `AGENT_WEBHOOK_SECRET` | shared secret | Andrew's `record_price` callback auth |
| `GOOGLE_PLACES_API_KEY` | Google Cloud | Pub-discovery + open-now filter |
| `OPENAI_API_KEY` | OpenAI | Menu scanner + post-call fallback extraction |
| `UPSTASH_REDIS_REST_URL`/`_TOKEN` | Upstash | Rate limiting + crowd reports cache |

## Scripts

```bash
npm run dev      # local dev on :3001
npm run lint     # next lint (CI gate)
npm run build    # production build (CI gate)
npm start        # serve the prod build
```

## Routes

~17 content pages — the suburb / pub silo (`/[suburb]/[pub]`, `/[suburb]`), guides, and insights (incl. the Pint Index) — plus legacy `/pub/*` and `/suburb/*` redirects. Full route list lives in [`CLAUDE.md`](./CLAUDE.md).

## Reference docs

| Doc | What |
| --- | --- |
| [`CLAUDE.md`](./CLAUDE.md) | Codebase overview, design system, conventions — load this first if you're an LLM |
| [`docs/PROJECT-STATUS.md`](./docs/PROJECT-STATUS.md) | Recent shipped work + backlog |
| [`docs/SEO-MASTER.md`](./docs/SEO-MASTER.md) | The SEO playbook |
| [`docs/seo-research-2026.md`](./docs/seo-research-2026.md) | Late-2026 SEO landscape (AEO/GEO, programmatic, AU local) |
| [`docs/seo-action-plan.md`](./docs/seo-action-plan.md) | Prioritised SEO punch list driven by GSC + GA4 data |
| [`docs/andrew-voice-research.md`](./docs/andrew-voice-research.md) | Voice models + tuning research for Andrew |
| [`docs/price-verification-kit.md`](./docs/price-verification-kit.md) | Price verification workflow |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Reports of pint prices by anyone are very welcome — the site has a built-in submission form on every pub page.

## Security

Found something? See [SECURITY.md](./SECURITY.md).

## Licence

This repository is public for transparency but does not yet carry an open-source licence. Default copyright applies — please ask before reusing code. Pint prices on the live site are community-contributed and free to view.
