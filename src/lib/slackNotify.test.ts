import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { formatNewReportMessage, formatPendingReminderMessage, sendSlackMessage } from './slackNotify'

describe('formatNewReportMessage', () => {
  it('formats a standard price report', () => {
    const message = formatNewReportMessage({
      pubName: 'The Norfolk Hotel',
      suburb: 'Fremantle',
      reportedPrice: 12.5,
      beerType: 'Swan Draught',
      reporterName: 'Anonymous',
      reportType: 'price_report',
      submissionSource: 'manual',
    })

    assert.equal(
      message,
      'New price report: Swan Draught $12.50 at The Norfolk Hotel (Fremantle) — via manual, by Anonymous. Review: https://perthpintprices.com/admin'
    )
  })

  it('labels happy hour reports and handles missing beer/suburb', () => {
    const message = formatNewReportMessage({
      pubName: 'gage-roads-brew-co',
      suburb: null,
      reportedPrice: 9,
      beerType: null,
      reporterName: 'Macca',
      reportType: 'happy_hour_report',
      submissionSource: 'menu_scan',
    })

    assert.equal(
      message,
      'New happy hour price: $9.00 at gage-roads-brew-co — via menu_scan, by Macca. Review: https://perthpintprices.com/admin'
    )
  })

  it('formats outdated flags without a price', () => {
    const message = formatNewReportMessage({
      pubName: 'The Court',
      suburb: 'Perth',
      reportedPrice: 0,
      beerType: null,
      reporterName: 'Anonymous',
      reportType: 'outdated_flag',
      submissionSource: 'stale_flag',
    })

    assert.equal(
      message,
      'Stale price flagged at The Court (Perth) by Anonymous. Review: https://perthpintprices.com/admin'
    )
  })
})

describe('formatPendingReminderMessage', () => {
  it('returns null when the queue is empty', () => {
    const message = formatPendingReminderMessage({
      pendingReports: 0,
      oldestReportAt: null,
      pendingSubmissions: 0,
    })

    assert.equal(message, null)
  })

  it('includes counts and the age of the oldest report', () => {
    const message = formatPendingReminderMessage({
      pendingReports: 3,
      oldestReportAt: '2026-06-06T11:49:29.000Z',
      pendingSubmissions: 1,
      now: new Date('2026-06-10T12:00:00.000Z'),
    })

    assert.equal(
      message,
      'Review queue: 3 price reports waiting (oldest 4 days old), 1 pub submission waiting. https://perthpintprices.com/admin'
    )
  })

  it('uses singular wording and skips the age for same-day reports', () => {
    const message = formatPendingReminderMessage({
      pendingReports: 1,
      oldestReportAt: '2026-06-10T08:00:00.000Z',
      pendingSubmissions: 0,
      now: new Date('2026-06-10T12:00:00.000Z'),
    })

    assert.equal(
      message,
      'Review queue: 1 price report waiting. https://perthpintprices.com/admin'
    )
  })
})

describe('sendSlackMessage', () => {
  it('is a no-op when SLACK_WEBHOOK_URL is not set', async () => {
    const original = process.env.SLACK_WEBHOOK_URL
    delete process.env.SLACK_WEBHOOK_URL
    try {
      assert.equal(await sendSlackMessage('test'), false)
    } finally {
      if (original !== undefined) process.env.SLACK_WEBHOOK_URL = original
    }
  })
})
