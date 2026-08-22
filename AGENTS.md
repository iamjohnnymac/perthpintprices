# AGENTS.md

This is the canonical repository guide for coding agents. Keep it focused on durable invariants
and task routing. Read the smallest task-specific set of documents and source files that covers
the work.

## Product direction

Perth Pint Prices helps people decide where and when to buy a pint in Perth. The product wins on:

1. **Trustworthy prices** — show the source and checked date, preserve provenance, and leave
   unknown prices unknown.
2. **Useful local decisions** — turn the data into clear comparisons, nearby options, and
   time-specific happy-hour advice.

When scope or copy is ambiguous, prefer the option that improves evidence or helps a punter make
a decision. Read `docs/brand-voice-brief.md` for the full writing standard.

## Sources of truth

- Code and configuration own executable facts: dependency versions, scripts, routes, redirects,
  cron schedules, security headers, cache policy, schemas, and environment contracts.
- Supabase and provider APIs own current venue, price, verification, and operational state.
- Focused policy documents own editorial, SEO, data-verification, and security procedures.
- `docs/PROJECT-STATUS.md` is a historical status log, not a substitute for inspecting the
  current branch and live systems.
- This file owns stable repository invariants and routes agents to deeper context.

Read a cheap primary source instead of copying a value from prose. Point-in-time counts, route
inventories, dependency versions, completed work, and incident details belong in code, dated
reports, issues, or git history—not in this always-loaded guide.

## Task routing

| When the task involves | Read before acting |
| --- | --- |
| The Claude `/pm-loop` worker/reviewer workflow | `.claude/commands/pm-loop.md` and the active harness rules; keep each concurrent worker in an isolated branch and worktree |
| Library, framework, SDK, API, CLI, or cloud-service behaviour | When applicable, resolve the exact package and version from `package.json` or lockfiles, then use Context7 to fetch current official documentation |
| Prices, provenance, freshness, venue changes, menu extraction, or verification | `src/app/api/price-report/intake.ts`, `src/lib/priceProvenance.ts`, `src/lib/freshness.ts`, `docs/superpowers/specs/2026-06-01-price-intake-plumbing-design.md`, and the relevant Supabase migrations |
| Supabase access, caching, RLS, or database writes | `src/lib/supabase.ts`, `src/lib/supabaseGateway.ts`, `src/lib/cachedPubs.ts`, and relevant files under `supabase/migrations/` |
| SEO, metadata, canonicals, redirects, sitemap, robots, or indexability | Relevant dated policy under `docs/seo/` (start with `docs/seo/suburb-indexability-policy-2026-07-21.md` for indexability), `src/lib/urls.ts`, `src/lib/sitemapData.ts`, `vercel.json`, route configuration, and matching tests; use `docs/SEO-MASTER.md` only for historical strategy and verify executable claims |
| UI, styling, typography, responsive layout, or accessibility | `tailwind.config.ts`, `src/app/globals.css`, nearby components, and `tests/e2e/README.md` |
| Product copy, articles, labels, titles, or descriptions | `docs/brand-voice-brief.md`; use the humanizer skill when available, then verify the result against the brief |
| Andrew, phone calls, ElevenLabs, webhooks, or agent configuration | `agents/andrew.json`, `docs/andrew-voice-research.md`, the matching API handlers/tests, and the required access preflight |
| Authentication, secrets, privileged routes, CSP, Sentry, or privacy | `SECURITY.md`, `docs/ops/secret-inventory.md`, `src/lib/adminAuth.ts`, `src/lib/supabaseGateway.ts`, and the matching security/privacy tests |
| Build failures, CI, Playwright, or visual evidence | `.github/workflows/ci.yml`, `package.json`, `playwright.config.ts`, and `tests/e2e/README.md` |
| Current priorities or historical context | The relevant issue or PR, then the newest applicable entry in `docs/PROJECT-STATUS.md`; confirm every live claim independently |

Use Context7 for current library-specific syntax, configuration, migrations, and debugging. Start
with library resolution, query with the full task, and prefer the official version-matched result.
It is unnecessary for repository-local business logic, code review, or general programming
concepts.

## Repository shape

- `src/app` — Next.js App Router pages, route handlers, metadata, robots, and sitemap endpoints.
- `src/components` — shared product and UI components; reusable primitives live under
  `src/components/ui`.
- `src/lib` — data access, caching, provenance, URLs, indexability, analytics, and domain logic.
- `src/types` — shared application types.
- `tests/e2e` — Playwright smoke paths and visual PR proof.
- `scripts` — verification, access preflights, imports, crawlers, and one-off operational tools.
- `supabase/migrations` — the database change history.
- `agents` — version-controlled ElevenLabs agent configuration.
- `docs` — task-specific policies, plans, research, and historical status.

Read `package.json`, `package-lock.json`, `next.config.js`, `vercel.json`, and the active workflow
before stating current versions, commands, redirects, schedules, or deployment behaviour. The
`@/*` alias resolves to `src/*`.

## Working safely

Before editing, run `git status --short` and preserve unrelated work. Concurrent agents use one
branch and one worktree each. Confirm the branch before committing, and keep every changed line
traceable to the task.

Use the smallest coherent change. Match the existing architecture and style; remove only the
orphans your own change creates. Surface assumptions that materially affect behaviour, and turn
the request into observable success criteria before implementation.

External mutations need explicit scope. Database writes, migrations, provider configuration,
phone calls, deployments, ticket changes, and secret rotation are separate actions from editing
the repository. Use read-only checks until the task authorises the mutation.

