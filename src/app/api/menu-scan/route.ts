import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

export const maxDuration = 30

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmeGtvYmx2Z3R0ZWx6Ym9lbnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUwNjgsImV4cCI6MjA4Njc2MTA2OH0.qLy6B-VeVnMh0QSOxHK3uQEJ6iZr6xNHmfKov_7B-fY'
)

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
})

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB (phone photos can be large)

interface ExtractedItem {
  beer_type: string
  price: number
  price_type: 'regular' | 'happy_hour'
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    const formData = await req.formData()
    const image = formData.get('image') as File | null
    const pubSlug = formData.get('pub_slug') as string | null

    if (!image || !pubSlug) {
      return NextResponse.json({ error: 'Image and pub_slug are required' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(image.type)) {
      return NextResponse.json({ error: 'Image must be JPEG, PNG, or WebP' }, { status: 400 })
    }

    if (image.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Image must be under 5MB' }, { status: 400 })
    }

    // Rate limit: 3 scans per IP per 24h
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
    const ipHash = await hashString(ip)

    const { data: recentScans } = await supabase
      .from('price_reports')
      .select('id')
      .eq('ip_hash', ipHash)
      .eq('report_type', 'menu_scan')
      .gte('created_at', new Date(Date.now() - 86400000).toISOString())

    if (recentScans && recentScans.length >= 3) {
      return NextResponse.json({ error: 'Scan limit reached. Try again tomorrow.' }, { status: 429 })
    }

    // Base64-encode the image
    const buffer = await image.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const dataUrl = `data:${image.type};base64,${base64}`

    // Call AI vision model via OpenRouter
    const completion = await openai.chat.completions.create({
      model: 'qwen/qwen3.5-flash-02-23',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extract beer and cider names with their pint prices from this menu photo. Return ONLY a valid JSON array with no other text. Each item should have: "beer_type" (string, the drink name), "price" (number, the pint price in dollars), "price_type" ("regular" or "happy_hour"). Only extract pint-sized drinks. If a section is labelled happy hour or similar, use "happy_hour" as price_type. If you cannot extract any prices, return an empty array []. Do not guess or make up prices.`,
            },
            {
              type: 'image_url',
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
    })

    const rawText = completion.choices?.[0]?.message?.content || '[]'

    // Parse the JSON response - handle markdown code blocks
    let parsed: unknown
    try {
      const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      console.error('Failed to parse AI response:', rawText)
      return NextResponse.json({ items: [], raw_text: rawText })
    }

    // Validate and filter items
    const items: ExtractedItem[] = []
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        const price = parseFloat(item?.price)
        const beerType = String(item?.beer_type || '').trim()
        const priceType = item?.price_type === 'happy_hour' ? 'happy_hour' : 'regular'

        if (beerType && !isNaN(price) && price >= 3 && price <= 30) {
          items.push({ beer_type: beerType, price, price_type: priceType })
        }
      }
    }

    return NextResponse.json({ items, raw_text: rawText })
  } catch (err) {
    console.error('Menu scan error:', err)
    return NextResponse.json({ error: 'Failed to scan menu' }, { status: 500 })
  }
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str + 'arvo-salt-2025')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16)
}
