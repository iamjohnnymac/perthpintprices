import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { reviewPriceReport } from './priceReportReview'

describe('admin price report review', () => {
  const now = new Date('2026-06-01T04:30:00.000Z')

  it('maps structured report provenance onto approved regular prices', async () => {
    const supabase = reviewSupabase({
      id: 1,
      pub_slug: 'test-pub',
      reported_price: 10,
      beer_type: 'Swan Draught',
      report_type: 'price_report',
      submission_source: 'official_menu',
      source_url: 'https://example.com/menu',
      evidence_text: 'Swan Draught pint $10',
    })

    const result = await reviewPriceReport(supabase, { id: 1, action: 'approve' }, now)

    assert.equal(result.status, 200)
    assert.deepEqual(supabase.calls.pubUpdate, {
      last_updated: '2026-06-01T04:30:00.000Z',
      price: 10,
      price_verified: true,
      last_verified: '2026-06-01T04:30:00.000Z',
      price_verified_at: '2026-06-01T04:30:00.000Z',
      price_source: 'official_menu',
      price_confidence: 'high',
      beer_type: 'Swan Draught',
    })
    assert.deepEqual(supabase.calls.historyInsert, {
      pub_id: 42,
      price: 10,
      change_type: 'update',
      source: 'official_menu',
      changed_at: '2026-06-01T04:30:00.000Z',
      verified_at: '2026-06-01T04:30:00.000Z',
      confidence: 'high',
    })
  })

  it('approves happy-hour reports without writing regular price history', async () => {
    const supabase = reviewSupabase({
      id: 2,
      pub_slug: 'test-pub',
      reported_price: 8,
      beer_type: 'Swan Draught',
      report_type: 'happy_hour_report',
      submission_source: 'menu_scan',
    })

    const result = await reviewPriceReport(supabase, { id: 2, action: 'approve' }, now)

    assert.equal(result.status, 200)
    assert.deepEqual(supabase.calls.pubUpdate, {
      last_updated: '2026-06-01T04:30:00.000Z',
      happy_hour_price: 8,
    })
    assert.equal(supabase.calls.historyInsert, null)
  })

  it('reviews outdated flags without changing pub price state', async () => {
    const supabase = reviewSupabase({
      id: 3,
      pub_slug: 'test-pub',
      reported_price: 0,
      report_type: 'outdated_flag',
      submission_source: 'stale_flag',
    })

    const result = await reviewPriceReport(supabase, { id: 3, action: 'approve' }, now)

    assert.equal(result.status, 200)
    assert.deepEqual(result.body, { success: true, action: 'reviewed', pubSlug: 'test-pub' })
    assert.equal(supabase.calls.pubUpdate, null)
    assert.equal(supabase.calls.historyInsert, null)
    assert.deepEqual(supabase.calls.reportUpdate, {
      status: 'reviewed',
      verified_at: '2026-06-01T04:30:00.000Z',
      verified_by: 'admin',
    })
  })

  it('blocks aggregator leads from direct approval', async () => {
    const supabase = reviewSupabase({
      id: 4,
      pub_slug: 'test-pub',
      reported_price: 9,
      report_type: 'price_report',
      submission_source: 'aggregator_lead',
    })

    const result = await reviewPriceReport(supabase, { id: 4, action: 'approve' }, now)

    assert.equal(result.status, 409)
    assert.match(String((result.body as { error: string }).error), /independent evidence/)
    assert.equal(supabase.calls.pubUpdate, null)
    assert.equal(supabase.calls.historyInsert, null)
  })
})

function reviewSupabase(report: Record<string, unknown>) {
  const calls: {
    pubUpdate: Record<string, unknown> | null
    reportUpdate: Record<string, unknown> | null
    historyInsert: Record<string, unknown> | null
  } = {
    pubUpdate: null,
    reportUpdate: null,
    historyInsert: null,
  }

  return {
    calls,
    from(table: string) {
      if (table === 'price_reports') {
        return {
          select() {
            return {
              eq() {
                return {
                  single() {
                    return Promise.resolve({ data: report, error: null })
                  },
                }
              },
            }
          },
          update(updates: Record<string, unknown>) {
            calls.reportUpdate = updates
            return {
              eq() {
                return Promise.resolve({ error: null })
              },
            }
          },
        }
      }

      if (table === 'pubs') {
        return {
          update(updates: Record<string, unknown>) {
            calls.pubUpdate = updates
            return {
              eq() {
                return {
                  select() {
                    return Promise.resolve({ data: [{ slug: 'test-pub' }], error: null })
                  },
                }
              },
            }
          },
          select() {
            return {
              eq() {
                return {
                  single() {
                    return Promise.resolve({ data: { id: 42 }, error: null })
                  },
                }
              },
            }
          },
        }
      }

      if (table === 'price_history') {
        return {
          insert(row: Record<string, unknown>) {
            calls.historyInsert = row
            return Promise.resolve({ error: null })
          },
        }
      }

      throw new Error(`Unexpected table ${table}`)
    },
  }
}
