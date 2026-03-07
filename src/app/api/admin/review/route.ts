import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { timingSafeEqual } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmeGtvYmx2Z3R0ZWx6Ym9lbnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUwNjgsImV4cCI6MjA4Njc2MTA2OH0.qLy6B-VeVnMh0QSOxHK3uQEJ6iZr6xNHmfKov_7B-fY'
)

export const dynamic = 'force-dynamic'

function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'utf-8')
    const bufB = Buffer.from(b, 'utf-8')
    if (bufA.length !== bufB.length) {
      timingSafeEqual(bufA, Buffer.alloc(bufA.length))
      return false
    }
    return timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const password = authHeader?.replace('Bearer ', '') || ''
  if (!process.env.ADMIN_PASSWORD || !safeCompare(password, process.env.ADMIN_PASSWORD)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { type, id, action } = body

  if (!type || !id || !action) {
    return NextResponse.json({ error: 'Missing type, id, or action' }, { status: 400 })
  }

  try {
    if (type === 'price_report') {
      if (action === 'approve') {
        const { data: report, error: reportErr } = await supabase
          .from('price_reports')
          .select('*')
          .eq('id', id)
          .single()

        if (reportErr || !report) {
          return NextResponse.json({ error: 'Report not found' }, { status: 404 })
        }

        const now = new Date().toISOString()

        // Update pub price
        const { error: pubErr } = await supabase
          .from('pubs')
          .update({
            price: report.reported_price,
            beer_type: report.beer_type || undefined,
            price_verified: true,
            last_verified: now,
            last_updated: now,
          })
          .eq('slug', report.pub_slug)

        if (pubErr) {
          return NextResponse.json({ error: 'Failed to update pub: ' + pubErr.message }, { status: 500 })
        }

        // Get pub_id for price_history
        const { data: pub } = await supabase
          .from('pubs')
          .select('id')
          .eq('slug', report.pub_slug)
          .single()

        if (pub) {
          await supabase.from('price_history').insert({
            pub_id: pub.id,
            price: report.reported_price,
            change_type: 'update',
            source: 'crowdsourced',
            changed_at: now,
          })
        }

        // Mark report as verified
        await supabase
          .from('price_reports')
          .update({ status: 'verified', verified_at: now, verified_by: 'admin' })
          .eq('id', id)

        return NextResponse.json({ success: true, action: 'approved', pubSlug: report.pub_slug })

      } else if (action === 'reject') {
        await supabase
          .from('price_reports')
          .update({ status: 'rejected', verified_at: new Date().toISOString(), verified_by: 'admin' })
          .eq('id', id)

        return NextResponse.json({ success: true, action: 'rejected' })
      }

    } else if (type === 'pub_submission') {
      if (action === 'approve') {
        const { data: sub, error: subErr } = await supabase
          .from('pub_submissions')
          .select('*')
          .eq('id', id)
          .single()

        if (subErr || !sub) {
          return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
        }

        const slug = sub.pub_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

        const { data: existing } = await supabase
          .from('pubs')
          .select('slug')
          .eq('slug', slug)
          .single()

        if (existing) {
          return NextResponse.json({ error: 'A pub with this name already exists' }, { status: 409 })
        }

        const now = new Date().toISOString()

        const { error: createErr } = await supabase
          .from('pubs')
          .insert({
            slug,
            name: sub.pub_name,
            suburb: sub.suburb,
            address: sub.address || null,
            price: sub.price || null,
            beer_type: sub.beer_type || null,
            price_verified: sub.price ? true : false,
            last_verified: sub.price ? now : null,
            last_updated: now,
          })

        if (createErr) {
          return NextResponse.json({ error: 'Failed to create pub: ' + createErr.message }, { status: 500 })
        }

        await supabase
          .from('pub_submissions')
          .update({ status: 'approved', reviewed_at: now })
          .eq('id', id)

        return NextResponse.json({ success: true, action: 'approved', slug })

      } else if (action === 'reject') {
        await supabase
          .from('pub_submissions')
          .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
          .eq('id', id)

        return NextResponse.json({ success: true, action: 'rejected' })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
