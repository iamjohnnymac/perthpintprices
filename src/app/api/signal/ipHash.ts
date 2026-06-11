import { createHash } from 'node:crypto'
import type { NextRequest } from 'next/server'

/**
 * Hash the caller's IP for rate limiting, matching the salt + truncation used
 * by /api/price-report so an IP maps to the same opaque token everywhere.
 */
export function hashRequestIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
  return createHash('sha256').update(ip + 'arvo-salt-2025').digest('hex').slice(0, 16)
}
