# Contributing to Perth Pint Prices

Thanks for being here. The site is small and personal but everything is reviewed and tracked. Read this before opening a PR.

## Ways to help

| Type | Where |
| --- | --- |
| **Report a price** | Use the form on any pub page at [perthpintprices.com](https://perthpintprices.com) — easiest contribution, no code needed |
| **Flag wrong data** | Open an [issue with the `data` template](https://github.com/iamjohnnymac/perthpintprices/issues/new?template=data_quality.yml) |
| **Propose a feature** | Open an [issue with the `feature` template](https://github.com/iamjohnnymac/perthpintprices/issues/new?template=feature_request.yml) |
| **Fix a bug** | Open an [issue with the `bug` template](https://github.com/iamjohnnymac/perthpintprices/issues/new?template=bug_report.yml), or a PR if it's a one-liner |
| **Add a new page or content** | Open an [issue with the `content` template](https://github.com/iamjohnnymac/perthpintprices/issues/new?template=content_request.yml) — content additions need an SEO sanity check before being built |

## Development setup

Read the [Quick start in `README.md`](./README.md#quick-start). You'll need access to a Supabase project, which is currently only the maintainer's. Reach out if you want a development snapshot.

## House rules

- **Always check Context7 first** — before writing any code, look up current docs for the library you're touching (Next.js, Tailwind, Lucide, Supabase, ElevenLabs). The field moves quarterly.
- **Always run `npx tsc --noEmit` and `npm run lint`** before pushing. CI will reject failures.
- **Always follow the design system** — every UI change must use the tokens / components / patterns documented in [`CLAUDE.md`](./CLAUDE.md). No hardcoded hex colours, no `rounded-2xl`, no emojis.
- **Run the humanizer skill on any user-facing text** to remove AI writing patterns — see the rule in [`CLAUDE.md`](./CLAUDE.md).
- **No emojis in code or copy** unless the design explicitly calls for them. Use Lucide React icons or inline SVGs.
- **SEO checklist on new pages** — every new page needs: title (<60 chars), description (<160 chars), canonical URL, OG tags, Twitter card, JSON-LD where applicable. Reference [`docs/SEO-MASTER.md`](./docs/SEO-MASTER.md).
- **Update `docs/PROJECT-STATUS.md` after every push** — what changed, with a date and the commit hash.

## Branch + PR conventions

- Branch off `main` with a short kebab-case name prefixed by intent: `fix/`, `feature/`, `chore/`, `docs/`, `seo/`, `andrew/` (the voice agent)
  - examples: `fix/canonical-www-redirect`, `seo/menu-item-schema`, `andrew/v3-conversational-ab`
- Commit messages: imperative, sentence case, no Conventional Commits prefixes
  - good: *"Fix Ahrefs site audit issues: orphan pages, meta descriptions"*
  - good: *"Tune Andrew's voice config: v3 conversational + higher stability"*
- One concept per PR. Long-running rebrand/refactor PRs are fine if they're genuinely one concept.
- PRs must pass CI (typecheck, lint, build). See [`.github/workflows/ci.yml`](./.github/workflows/ci.yml).
- Use the [PR template](./.github/pull_request_template.md) — it's pre-filled when you open one.

## Visual review

Any UI change should include before/after Playwright screenshots at desktop (1280×800) and mobile (375×812) — even just a sanity pair. The repo has [`scripts/test-responsive.mjs`](./scripts/test-responsive.mjs) for this.

## Code style

TypeScript strict mode is on. Prefer:
- Server Components by default; only `'use client'` when you actually need interactivity
- `next/image` for images (CWV gate)
- Tailwind tokens from the design system, never raw hex
- `font-mono` (JetBrains Mono) for labels/buttons/data, `font-display` (DM Serif) for decorative headings, `font-body` (Plus Jakarta Sans) for body
- `border-3 border-ink rounded-card` (12px) for cards, `rounded-pill` (9999px) for buttons

## Reporting security issues

See [SECURITY.md](./SECURITY.md). Don't open public issues for security problems.
