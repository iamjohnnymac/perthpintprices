<!-- Thanks for contributing — fill out the sections below so review is quick. -->

## What this changes

<!-- One or two sentences. What's different after this lands? -->

## Why

<!-- Link any issue: "Closes #123", "Refs #45". If it's a one-off cleanup, say so. -->

## Type

<!-- Check one (or more if it's a hybrid) -->

- [ ] Bug fix
- [ ] Feature
- [ ] Content / SEO
- [ ] Andrew (voice agent)
- [ ] Refactor / chore
- [ ] Docs only
- [ ] CI / governance

## Screenshots (UI changes only)

<!-- Desktop (1280×800) + Mobile (375×812) before/after. Use scripts/test-responsive.mjs -->

## Checklist

- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds locally
- [ ] No emojis introduced (use Lucide icons or inline SVGs)
- [ ] Design system tokens used — no raw hex, no `rounded-2xl`, no `stone-*` / `orange-*`
- [ ] If user-facing copy was added: ran the humanizer skill
- [ ] If a new page was added: title <60 chars, description <160 chars, canonical, OG, Twitter card, JSON-LD if applicable
- [ ] If touching agents/andrew.json: PATCHed the live ElevenLabs agent so they match
- [ ] `docs/PROJECT-STATUS.md` updated (after merge / push)
