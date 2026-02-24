import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmeGtvYmx2Z3R0ZWx6Ym9lbnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUwNjgsImV4cCI6MjA4Njc2MTA2OH0.qLy6B-VeVnMh0QSOxHK3uQEJ6iZr6xNHmfKov_7B-fY'
)

/**
 * POST /api/push/send
 * Send push notifications to subscribers.
 * Protected by PUSH_API_SECRET — only callable by the scraper trigger.
 *
 * Body: {
 *   title: string,
 *   body: string,
 *   url?: string,          // deep link on click
 *   tag?: string,           // notification grouping
 *   renotify?: boolean,     // re-alert on same tag
 *   targetSlugs?: string[], // filter by watched pub slugs (if omitted, sends to ALL)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify API secret
    const authHeader = request.headers.get('authorization')
    if (!process.env.PUSH_API_SECRET || authHeader !== `Bearer ${process.env.PUSH_API_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, body, url, tag, targetSlugs, renotify } = await request.json()

    if (!title || !body) {
      return NextResponse.json({ error: 'Missing title or body' }, { status: 400 })
    }

    // Verify VAPID keys are available
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      console.error('VAPID keys not configured')
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
    }

    // Configure web-push
    webpush.setVapidDetails(
      'mailto:perthpintprices@gmail.com',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    )

    // Fetch matching subscriptions
    let query = supabase.from('push_subscriptions').select('*')
    if (targetSlugs?.length) {
      query = query.overlaps('watched_slugs', targetSlugs)
    }
    const { data: subscriptions, error: fetchError } = await query

    if (fetchError) {
      console.error('Failed to fetch subscriptions:', fetchError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!subscriptions?.length) {
      return NextResponse.json({ sent: 0, failed: 0, total: 0, message: 'No subscribers' })
    }

    // Build notification payload
    const payload = JSON.stringify({
      title,
      body,
      url: url || '/',
      tag: tag || 'pintdex',
      renotify: renotify || false,
    })

    // Send to all matching subscriptions, clean up expired ones
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          )
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number })?.statusCode
          // Clean up expired/unsubscribed endpoints (404/410)
          if (statusCode === 404 || statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
          }
          throw err
        }
      })
    )

    const sent = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    return NextResponse.json({ sent, failed, total: subscriptions.length })
  } catch (err) {
    console.error('Send error:', err)
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 })
  }
}
