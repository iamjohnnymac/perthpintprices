import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { anonClient, serviceClient } from '@/lib/supabaseGateway'
import { toSuburbSlug } from '@/lib/urls'
import { formatNewReportMessage, sendSlackMessage } from '@/lib/slackNotify'
import { preparePriceReport } from './intake'

const supabase = anonClient()

async function revalidateReportedPub(pubSlug: string) {
  revalidateTag(`pub:${pubSlug}`, 'max')

  const { data: pub } = await supabase
    .from('pubs')
    .select('slug, name, suburb')
    .eq('slug', pubSlug)
    .single()

  if (pub?.slug && pub.suburb) {
    revalidatePath(`/${toSuburbSlug(pub.suburb)}/${pub.slug}`)
  }

  return pub
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Simple IP-based rate limiting
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
    const ipHash = await hashString(ip)
    const prepared = preparePriceReport(body, ipHash)
    if (!prepared.ok) {
      return NextResponse.json({ error: prepared.error }, { status: prepared.status })
    }

    const rateLimit = prepared.value.isMenuScan ? 15 : 1

    // price_reports holds reporter names and IP hashes, so the public key can
    // only insert. The rate-limit lookup reads through the service role.
    const service = serviceClient()
    const { data: recentReport } = await service
      .from('price_reports')
      .select('id')
      .eq('pub_slug', prepared.value.pubSlug)
      .eq('ip_hash', ipHash)
      .gte('created_at', new Date(Date.now() - 3600000).toISOString())

    if (recentReport && recentReport.length >= rateLimit) {
      return NextResponse.json({ error: 'You already reported for this pub recently. Try again in an hour.' }, { status: 429 })
    }

    const { error } = await supabase
      .from('price_reports')
      .insert(prepared.value.insertData)

    if (error) {
      console.error('Error inserting price report:', error)
      return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 })
    }

    const pub = await revalidateReportedPub(prepared.value.pubSlug)

    const insert = prepared.value.insertData
    await sendSlackMessage(formatNewReportMessage({
      pubName: pub?.name || prepared.value.pubSlug,
      suburb: pub?.suburb || null,
      reportedPrice: Number(insert.reported_price) || 0,
      beerType: typeof insert.beer_type === 'string' ? insert.beer_type : null,
      reporterName: typeof insert.reporter_name === 'string' ? insert.reporter_name : 'Anonymous',
      reportType: String(insert.report_type),
      submissionSource: String(insert.submission_source),
    }))

    const message = body.outdated === true
      ? 'Thanks for flagging — we\'ll check this price.'
      : 'Price reported. Thanks for contributing.'

    return NextResponse.json({ success: true, message })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str + 'arvo-salt-2025')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16)
}
