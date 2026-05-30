/**
 * SupabaseGateway — the one place server-side API routes get a Supabase client.
 *
 * Replaces ~15 inline `createClient(...)` blocks across `src/app/api/**` so the
 * project URL and key selection live in a single file, and the "should this route
 * write past RLS?" question becomes an explicit, typed choice (anonClient vs
 * serviceClient) instead of folklore buried in constructor arguments.
 *
 * This module is ADDITIVE for the API layer only. The `supabase` singleton in
 * `src/lib/supabase.ts` (used by client components and the server data helpers)
 * is intentionally left untouched.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co'

// The anon key is PUBLIC by design (it is the NEXT_PUBLIC_ key already shipped to
// every browser). Keeping it as a single fallback here is harmless and preserves
// the previous behaviour, while de-duplicating the literal that was copied into ~14 files.
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmeGtvYmx2Z3R0ZWx6Ym9lbnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUwNjgsImV4cCI6MjA4Njc2MTA2OH0.qLy6B-VeVnMh0QSOxHK3uQEJ6iZr6xNHmfKov_7B-fY'

let anon: SupabaseClient | null = null

/**
 * RLS-bound client using the public anon key. Use for reads and for RLS-gated
 * public writes (price reports, submissions, push subscriptions). Memoised.
 */
export function anonClient(): SupabaseClient {
  if (!anon) {
    anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
  return anon
}

/**
 * Privileged client using the service-role key — bypasses RLS. Use only in
 * trusted, authenticated server routes that must write past RLS.
 *
 * IMPORTANT: call this PER-REQUEST (inside the route handler), never at module
 * top level — CI builds without `SUPABASE_SERVICE_ROLE_KEY`, so constructing it
 * at import time would crash `next build`.
 *
 * Throws loudly if the key is missing rather than silently degrading to the anon
 * key (which would run a privileged route as an unprivileged client).
 */
export function serviceClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set — refusing to fall back to the anon key for a privileged route',
    )
  }
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false } })
}
