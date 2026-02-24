import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmeGtvYmx2Z3R0ZWx6Ym9lbnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUwNjgsImV4cCI6MjA4Njc2MTA2OH0.qLy6B-VeVnMh0QSOxHK3uQEJ6iZr6xNHmfKov_7B-fY'
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { pub_slug, reported_price, beer_type, reporter_name } = body

    if (!pub_slug || !reported_price) {
      return NextResponse.json({ error: 'pub_slug and reported_price are required' }, { status: 400 })
    }

    const price = parseFloat(reported_price)
    if (isNaN(price) || price <= 0 || price >= 100) {
      return NextResponse.json({ error: 'Price must be between $0.01 and $99.99' }, { status: 400 })
    }

    // Simple IP-based rate limiting (hash the IP)
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
    const ipHash = await hashString(ip)

    // Check if same IP reported same pub in last hour
    const { data: recentReport } = await supabase
      .from('price_reports')
      .select('id')
      .eq('pub_slug', pub_slug)
      .eq('ip_hash', ipHash)
      .gte('created_at', new Date(Date.now() - 3600000).toISOString())
      .limit(1)

    if (recentReport && recentReport.length > 0) {
      return NextResponse.json({ error: 'You already reported a price for this pub recently. Try again in an hour.' }, { status: 429 })
    }

    const { error } = await supabase
      .from('price_reports')
      .insert({
        pub_slug,
        reported_price: price,
        beer_type: beer_type || null,
        reporter_name: reporter_name || 'Anonymous',
        ip_hash: ipHash,
      })

    if (error) {
      console.error('Error inserting price report:', error)
      return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Price reported! Thanks for contributing.' })
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
      .select('reported_price, beer_type, reporter_name, created_at, status')
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
  const data = encoder.encode(str + 'pintdex-salt-2025')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16)
}
