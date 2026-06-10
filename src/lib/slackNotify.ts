/**
 * Slack notifications for the admin review queue.
 *
 * Posts to a Slack incoming webhook (SLACK_WEBHOOK_URL env var). Every send is
 * best-effort: if the env var is missing or Slack is down we log and move on —
 * a notification failure must never break a price report submission or a cron.
 */

const ADMIN_URL = 'https://perthpintprices.com/admin'

export interface NewReportMessageInput {
  pubName: string
  suburb: string | null
  reportedPrice: number
  beerType: string | null
  reporterName: string
  reportType: string
  submissionSource: string
}

export interface PendingReminderInput {
  pendingReports: number
  oldestReportAt: string | null
  pendingSubmissions: number
  now?: Date
}

/** Instant ping for a freshly submitted price report. */
export function formatNewReportMessage(input: NewReportMessageInput): string {
  const where = input.suburb ? `${input.pubName} (${input.suburb})` : input.pubName

  if (input.reportType === 'outdated_flag') {
    return `Stale price flagged at ${where} by ${input.reporterName}. Review: ${ADMIN_URL}`
  }

  const beer = input.beerType ? `${input.beerType} ` : ''
  const kind = input.reportType === 'happy_hour_report' ? 'happy hour price' : 'price report'
  return `New ${kind}: ${beer}$${input.reportedPrice.toFixed(2)} at ${where} — via ${input.submissionSource}, by ${input.reporterName}. Review: ${ADMIN_URL}`
}

/**
 * Daily reminder for anything still sitting in the review queue.
 * Returns null when the queue is empty so the cron stays silent.
 */
export function formatPendingReminderMessage(input: PendingReminderInput): string | null {
  if (input.pendingReports <= 0 && input.pendingSubmissions <= 0) return null

  const parts: string[] = []

  if (input.pendingReports > 0) {
    const noun = input.pendingReports === 1 ? 'price report' : 'price reports'
    let piece = `${input.pendingReports} ${noun} waiting`
    const age = oldestAgeDays(input.oldestReportAt, input.now ?? new Date())
    if (age !== null && age >= 1) {
      piece += ` (oldest ${age === 1 ? '1 day' : `${age} days`} old)`
    }
    parts.push(piece)
  }

  if (input.pendingSubmissions > 0) {
    const noun = input.pendingSubmissions === 1 ? 'pub submission' : 'pub submissions'
    parts.push(`${input.pendingSubmissions} ${noun} waiting`)
  }

  return `Review queue: ${parts.join(', ')}. ${ADMIN_URL}`
}

function oldestAgeDays(oldestAt: string | null, now: Date): number | null {
  if (!oldestAt) return null
  const oldest = new Date(oldestAt).getTime()
  if (Number.isNaN(oldest)) return null
  return Math.floor((now.getTime() - oldest) / 86_400_000)
}

/** Posts a message to the Slack webhook. Never throws. */
export async function sendSlackMessage(text: string): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) {
    console.warn('SLACK_WEBHOOK_URL is not set — skipping Slack notification')
    return false
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) {
      console.error(`Slack webhook responded ${res.status}`)
      return false
    }
    return true
  } catch (err) {
    console.error('Failed to send Slack notification:', err)
    return false
  }
}
