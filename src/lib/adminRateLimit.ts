import { createHmac } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface AdminRateLimitResult {
  allowed: boolean
  retryAfterSeconds?: number
}

export function hashAdminClient(ip: string, secret: string): string {
  return createHmac('sha256', secret).update(ip).digest('hex')
}

export async function reserveAdminAuthAttempt(
  supabase: Pick<SupabaseClient, 'rpc'>,
  clientHash: string,
): Promise<AdminRateLimitResult> {
  const { data, error } = await supabase.rpc('reserve_admin_auth_attempt', { p_client_hash: clientHash })
  if (error) throw new Error(`admin rate-limit update failed: ${error.message}`)
  const result = data as { allowed?: unknown; retry_after_seconds?: unknown } | null
  return {
    allowed: result?.allowed === true,
    retryAfterSeconds: typeof result?.retry_after_seconds === 'number' ? result.retry_after_seconds : undefined,
  }
}

export async function clearAdminRateLimit(
  supabase: Pick<SupabaseClient, 'rpc'>,
  clientHash: string,
): Promise<void> {
  const { error } = await supabase.rpc('clear_admin_rate_limit', { p_client_hash: clientHash })
  if (error) throw new Error(`admin rate-limit reset failed: ${error.message}`)
}
