# Pint Signal — build plan

One mate lights the signal (pub + time), the crew gets the link, everyone
answers with one tap. The signal burns out after 3 hours. Prototype:
`docs/prototypes/pint-signal.html` (open in a browser — interactive).

## Why this is our feature to build

- **The where is solved.** "Norfolk at 6 — $8 pints, $6.50 till 6, checked
  17 Feb" is a pitch nobody else can render. Price is the bait, the
  deadline is the hook.
- **Growth loop, not a feature.** Every signal lands in a group chat in
  front of ~5 non-users; the answer page is branded and carries the price
  intel. It's an acquisition channel that looks like a utility.
- **Data loop.** Everyone who answers IN is *standing in a pub tonight*.
  That's the perfect moment to ask "what did you pay?" — signals feed the
  price moat that Andrew otherwise has to phone for.
- **The gap in the market:** Facebook events and Partiful are too much
  ceremony for "pub in 2 hours"; a group-chat poll never expires so nobody
  answers it. An expiring signal forces the answer.

## Phase 1 — MVP (no accounts, no push)

Delivery is the group chat itself (native share sheet). We build the
lighting flow and the answer page; WhatsApp does distribution.

**Schema** (run in Supabase SQL editor):

```sql
create table signals (
  id          text primary key,              -- nanoid(10), unguessable share key
  pub_slug    text not null,
  crew_name   text,                          -- "Fremantle crew", free text
  lit_by      text not null,                 -- first name, no auth
  meet_at     timestamptz not null,
  expires_at  timestamptz not null,          -- meet_at + 3h
  created_at  timestamptz default now()
);
create table signal_answers (
  id         uuid primary key default gen_random_uuid(),
  signal_id  text not null references signals(id) on delete cascade,
  name       text not null,
  answer     text not null check (answer in ('in','out')),
  note       text,
  ip_hash    text,
  created_at timestamptz default now()
);
alter table signals enable row level security;
alter table signal_answers enable row level security;
create policy "public read signals"  on signals        for select using (true);
create policy "public read answers"  on signal_answers for select using (true);
-- writes go through API routes using the service role; no client-side policies
```

**Routes**
- `/signal/new` — lighting flow. Server-fetches pubs (reuse `slimPubForList`),
  suggests by price + live happy hour + (if geolocated) distance. Name +
  time chips. POSTs to the API, then opens the share sheet with the link.
- `POST /api/signal` — service role. Validates pub_slug exists, clamps
  meet_at to today/tomorrow, nanoid(10) id, rate-limit by ip_hash
  (reuse the pattern from `/api/price-report`).
- `/signal/[id]` — the answer page (the prototype design). `dynamic` render,
  poll answers every 30s like `/happy-hour` polls pubs. After `expires_at`:
  "This signal burned out" state with a "light a new one" CTA.
- `POST /api/signal/[id]/answer` — name + in/out + optional note, ip_hash
  rate-limited, rejects after expiry.

**Rules**
- Lighting the signal auto-answers the lighter IN (no empty-room signals).
- `noindex` + robots disallow `/signal/` — these are semi-private links.
- Pill no-wrap guard and design tokens as per the prototype; the dark card
  is the only new visual primitive.

## Phase 2 — crews + push
- `crews` table (id, name) + members as push subscriptions tagged with
  crew_id (reuse `push_subscriptions` + `/api/push/send`).
- Joining = opening a crew link once and allowing notifications.
- Lighting a signal blasts the crew; the share sheet stays as fallback.

## Phase 3 — close the loops
- **The morning-after ask:** push/notification to everyone who answered IN —
  "what was the pint at the Norfolk?" → pre-filled price report.
- **Crowd tie-in:** 4+ IN answers prompt a crowd report on arrival.
- **Counter-signal:** "can't tonight" optionally proposes cheaper/closer.

## Success metrics
Signals lit/week · answer rate per signal · time-to-first-answer ·
% of signals producing a price report within 24h · new push subs via crew links.

## Risks
- **Empty-room feel** — mitigated by auto-IN for the lighter and "2 of 6"
  framing instead of raw zeros.
- **Abuse/spam** — unguessable ids, ip_hash rate limits, 3h expiry, no
  indexing. Names are unverified by design; group chats self-police.
- **Scope creep** — Phase 1 has no accounts, no push, no realtime. Hold
  that line until signals are actually being lit.
