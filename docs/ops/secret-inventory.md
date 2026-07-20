# Agent credential inventory

Perth Pint Prices follows the HeyBlip access pattern: agents receive the smallest named credential bundle required for one task. There is no catch-all bundle, no root secret export, and no command may print a credential value.

Infisical is the canonical store for every password, key, token, and webhook secret under `/external/perth-pint-prices/*`. Vercel, ElevenLabs, GitHub Actions, and local operator processes receive only the scoped runtime copy they need; references to those services below describe runtime mirrors, not the source of truth.

Run `npm run access:preflight -- <bundle>` before a task that needs external access. Output is metadata only: variable name and `present` or `missing`. Add `--online` for `supabase-read`, `supabase-admin`, `elevenlabs-admin`, `vercel-deploy`, or `sentry-read` to verify the credential against a read-only identity or one-row endpoint. Online checks print only the HTTP result.

| Bundle | Variables | Purpose | Runtime mirror / owner | Rotation and verification |
| --- | --- | --- | --- | --- |
| `supabase-read` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public, RLS-bound reads and build verification | Vercel environment / project owner | Verify before builds; rotate anon key after policy changes or exposure response |
| `supabase-admin` | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Authenticated maintenance that must bypass RLS | Vercel encrypted environment / project owner | Review quarterly and after staff or automation changes |
| `admin-ui` | `ADMIN_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY` | Admin authentication and durable rate limiting | Vercel encrypted environment / project owner | Rotate after operator access changes |
| `cron-jobs` | `CRON_SECRET`, Supabase admin variables | Scheduled price checks and snapshots | Vercel encrypted environment / project owner | Verify after cron or deployment changes |
| `push-send` | `PUSH_API_SECRET`, VAPID public/private keys, `SUPABASE_SERVICE_ROLE_KEY` | Send web-push notifications | Vercel encrypted environment / project owner | Rotate the sender secret independently of VAPID keys |
| `record-price-tool` | `ELEVENLABS_RECORD_PRICE_TOOL_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` | Mid-call price recording only | ElevenLabs tool settings and Vercel encrypted environment / project owner | Rotate independently of other agent endpoints |
| `pintsweep-kickoff` | `PINTSWEEP_KICKOFF_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` | Batch kickoff only | Vercel encrypted environment / project owner | Header-only; never place this secret in a URL |
| `elevenlabs-webhook` | `ELEVENLABS_POST_CALL_WEBHOOK_SECRET` | Verify post-call webhook bodies only | ElevenLabs webhook settings and Vercel encrypted environment / project owner | Verify before webhook deployment; rotate independently of agent tools |
| `elevenlabs-admin` | `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`, `ELEVENLABS_PHONE_NUMBER_ID` | Agent configuration and batch-call administration | Operator secret store / project owner | Verify before admin work; rotate API access on access changes |
| `content-ai` | `OPENROUTER_API_KEY` | Menu and content analysis through OpenRouter | Vercel encrypted environment / project owner | Verify before content automation runs |
| `content-ai-anthropic` | `ANTHROPIC_API_KEY` | Direct Anthropic content tooling | Operator secret store / project owner | Grant only to tasks that use the direct provider |
| `places-refresh` | `GOOGLE_PLACES_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Monthly Places enrichment | GitHub Actions and operator secret stores / project owner | Quota-check and verify before sweeps |
| `stock-images` | `PEXELS_API_KEY` | Editorial image discovery | Operator secret store / project owner | Read-only API scope |
| `slack-alerts` | `SLACK_WEBHOOK_URL` | Operational notifications | Vercel encrypted environment / project owner | Rotate if the webhook destination or audience changes |
| `vercel-deploy` | `VERCEL_TOKEN` | Deployment administration when connector access is unavailable | Operator secret store / project owner | Prefer connector identity; verify before CLI deployment |
| `sentry-release` | `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | Runtime event delivery and source-map upload | Sentry plus Vercel encrypted environment / project owner | Release token must be project-scoped; verify on each release pipeline change |
| `sentry-read` | `SENTRY_READ_TOKEN` | Read-only agent investigation | Operator secret store / project owner | Read-only scope; review quarterly |

Runtime, CI, deploy, and human operator identities remain separate. A missing required bundle fails closed; unrelated tasks continue without it. Never place service-role, ElevenLabs, Vercel, or Sentry tokens in `NEXT_PUBLIC_*` variables, logs, screenshots, commits, or task transcripts.

Release verification completed on 2026-07-21:

1. Separate record-price, kickoff, and post-call secrets were created in Infisical.
2. `ELEVENLABS_RECORD_PRICE_TOOL_SECRET`, `PINTSWEEP_KICKOFF_SECRET`, and `ELEVENLABS_POST_CALL_WEBHOOK_SECRET` were synced only to their required Vercel and ElevenLabs runtime scopes.
3. The ElevenLabs record-price tool and HMAC post-call webhook were updated; the obsolete Tasklet webhook was disabled.
4. Metadata-only preflights passed without printing credential values.
5. Signed preview and production requests created exactly one idempotent log entry, which was removed after verification.
6. `phone_call_log.call_sid` had no duplicates before the idempotency migration was applied.
