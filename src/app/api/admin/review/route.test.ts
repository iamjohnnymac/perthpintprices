import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { NextRequest } from 'next/server'
import { handleAdminReview } from './route'

describe('admin review authentication', () => {
  it('uses the shared durable limiter before privileged writes', async () => {
    process.env.ADMIN_PASSWORD = 'correct-password'
    const client = {
      async rpc(name: string) {
        assert.equal(name, 'reserve_admin_auth_attempt')
        return { data: { allowed: false, retry_after_seconds: 700 }, error: null }
      },
    }
    const response = await handleAdminReview(new NextRequest('http://localhost/api/admin/review', {
      method: 'POST',
      headers: { authorization: 'Bearer wrong-password', 'x-forwarded-for': '192.0.2.3' },
      body: '{}',
    }), { getServiceClient: () => client as never })

    assert.equal(response.status, 429)
    assert.equal(response.headers.get('retry-after'), '700')
  })
})

type ReportRow = Record<string, unknown>

/**
 * Minimal service-client double: passes the admin limiter, serves one price
 * report, and answers the pubs update with the rows a real update would return.
 */
function reviewClient(report: ReportRow, pubs: Array<{ slug: string; suburb: string | null }>) {
  const pubUpdates: Array<{ slug: unknown; payload: Record<string, unknown> }> = []

  function query(table: string) {
    let updatePayload: Record<string, unknown> | null = null
    let slugFilter: unknown = null
    const rows = () => {
      if (table === 'price_reports') return [report]
      if (table === 'pubs') return pubs.filter(pub => pub.slug === slugFilter).map(pub => ({ id: 1, ...pub }))
      return []
    }
    const builder = {
      select: () => builder,
      insert: async () => ({ data: null, error: null }),
      update(payload: Record<string, unknown>) {
        updatePayload = payload
        return builder
      },
      eq(column: string, value: unknown) {
        if (column === 'slug') {
          slugFilter = value
          if (table === 'pubs' && updatePayload) pubUpdates.push({ slug: value, payload: updatePayload })
        }
        return builder
      },
      async single() {
        const [row] = rows()
        return row ? { data: row, error: null } : { data: null, error: { message: 'not found' } }
      },
      then(resolve: (value: { data: unknown[]; error: null }) => unknown) {
        return Promise.resolve({ data: rows(), error: null }).then(resolve)
      },
    }
    return builder
  }

  return {
    pubUpdates,
    async rpc(name: string) {
      return name === 'reserve_admin_auth_attempt'
        ? { data: { allowed: true }, error: null }
        : { data: null, error: null }
    },
    from: (table: string) => query(table),
  }
}

async function reviewPrice(
  report: ReportRow,
  pubs: Array<{ slug: string; suburb: string | null }>,
  body: Record<string, unknown>,
) {
  process.env.ADMIN_PASSWORD = 'correct-password'
  const client = reviewClient(report, pubs)
  const tags: string[] = []
  const paths: string[] = []
  const response = await handleAdminReview(new NextRequest('http://localhost/api/admin/review', {
    method: 'POST',
    headers: { authorization: 'Bearer correct-password', 'x-forwarded-for': '192.0.2.4' },
    body: JSON.stringify({ type: 'price_report', id: 'report-1', ...body }),
  }), {
    getServiceClient: () => client as never,
    revalidateTag: tag => { tags.push(tag) },
    revalidatePath: path => { paths.push(path) },
  })
  return { response, tags, paths, pubUpdates: client.pubUpdates }
}

const haynes = { slug: 'haynes-bar-and-grill', suburb: 'Armadale' }
const regularReport = {
  id: 'report-1',
  pub_slug: haynes.slug,
  reported_price: 9,
  beer_type: 'House Lager',
  report_type: 'price_report',
  submission_source: 'manual',
  notes: null,
}

describe('admin price report cache invalidation', () => {
  it('expires the pub detail entry as well as the shared list cache on approval', async () => {
    const { response, tags, paths } = await reviewPrice(regularReport, [haynes], { action: 'approve' })

    assert.equal(response.status, 200)
    assert.deepEqual(tags, ['pubs', 'pub:haynes-bar-and-grill'])
    assert.deepEqual(paths, ['/armadale/haynes-bar-and-grill', '/armadale'])
  })

  it('expires the same entries for an approved happy-hour price', async () => {
    const { response, tags, paths, pubUpdates } = await reviewPrice(
      { ...regularReport, report_type: 'happy_hour_report', reported_price: 7 },
      [haynes],
      { action: 'approve' },
    )

    assert.equal(response.status, 200)
    assert.equal(pubUpdates[0].payload.happy_hour_price, 7)
    assert.equal('price' in pubUpdates[0].payload, false)
    assert.deepEqual(tags, ['pubs', 'pub:haynes-bar-and-grill'])
    assert.deepEqual(paths, ['/armadale/haynes-bar-and-grill', '/armadale'])
  })

  it('follows the admin pub override, not the slug on the report', async () => {
    const target = { slug: 'the-norfolk-hotel', suburb: 'Fremantle' }
    const { response, tags, paths, pubUpdates } = await reviewPrice(
      regularReport,
      [haynes, target],
      { action: 'approve', target_slug: target.slug },
    )

    assert.equal(response.status, 200)
    assert.equal(pubUpdates[0].slug, target.slug)
    assert.deepEqual(tags, ['pubs', 'pub:the-norfolk-hotel'])
    assert.deepEqual(paths, ['/fremantle/the-norfolk-hotel', '/fremantle'])
  })

  it('still expires both tags when the pub row has no suburb to build a path from', async () => {
    const { response, tags, paths } = await reviewPrice(
      regularReport,
      [{ slug: haynes.slug, suburb: null }],
      { action: 'approve' },
    )

    assert.equal(response.status, 200)
    assert.deepEqual(tags, ['pubs', 'pub:haynes-bar-and-grill'])
    assert.deepEqual(paths, [])
  })

  it('expires nothing when no pub row was written', async () => {
    const reviewedFlag = await reviewPrice(
      { ...regularReport, report_type: 'outdated_flag', submission_source: 'stale_flag' },
      [haynes],
      { action: 'approve' },
    )
    assert.equal(reviewedFlag.response.status, 200)
    assert.deepEqual(reviewedFlag.pubUpdates, [])
    assert.deepEqual([reviewedFlag.tags, reviewedFlag.paths], [[], []])

    const rejected = await reviewPrice(regularReport, [haynes], { action: 'reject' })
    assert.equal(rejected.response.status, 200)
    assert.deepEqual([rejected.tags, rejected.paths], [[], []])

    const missingPub = await reviewPrice(regularReport, [], { action: 'approve' })
    assert.equal(missingPub.response.status, 404)
    assert.deepEqual([missingPub.tags, missingPub.paths], [[], []])
  })
})
