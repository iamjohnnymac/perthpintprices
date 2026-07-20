import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { NextRequest } from 'next/server'

import { handleCspReport, sanitizeCspReport } from './handler'

describe('CSP report sanitising', () => {
  it('retains origins and strips paths and query strings', () => {
    assert.deepEqual(sanitizeCspReport({
      'csp-report': {
        'blocked-uri': 'https://bad.example/private/path?token=secret',
        'document-uri': 'https://perthpintprices.com/account?id=123',
        'effective-directive': 'script-src-elem',
      },
    }), {
      blockedOrigin: 'https://bad.example',
      documentOrigin: 'https://perthpintprices.com',
      directive: 'script-src-elem',
    })
  })

  it('samples only valid reports for the production origin', async () => {
    let captured = 0
    const request = new NextRequest('http://localhost/api/csp-report', {
      method: 'POST',
      body: JSON.stringify({
        'csp-report': {
          'document-uri': 'https://perthpintprices.com/discover?private=value',
          'blocked-uri': 'https://blocked.example/script.js',
          'effective-directive': 'script-src-elem',
        },
      }),
    })
    const response = await handleCspReport(request, {
      random: () => 0,
      capture: () => { captured += 1; return 'event-id' },
    })

    assert.equal(response.status, 204)
    assert.equal(captured, 1)
  })

  it('drops spoofed origins and unknown directives', async () => {
    let captured = 0
    const request = new NextRequest('http://localhost/api/csp-report', {
      method: 'POST',
      body: JSON.stringify({
        'csp-report': {
          'document-uri': 'https://attacker.example/',
          'effective-directive': 'anything-goes',
        },
      }),
    })
    await handleCspReport(request, { random: () => 0, capture: () => { captured += 1; return 'event-id' } })
    assert.equal(captured, 0)
  })
})
