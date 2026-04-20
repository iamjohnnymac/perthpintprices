import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ElevenLabs "server tool" callback. The pub_slug arrives via URL path (filled
// in by ElevenLabs from the conversation's {{pub_slug}} dynamic variable, NOT
// by the LLM) so Andrew can't accidentally rewrite it. Body only carries
// things Andrew actually learned in the conversation.

interface ToolBody {
  price?: number | string
  beer_type?: string | null
  confidence?: 'high' | 'medium' | 'low'
  raw_quote?: string | null
  unit?: 'pint' | 'schooner' | 'pot' | null
  happy_hour?: string | null
  conversation_id?: string
}

const UNIT_TO_PINT: Record<string, number> = {
  pint: 1,
  schooner: 570 / 425,
  pot: 570 / 285,
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const expected = process.env.AGENT_WEBHOOK_SECRET
  if (!expected) return NextResponse.json({ ok: false, error: 'server misconfigured' }, { status: 500 })

  const got = req.headers.get('x-agent-secret')
  if (got !== expected) {
    console.warn('[agent tool] bad secret header')
    return NextResponse.json({ ok: false, error: 'unauthorised' }, { status: 401 })
  }

  const pubSlug = params.slug
  let body: ToolBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'bad json' }, { status: 400 })
  }

  const priceNum = typeof body.price === 'string' ? parseFloat(body.price) : body.price
  if (priceNum == null || isNaN(priceNum)) {
    return NextResponse.json({ ok: false, error: 'missing price' }, { status: 400 })
  }

  const unitMultiplier = UNIT_TO_PINT[body.unit || 'pint'] ?? 1
  const pintPrice = Number((priceNum * unitMultiplier).toFixed(2))

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
    .eq('slug', pubSlug)
    .single()
  if (fetchErr || !pub) {
    console.error('[agent tool] no pub for slug', pubSlug)
    return NextResponse.json({ ok: false, error: 'pub not found' }, { status: 404 })
  }

  if (pub.price != null && pub.price_verified) {
    return NextResponse.json(
      { ok: true, recorded: false, reason: 'pub already has a verified price' },
      { status: 200 }
    )
  }

  const updates: Record<string, unknown> = {
    price: pintPrice,
    price_verified: false,
    last_verified: new Date().toISOString(),
  }
  if (body.beer_type) updates.beer_type = body.beer_type
  if (body.happy_hour && body.happy_hour.trim()) updates.happy_hour = body.happy_hour.trim()

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
