import { timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { clearAdminRateLimit, hashAdminClient, reserveAdminAuthAttempt } from './adminRateLimit'
import { serviceClient } from './supabaseGateway'

interface AdminAuthDeps {
  getServiceClient?: () => SupabaseClient
}

export type AdminAuthResult =
  | { authenticated: true; supabase: SupabaseClient }
  | { authenticated: false; response: NextResponse }

function safeCompare(a: string, b: string): boolean {
  try {
    const supplied = Buffer.from(a, 'utf-8')
    const expected = Buffer.from(b, 'utf-8')
    if (supplied.length !== expected.length) {
      timingSafeEqual(supplied, Buffer.alloc(supplied.length))
      return false
    }
    return timingSafeEqual(supplied, expected)
  } catch {
    return false
  }
}

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'
}

async function logFailedAttempt(supabase: SupabaseClient, clientHash: string): Promise<void> {
  try {
    await supabase.from('agent_activity').insert({
      action: 'Failed admin login attempt',
      category: 'security',
      status: 'warning',
      details: { client_hash: clientHash, timestamp: new Date().toISOString() },
    })
  } catch {
    // The limiter remains authoritative if audit logging is unavailable.
  }
}

export async function authenticateAdminRequest(
  request: NextRequest,
  deps: AdminAuthDeps = {},
): Promise<AdminAuthResult> {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    return { authenticated: false, response: NextResponse.json({ error: 'Server misconfigured' }, { status: 500 }) }
  }

  let supabase: SupabaseClient
  try {
    supabase = (deps.getServiceClient ?? serviceClient)()
  } catch {
    return { authenticated: false, response: NextResponse.json({ error: 'Authentication service unavailable' }, { status: 503 }) }
  }

  const clientHash = hashAdminClient(getClientIP(request), adminPassword)
  let reservation
  try {
    reservation = await reserveAdminAuthAttempt(supabase, clientHash)
  } catch {
    return { authenticated: false, response: NextResponse.json({ error: 'Authentication service unavailable' }, { status: 503 }) }
  }
  if (!reservation.allowed) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: 'Too many failed attempts. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(reservation.retryAfterSeconds || 900) } },
      ),
    }
  }

  const supplied = request.headers.get('authorization')?.replace('Bearer ', '') || ''
  if (!safeCompare(supplied, adminPassword)) {
    await logFailedAttempt(supabase, clientHash)
    return { authenticated: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  try {
    await clearAdminRateLimit(supabase, clientHash)
  } catch {
    return { authenticated: false, response: NextResponse.json({ error: 'Authentication service unavailable' }, { status: 503 }) }
  }
  return { authenticated: true, supabase }
}
