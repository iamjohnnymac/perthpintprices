import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { sanitizeVendorText } from './vendorText'

describe('vendor text sanitization', () => {
  it('redacts phone numbers, emails, and explicitly labelled names', () => {
    const value = sanitizeVendorText(
      'Contact Jane Person at jane@example.com or +61 400 000 123.',
      { destination: '+61400000123' },
    )

    assert.equal(value, '[name redacted] at [email redacted] or [phone redacted].')
    assert.equal(sanitizeVendorText('my name is jane smith'), '[name redacted]')
    assert.equal(sanitizeVendorText('jane smith', { redactStandaloneName: true }), '[name redacted]')
  })

  it('unwraps vendor values, bounds output, and preserves ordinary beer names', () => {
    assert.equal(sanitizeVendorText({ value: 'Swan Draught' }, { maxLength: 100 }), 'Swan Draught')
    assert.equal(sanitizeVendorText('daily 4-6pm', { maxLength: 5 }), 'daily')
  })
})
