# Arvo — Perth Pint Prices

## Rules
- **Always check Context7 first** — before writing any code, use the Context7 MCP tool (`mcp__plugin_context7_context7__resolve-library-id` then `mcp__plugin_context7_context7__query-docs`) to look up current documentation for any library or framework being used (Next.js, Tailwind, Lucide, Supabase, etc.). This ensures code uses up-to-date APIs and patterns.
- **Always visually verify changes** — after any UI change, take Playwright screenshots at desktop (1280x800) and mobile (375x812) to confirm layout, spacing, and content look correct. Never assume it's right.
- **Always follow the Design System below** — every UI change must use the correct tokens, components, and patterns defined in this file. Never introduce new colors, border-radius values, or shadow sizes without checking here first.
- **Never use emojis** — use Lucide React icons or inline SVGs instead.
- **Check TypeScript compiles** — run `npx tsc --noEmit` after code changes.

## Dev Environment
- Next.js 14 app with Tailwind CSS and Supabase
- Dev server: `npm run dev` on port 3001
- TypeScript strict mode

## Design System

### Colors (always use Tailwind tokens, never hardcode hex)
- `text-ink` / `bg-ink` — #171717
- `text-gray-mid` — #8A8A85
- `bg-off-white` — #F7F7F5
- `bg-[#FDF8F0]` — page background
- `text-amber` / `bg-amber` — #D4740A
- `bg-amber-pale` — #FFF3E0
- Never use `stone-*`, `orange-*`, or raw hex like `#1A1A1A`, `#888`, `#666`

### Typography
- `font-mono` (JetBrains Mono) — labels, nav, buttons, data
- `font-display` (DM Serif) — decorative headings
- `font-body` (Plus Jakarta Sans) — body text

### Components
- Borders: `border-3 border-ink`
- Cards: `rounded-card` (12px)
- Buttons/pills: `rounded-pill` (9999px) — never `rounded-2xl`
- Shadows: `shadow-hard-sm` (3px) — never bare `shadow-hard` (4px)
- Button pattern: `border-3 border-ink rounded-pill shadow-hard-sm`

### Layout
- Container: `max-w-container` (800px) with `px-6`
- All pages must include `<Footer />`
- Sub-pages use `<SubPageNav />` for header
- Homepage header has 3 nav links: Discover, Happy Hours, Pint Report
