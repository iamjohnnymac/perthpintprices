# CLAUDE.md — Perth Pint Prices

## Project Overview

Perth Pint Prices ("The Perth Beer Exchange") is a web app that helps users find the cheapest beer prices at pubs across Perth, Western Australia. Features include pub search/filtering, interactive maps, real-time crowd levels, happy hour tracking, weather-based recommendations, and suburb price comparisons.

**Live site**: https://perthpintprices.com

## Tech Stack

- **Framework**: Next.js 14 (App Router) with React 18
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 3 + shadcn/ui (Radix UI primitives)
- **Maps**: Leaflet + React Leaflet with marker clustering
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React

## Getting Started

```bash
npm install        # Install dependencies
npm run dev        # Start dev server at http://localhost:3000
npm run build      # Production build
npm start          # Run production server
npm run lint       # Run ESLint via Next.js
```

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous (public) key

Defaults are hardcoded in `src/lib/supabase.ts` for development.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout (server component, metadata/SEO)
│   ├── page.tsx            # Main page (client component, app orchestrator)
│   └── globals.css         # Global styles, Tailwind directives, animations
├── components/
│   ├── ui/                 # shadcn/ui primitives (badge, button, card, input, select, slider, toggle)
│   ├── Map.tsx             # Leaflet map with price-coded markers + clustering
│   ├── MiniMap.tsx         # Inline mini-map for pub cards
│   ├── PubCard.tsx         # Individual pub display card
│   ├── FilterSection.tsx   # Advanced search/filter panel
│   ├── FilterBar.tsx       # Filter UI bar
│   ├── Filters.tsx         # Filter logic wrapper
│   ├── PintIndex.tsx       # Price statistics dashboard (sparkline, distribution)
│   ├── PriceTicker.tsx     # Bloomberg-style scrolling price ticker
│   ├── SunsetSippers.tsx   # Golden hour pub recommendations
│   ├── BeerWeather.tsx     # Weather-based bar suggestions
│   ├── SuburbLeague.tsx    # Suburb price rankings
│   ├── SuburbShowdown.tsx  # Suburb rivalry comparison
│   ├── CrowdBadge.tsx      # Crowd level indicator badge
│   ├── CrowdReporter.tsx   # Modal for users to report crowd levels
│   └── SubmitPubForm.tsx   # Form to submit new pubs
├── data/
│   └── pubs.json           # Static pub seed data (~150+ pubs)
├── lib/
│   ├── supabase.ts         # Supabase client, data-fetching functions
│   ├── happyHour.ts        # Happy hour parsing, status, and countdown logic
│   ├── emoji.ts            # Runtime emoji generation utility
│   └── utils.ts            # Tailwind merge helper (cn)
└── types/
    └── pub.ts              # TypeScript interfaces (Pub type)
```

## Architecture Notes

- **Client-side rendering**: The main page is a `'use client'` component. Maps and heavy UI components are dynamically imported with `ssr: false`.
- **State management**: React hooks only (useState, useEffect, useMemo). No global state library.
- **Data flow**: Supabase → `getPubs()` → page state → filtered/sorted → components.
- **Path aliases**: `@/*` maps to `./src/*` (configured in tsconfig.json).
- **No test framework** is currently configured.

## Database (Supabase)

Key tables:
- **`pubs`** — name, address, suburb, lat/lng, price, beer_type, happy_hour, website, sunset_spot
- **`crowd_reports`** — pub_id, crowd_level (1–4), created_at
- **`price_snapshots`** — historical averages, medians, ranges

Key functions:
- `getPubs()` — fetch all pubs ordered by price
- `getCrowdLevels()` — RPC call to `get_live_crowd_levels()`
- `reportCrowdLevel(pubId, level)` — insert crowd report

Crowd data auto-refreshes every 60 seconds on the client.

## Coding Conventions

- Tailwind utility classes for all styling; no CSS modules.
- shadcn/ui components live in `src/components/ui/` — configure via `components.json` (New York style).
- Color-coding by price uses helper functions: `getPriceColor()`, `getPriceBgColor()`, `getPriceTextColor()`.
- Happy hour logic is timezone-aware (Australia/Perth).
- Emoji rendering uses a runtime generation utility in `src/lib/emoji.ts` to avoid UTF-8 encoding issues.
- Dynamic imports with `next/dynamic` and `ssr: false` for any browser-only libraries (Leaflet).

## Common Tasks

- **Add a new component**: Create in `src/components/`, import dynamically in `page.tsx` if it uses browser APIs.
- **Add a shadcn/ui component**: Use `npx shadcn-ui@latest add <component>`.
- **Modify filters**: Update `FilterSection.tsx` for UI, filtering logic is in `page.tsx` (useMemo).
- **Update pub data**: Edit `src/data/pubs.json` or add directly to Supabase.
- **Change happy hour parsing**: Edit `src/lib/happyHour.ts`.
