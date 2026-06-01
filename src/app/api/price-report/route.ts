import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { anonClient } from '@/lib/supabaseGateway'
import { toSuburbSlug } from '@/lib/urls'
import { preparePriceReport } from './intake'

const supabase = anonClient()

async function revalidateReportedPub(pubSlug: string) {
  revalidateTag(`pub:${pubSlug}`)

  const { data: pub } = await supabase
    .from('pubs')
    .select('slug, suburb')
    .eq('slug', pubSlug)
    .single()

  if (pub?.slug && pub.suburb) {
    revalidatePath(`/${toSuburbSlug(pub.suburb)}/${pub.slug}`)
  }
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

    const { data: recentReport } = await supabase
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

    await revalidateReportedPub(prepared.value.pubSlug)

    const message = body.outdated === true
      ? 'Thanks for flagging — we\'ll check this price.'
      : 'Price reported. Thanks for contributing.'

    return NextResponse.json({ success: true, message })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

// GET: Fetch reports for a pub or leaderboard
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const pubSlug = searchParams.get('pub')
  const leaderboard = searchParams.get('leaderboard')

  if (leaderboard === 'true') {
    const { data, error } = await supabase
      .from('price_reporter_leaderboard')
      .select('*')
      .limit(20)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
    }
    return NextResponse.json({ leaderboard: data || [] })
  }

  if (pubSlug) {
    const { data, error } = await supabase
      .from('price_reports')
      .select('reported_price, beer_type, reporter_name, created_at, status, report_type, notes')
      .eq('pub_slug', pubSlug)
      .neq('status', 'rejected')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }
    return NextResponse.json({ reports: data || [] })
  }

  return NextResponse.json({ error: 'Provide ?pub=slug or ?leaderboard=true' }, { status: 400 })
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str + 'arvo-salt-2025')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16)
}
