import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Webhook receiver for the "Andrew — Perth Pint Price Sweeper" ElevenLabs convai agent.
// Andrew calls Perth pubs to ask their cheapest pint and any happy hour, then hits this
// endpoint with the structured payload. We append the data to the price_reports table so
// it surfaces alongside user-submitted reports for review/approval.
//
// Auth: the agent sends a shared secret in the `x-agent-secret` header. Set
// AGENT_WEBHOOK_SECRET in Vercel env to the same value configured in the agent's
// `record_price` webhook tool over at https://elevenlabs.io/app/agents.

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

const REPORTER_NAME = 'Andrew (AI Caller)'
// Synthetic ip_hash so the NOT NULL constraint is satisfied without a real client IP.
// Length matches the 16-char SHA-256 prefix used by the user-facing /api/price-report route.
const ANDREW_IP_HASH = 'andrew_ai_caller'

interface RecordPriceBody {
  price?: number
  beer_type?: string
  unit?: 'pint' | 'schooner' | 'pot'
  happy_hour?: string
  confidence?: 'high' | 'medium' | 'low'
  raw_quote?: string
}

export async function POST(
  req: NextRequest,
  { params }: { params: { pub_slug: string } }
) {
  // 1. Auth — shared secret, same value as configured in the agent's webhook tool.
  const expected = process.env.AGENT_WEBHOOK_SECRET
  if (!expected) {
    console.error('record-price: AGENT_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'misconfigured' }, { status: 500 })
  }
  if (req.headers.get('x-agent-secret') !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { pub_slug } = params
  if (!pub_slug) {
    return NextResponse.json({ error: 'pub_slug is required' }, { status: 400 })
  }

  // 2. Parse + light validation.
  let body: RecordPriceBody
  try {
    body = (await req.json()) as RecordPriceBody
  } catch {
    return NextResponse.json({ error: 'invalid json body' }, { status: 400 })
  }

  const { price, beer_type, unit, happy_hour, confidence, raw_quote } = body

  // 3. Confirm the pub exists so we don't accept reports for unknown slugs.
  const { data: pub, error: pubErr } = await supabase
    .from('pubs')
    .select('id, name')
    .eq('slug', pub_slug)
    .single()

  if (pubErr || !pub) {
    return NextResponse.json({ error: 'pub not found', pub_slug }, { status: 404 })
  }

  // 4. Build inserts — one row per data point so the existing admin review UI handles them naturally.
  const noteParts = [
    'Andrew AI call',
    confidence ? `confidence: ${confidence}` : null,
    raw_quote ? `quote: "${raw_quote}"` : null,
  ].filter(Boolean) as string[]
  const baseNote = noteParts.join(' | ')

  const inserts: Record<string, unknown>[] = []

  if (typeof price === 'number' && Number.isFinite(price) && price >= 3 && price <= 30) {
    inserts.push({
      pub_slug,
      reported_price: price,
      beer_type: beer_type || null,
      reporter_name: REPORTER_NAME,
      ip_hash: ANDREW_IP_HASH,
      report_type: 'price_report',
      notes: `${baseNote} | unit: ${unit || 'pint'}`,
    })
  }

  if (typeof happy_hour === 'string' && happy_hour.trim()) {
    inserts.push({
      pub_slug,
      reported_price: 0,
      beer_type: null,
      reporter_name: REPORTER_NAME,
      ip_hash: ANDREW_IP_HASH,
      report_type: 'happy_hour_report',
      notes: `${baseNote} | happy hour: ${happy_hour.trim()}`,
    })
  }

  if (inserts.length === 0) {
    // Andrew is told to call this tool whenever they have ANY useful data; if neither price
    // nor happy hour is present we still 200 so the agent doesn't retry.
    return NextResponse.json({ ok: true, inserted: 0, pub: pub.name, message: 'no actionable data' })
  }

  const { error: insErr } = await supabase.from('price_reports').insert(inserts)
  if (insErr) {
    console.error('record-price: insert failed', { pub_slug, err: insErr })
    return NextResponse.json({ error: 'failed to record' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, inserted: inserts.length, pub: pub.name })
}
