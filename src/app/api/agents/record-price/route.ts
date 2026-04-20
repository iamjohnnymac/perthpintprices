import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ElevenLabs "server tool" callback. Andrew invokes this mid-call when a
// bartender has given him a clear pint price and he's confirmed it back.
// Writes the price to the pubs table (non-destructively — never overwrites
// a manually verified price) and appends to price_history.
//
// Auth: ElevenLabs sends a shared secret in `x-agent-secret` (configured on
// the tool's auth header). We reject anything that doesn't match.

interface ToolBody {
  pub_slug?: string
  price?: number | string
  beer_type?: string | null
  confidence?: 'high' | 'medium' | 'low'
  raw_quote?: string | null
  unit?: 'pint' | 'schooner' | 'pot' | null
  conversation_id?: string
}

// Conversion factors — bartender quoted a unit other than pint, normalize to pint.
const UNIT_TO_PINT: Record<string, number> = {
  pint: 1,
  schooner: 570 / 425, // ≈1.341
  pot: 570 / 285, // ≈2.0
}

export async function POST(req: NextRequest) {
  const expected = process.env.AGENT_WEBHOOK_SECRET
  if (!expected) {
    return NextResponse.json({ ok: false, error: 'server misconfigured' }, { status: 500 })
  }
  const got = req.headers.get('x-agent-secret')
  if (got !== expected) {
    console.warn('[agent tool] bad secret header')
    return NextResponse.json({ ok: false, error: 'unauthorised' }, { status: 401 })
  }

  let body: ToolBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'bad json' }, { status: 400 })
  }

  const priceNum = typeof body.price === 'string' ? parseFloat(body.price) : body.price
  if (!body.pub_slug || priceNum == null || isNaN(priceNum)) {
    return NextResponse.json({ ok: false, error: 'missing pub_slug or price' }, { status: 400 })
  }

  // Normalize to pint price if bartender quoted a different unit.
  const unitMultiplier = UNIT_TO_PINT[body.unit || 'pint'] ?? 1
  const pintPrice = Number((priceNum * unitMultiplier).toFixed(2))

  // Plausibility guard — reject obvious misreads.
  if (pintPrice < 5 || pintPrice > 20) {
    return NextResponse.json(
      { ok: false, recorded: false, reason: `price $${pintPrice} outside plausible range` },
      { status: 200 }
    )
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  const { data: pub, error: fetchErr } = await supabase
    .from('pubs')
    .select('id, name, price, price_verified')
    .eq('slug', body.pub_slug)
    .single()
  if (fetchErr || !pub) {
    console.error('[agent tool] no pub for slug', body.pub_slug)
    return NextResponse.json({ ok: false, error: 'pub not found' }, { status: 404 })
  }

  // Only write if the pub doesn't already have a human-verified price.
  // If the pub has a price already but it's not verified, phone-agent can overwrite
  // (the agent is fresher than a months-old research scrape).
  if (pub.price != null && pub.price_verified) {
    return NextResponse.json(
      { ok: true, recorded: false, reason: 'pub has a verified price already' },
      { status: 200 }
    )
  }

  const updates: Record<string, unknown> = {
    price: pintPrice,
    price_verified: false, // flag for human spot-check
    last_verified: new Date().toISOString(),
  }
  if (body.beer_type) updates.beer_type = body.beer_type

  const { error: upErr } = await supabase.from('pubs').update(updates).eq('id', pub.id)
  if (upErr) {
    console.error('[agent tool] update failed:', upErr.message)
    return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 })
  }

  await supabase.from('price_history').insert({
    pub_id: pub.id,
    price: pintPrice,
    beer_type: body.beer_type || null,
    change_type: 'phone_agent',
    source: body.conversation_id ? `ElevenLabs ${body.conversation_id}` : 'phone_agent',
  })

  console.log(`[agent tool] wrote price=${pintPrice} beer=${body.beer_type || 'n/a'} for ${pub.name}`)

  return NextResponse.json({
    ok: true,
    recorded: true,
    pub_id: pub.id,
    pint_price: pintPrice,
    beer_type: body.beer_type || null,
  })
}
