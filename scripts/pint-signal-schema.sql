-- Pint Signal — Phase 1 schema (see docs/pint-signal-plan.md)
--
-- Run this in the Supabase SQL editor (project ifxkoblvgttelzboenpi, Sydney).
-- Safe to re-run: tables use IF NOT EXISTS and policies are dropped before
-- being recreated.
--
-- Writes go through the API routes using the service role key; there are
-- deliberately NO client-side insert/update/delete policies.

create table if not exists signals (
  id          text primary key,              -- 10-char base62, unguessable share key
  pub_slug    text not null,
  crew_name   text,                          -- "Fremantle crew", free text
  lit_by      text not null,                 -- first name, no auth
  meet_at     timestamptz not null,
  expires_at  timestamptz not null,          -- meet_at + 3h
  ip_hash     text,                          -- lighter's hashed IP, for rate limiting
  created_at  timestamptz default now()
);

create table if not exists signal_answers (
  id         uuid primary key default gen_random_uuid(),
  signal_id  text not null references signals(id) on delete cascade,
  name       text not null,
  answer     text not null check (answer in ('in','out')),
  note       text,
  ip_hash    text,
  created_at timestamptz default now()
);

create index if not exists signals_ip_hash_created_at_idx
  on signals (ip_hash, created_at);
create index if not exists signal_answers_signal_id_idx
  on signal_answers (signal_id);
create index if not exists signal_answers_ip_hash_created_at_idx
  on signal_answers (ip_hash, created_at);

alter table signals enable row level security;
alter table signal_answers enable row level security;

drop policy if exists "public read signals" on signals;
drop policy if exists "public read answers" on signal_answers;
create policy "public read signals"  on signals        for select using (true);
create policy "public read answers"  on signal_answers for select using (true);
-- writes go through API routes using the service role; no client-side policies