## Development and verification

Install and run commands from the repository root:

```bash
npm ci
npm run dev
npx tsc --noEmit
npm run lint
npm test
npm run test:gsc-baseline
npm run test:redirects
npm run test:headers
npm run test:access
npm run build
npm run test:e2e
```

Treat `package.json` and `.github/workflows/ci.yml` as the exact command contract. Match checks to
the change: run focused tests while iterating, then every relevant CI command before handoff.
Do not claim a production build passed when Supabase credentials or live data made the build
preflight unavailable; state that limitation precisely.

The production build is intentionally data-aware. Its prebuild checks Supabase reachability and
sentinel/data health, and its postbuild checks generated-page diversity and homepage payload.
CI also runs unit tests, configuration contracts, the build, and the Playwright PR proof. A local
type-check alone is not equivalent.

Any user-visible change needs before-and-after browser evidence at 1280x800 and 375x812. Use the
Playwright projects in `playwright.config.ts`, save the paired evidence in a task-specific artifact
directory, and describe it in the handoff. `tests/e2e/README.md` owns the CI proof behavior. Verify
content, overflow, interaction, and console/runtime errors, not just screenshot creation.

Before handoff, inspect the full diff, confirm `git status`, list the exact checks run and their
results, and call out any check skipped or dependent on external state. When an orchestration loop
is in scope, use a fresh independent reviewer after implementation.

## Application invariants

### Price and venue data

- A displayed price, happy-hour window, venue attribute, and freshness claim must come from real
  data with the appropriate provenance. Truthful absence beats a guess.
- Keep regular prices distinct from temporary happy-hour prices. Preserve the checked date,
  source, confidence, and submission source through intake and review.
- A report is evidence for review, not automatic permission to overwrite the canonical pub row.
- User and provider input is untrusted. Validate at the boundary, preserve the original evidence
  needed for review, and keep privileged writes server-side.
- Data changes require targeted tests plus a read-back or rendered verification appropriate to
  the changed surface. Never infer success from a row count alone.

### Supabase, RLS, and caching

- Public operations permitted directly by RLS use the anon client. Tables that intentionally deny
  anonymous writes may be reached by a narrowly scoped server route using `serviceClient()` from
  `src/lib/supabaseGateway.ts`; such brokers must validate input, enforce their authentication or
  rate-limit boundary, expose only the minimum operation, and have focused tests.
- Construct the service client inside the request path. It fails closed when the service-role key
  is missing; never replace that failure with an anon fallback.
- Keep service-role credentials out of client modules, `NEXT_PUBLIC_*` variables, logs,
  screenshots, commits, and task transcripts.
- Server list pages use the shared cached data seam in `src/lib/cachedPubs.ts`. It caches raw rows
  so time-sensitive happy-hour state is derived at render time. Preserve its payload-size and
  invalidation constraints when extending reads.
- Add database changes as reviewable migrations under `supabase/migrations/`. Applying a
  migration to a live project requires explicit owner approval and post-apply verification.

### URLs, SEO, and indexability

- `src/lib/urls.ts` owns the canonical origin, suburb slugging, and pub/suburb URL builders. Reuse
  it across links, metadata, structured data, and sitemaps.
- Preserve intentional redirects and retired-route responses in `vercel.json` and route handlers.
  Update the redirect/SEO contract tests in the same change when URL behaviour changes.
- Legitimate pub pages remain indexable when a price is missing, stale, or unverified; confirmed
  permanent closures are excluded. Suburb pages are based on legitimate venue presence, not price
  coverage. The relevant indexability modules and dated SEO policy own the exact predicates.
- New public pages need unique decision-led content and the complete metadata/canonical/social/
  structured-data treatment required by the SEO playbook. Add them to navigation and sitemap
  policy deliberately; route existence alone is insufficient.
- Robots directives guide crawlers and never replace authentication or authorisation.

### Rendering and design

- Prefer Server Components. Add a Client Component only at the smallest boundary that needs
  browser state or interaction.
- Reuse the Tailwind tokens and semantic typography roles defined in `tailwind.config.ts` and
  `src/app/globals.css`. Extend the design system at its source rather than creating a parallel
  palette or one-off component language.
- Preserve responsive behaviour, keyboard access, readable contrast, reduced-motion behaviour,
  and stable layout. Use Lucide icons or a deliberate inline SVG for interface symbols; product
  copy does not use decorative emoji.
- Keep data-heavy list pulls and generated HTML within the existing cache and payload budgets.

### Voice and privacy

- Write in Australian English with the evidence-first, dry Perth voice in
  `docs/brand-voice-brief.md`. Lead with the decision, use specific local facts, and keep certainty
  proportional to the source and checked date.
- Avoid generic filler on templated pages. Specific data earns copy; sparse evidence earns a
  shorter honest page.
- Treat phone numbers, transcripts, precise location, IP-derived identifiers, reports, and
  operational metadata as sensitive. Collect, log, expose, and send only what the feature needs.
- Run the relevant privacy, webhook-authentication, rate-limit, CSP, and security-header tests
  whenever those boundaries move.

## Keeping this guide healthy

Add a rule here only when every agent needs it and the environment cannot express it more
reliably. Put branch-specific procedures behind a task-routing pointer. Put live counts, incident
details, and completed work in dated documents, issues, or git history. When a change makes a
sentence false, update or remove it in the same PR.
