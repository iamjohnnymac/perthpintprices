/**
 * SignalId — unguessable share keys for Pint Signals.
 *
 * 10 base62 chars = 62^10 ≈ 8.4e17 combinations, which is the only access
 * control a signal link has (they're semi-private, noindexed URLs). Uses
 * node:crypto so it works in Node route handlers with no new dependencies.
 */
import { randomBytes } from 'node:crypto'

export const SIGNAL_ID_LENGTH = 10

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

// Largest multiple of 62 that fits in a byte (62 * 4 = 248). Bytes >= 248 are
// rejected so `byte % 62` stays uniform instead of biasing toward 0–7.
const UNBIASED_LIMIT = 248

/** Generate a 10-char base62 id using rejection sampling over random bytes. */
export function generateSignalId(): string {
  let id = ''
  while (id.length < SIGNAL_ID_LENGTH) {
    const bytes = randomBytes(SIGNAL_ID_LENGTH * 2)
    for (let i = 0; i < bytes.length && id.length < SIGNAL_ID_LENGTH; i++) {
      const byte = bytes[i]
      if (byte >= UNBIASED_LIMIT) continue
      id += ALPHABET[byte % ALPHABET.length]
    }
  }
  return id
}
