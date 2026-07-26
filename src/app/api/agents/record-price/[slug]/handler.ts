import { NextRequest, NextResponse } from 'next/server'
import { ANDREW_DEMO_RESERVED_SLUG } from '@/lib/andrewDemo'
import {
  parseAndrewDemoBeer,
  parseAndrewDemoConfidence,
  parseAndrewDemoHappyHour,
  parseAndrewDemoPrice,
  parseAndrewDemoUnit,
} from '@/lib/andrewDemoFields'
import { normalizePriceConfidence } from '@/lib/priceProvenance'
import { normalizeVoicePintPrice, parseVoiceNumber } from '@/lib/voicePrice'

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

interface RecordPriceDeps {
  supabase?: {
    from(table: string): any
    rpc(fn: string, args: Record<string, unknown>): any
  }
  getSupabase?: () => {
    from(table: string): any
    rpc(fn: string, args: Record<string, unknown>): any
  }
  now?: Date
  afterWrite?: (pub: { slug: string; suburb: string }) => void
}

export async function handleRecordPrice(
  req: NextRequest,
  { params }: { params: { slug: string } },
  deps: RecordPriceDeps,
) {
  const expected = process.env.ELEVENLABS_RECORD_PRICE_TOOL_SECRET
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

  if (pubSlug === ANDREW_DEMO_RESERVED_SLUG) {
    const pintPrice = parseAndrewDemoPrice(body.price, body.unit)
    const beerType = parseAndrewDemoBeer(body.beer_type)
    const happyHour = parseAndrewDemoHappyHour(body.happy_hour)
    if (pintPrice == null && beerType == null && happyHour == null) {
      return NextResponse.json({ ok: false, error: 'no valid demo data to preview' }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      sandbox: true,
      recorded: false,
      proposed: {
        pint_price: pintPrice,
        unit: parseAndrewDemoUnit(body.unit),
        beer_type: beerType,
        happy_hour: happyHour,
        confidence: parseAndrewDemoConfidence(body.confidence),
      },
    })
  }

  // Price is optional now — sometimes the bartender only gives us the happy hour
  // (e.g. AI receptionist transferred before we got the price). Any data beats
  // none. We only refuse if the tool fires with literally nothing useful.
  const hasPrice = parseVoiceNumber(body.price) != null
  const hasHH = !!(body.happy_hour && body.happy_hour.trim())
  const hasBrand = !!(body.beer_type && body.beer_type.trim())

  if (!hasPrice && !hasHH && !hasBrand) {
    return NextResponse.json({ ok: false, error: 'no data to record' }, { status: 400 })
  }

  // Keep processing HH / brand even if price is implausible — discard the price only.
  const pintPrice = hasPrice ? normalizeVoicePintPrice(body.price, body.unit) : null

  const supabase = deps.supabase ?? deps.getSupabase?.()
  if (!supabase) return NextResponse.json({ ok: false, error: 'server misconfigured' }, { status: 500 })

  const { data: pub, error: fetchErr } = await supabase
    .from('pubs')
    .select('id, slug, name, suburb, price, price_verified')
    .eq('slug', pubSlug)
    .single()
  if (fetchErr || !pub) {
    console.error('[agent tool] no pub for slug', pubSlug)
    return NextResponse.json({ ok: false, error: 'pub not found' }, { status: 404 })
  }

  // Phone agent data is the source of truth — write whatever fields we got.
  const updates: Record<string, unknown> = {}
  const verifiedAt = (deps.now ?? new Date()).toISOString()
  const confidence = normalizePriceConfidence(body.confidence)
  if (pintPrice != null) {
    updates.price = pintPrice
    updates.price_verified = true
    updates.last_verified = verifiedAt
    updates.price_verified_at = verifiedAt
    updates.price_source = 'andrew'
    updates.price_confidence = confidence
  }
  if (hasBrand) updates.beer_type = body.beer_type
  if (hasHH) updates.happy_hour = body.happy_hour!.trim()

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: false, error: 'price out of range, no other data' }, { status: 400 })
  }

  const priceHistory = pintPrice != null
    ? {
      pub_id: pub.id,
      price: pintPrice,
      beer_type: body.beer_type || null,
      change_type: 'phone_agent',
      source: body.conversation_id ? `ElevenLabs ${body.conversation_id}` : 'phone_agent',
      verified_at: verifiedAt,
      confidence,
    }
    : null
  const { error: writeError } = await supabase.rpc('record_agent_price', {
    p_pub_id: pub.id,
    p_pub_updates: updates,
    p_price_history: priceHistory,
  })
  if (writeError) {
    console.error('[agent tool] transaction failed:', writeError.message)
    return NextResponse.json({ ok: false, error: writeError.message }, { status: 500 })
  }

  deps.afterWrite?.({ slug: pub.slug || pubSlug, suburb: pub.suburb })

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
