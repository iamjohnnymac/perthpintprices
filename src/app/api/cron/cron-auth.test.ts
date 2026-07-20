import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { NextRequest } from 'next/server'
import { GET as priceCheck } from './price-check/route'
import { GET as weeklySnapshot } from './weekly-snapshot/route'

describe('cron route authentication', () => {
  for (const [name, handler] of [['price check', priceCheck], ['weekly snapshot', weeklySnapshot]] as const) {
    it(`${name} fails closed when CRON_SECRET is missing`, async () => {
      delete process.env.CRON_SECRET
      const response = await handler(new NextRequest('http://localhost/api/cron', {
        headers: { authorization: 'Bearer undefined' },
      }))

      assert.equal(response.status, 500)
    })

    it(`${name} rejects an invalid bearer token`, async () => {
      process.env.CRON_SECRET = 'correct-secret'
      const response = await handler(new NextRequest('http://localhost/api/cron', {
        headers: { authorization: 'Bearer wrong-secret' },
      }))

      assert.equal(response.status, 401)
    })
  }
})
