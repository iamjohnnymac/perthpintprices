import { NextRequest, NextResponse } from 'next/server'
import { serviceClient } from '@/lib/supabaseGateway'

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

  // Price is optional now — sometimes the bartender only gives us the happy hour
  // (e.g. AI receptionist transferred before we got the price). Any data beats
  // none. We only refuse if the tool fires with literally nothing useful.
  const priceNum = typeof body.price === 'string' ? parseFloat(body.price) : body.price
  const hasPrice = priceNum != null && !isNaN(priceNum)
  const hasHH = !!(body.happy_hour && body.happy_hour.trim())
  const hasBrand = !!(body.beer_type && body.beer_type.trim())

  if (!hasPrice && !hasHH && !hasBrand) {
    return NextResponse.json({ ok: false, error: 'no data to record' }, { status: 400 })
  }

  let pintPrice: number | null = null
  if (hasPrice) {
    const unitMultiplier = UNIT_TO_PINT[body.unit || 'pint'] ?? 1
    pintPrice = Number((priceNum! * unitMultiplier).toFixed(2))
    if (pintPrice < 5 || pintPrice > 20) {
      // Keep processing HH / brand even if price is implausible — discard the price only.
      pintPrice = null
    }
  }

  const supabase = serviceClient()

  const { data: pub, error: fetchErr } = await supabase
    .from('pubs')
    .select('id, name, price, price_verified')
    .eq('slug', pubSlug)
    .single()
  if (fetchErr || !pub) {
    console.error('[agent tool] no pub for slug', pubSlug)
    return NextResponse.json({ ok: false, error: 'pub not found' }, { status: 404 })
  }

  // Phone agent data is the source of truth — write whatever fields we got.
  const updates: Record<string, unknown> = {
    last_verified: new Date().toISOString(),
  }
  if (pintPrice != null) {
    updates.price = pintPrice
    updates.price_verified = true
  }
  if (hasBrand) updates.beer_type = body.beer_type
  if (hasHH) updates.happy_hour = body.happy_hour!.trim()

  const { error: upErr } = await supabase.from('pubs').update(updates).eq('id', pub.id)
  if (upErr) {
    console.error('[agent tool] update failed:', upErr.message)
    return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 })
  }

  // Only append to price_history if we actually got a price (happy-hour-only
  // captures aren't price events).
  if (pintPrice != null) {
    await supabase.from('price_history').insert({
      pub_id: pub.id,
      price: pintPrice,
      beer_type: body.beer_type || null,
      change_type: 'phone_agent',
      source: body.conversation_id ? `ElevenLabs ${body.conversation_id}` : 'phone_agent',
    })
  }

  console.log(`[agent tool] wrote price=${pintPrice} beer=${body.beer_type || 'n/a'} for ${pub.name}`)

  return NextResponse.json({
    ok: true,
    recorded: true,
    pub_id: pub.id,
    pint_price: pintPrice,
    beer_type: body.beer_type || null,
    happy_hour: hasHH ? body.happy_hour : null,
  })
}
