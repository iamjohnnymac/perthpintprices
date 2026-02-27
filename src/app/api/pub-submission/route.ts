import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmeGtvYmx2Z3R0ZWx6Ym9lbnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUwNjgsImV4cCI6MjA4Njc2MTA2OH0.qLy6B-VeVnMh0QSOxHK3uQEJ6iZr6xNHmfKov_7B-fY'
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pub_name, suburb, address, price, beer_type, submitter_email } = body;

    if (!pub_name || !suburb || !price) {
      return NextResponse.json({ error: 'pub_name, suburb, and price are required' }, { status: 400 });
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0 || parsedPrice >= 100) {
      return NextResponse.json({ error: 'Price must be between $0.01 and $99.99' }, { status: 400 });
    }

    // IP-based rate limiting: 3 submissions per IP per day
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
    const ipHash = await hashString(ip);

    const { data: recentSubmissions } = await supabase
      .from('pub_submissions')
      .select('id')
      .eq('ip_hash', ipHash)
      .gte('created_at', new Date(Date.now() - 86400000).toISOString());

    if (recentSubmissions && recentSubmissions.length >= 3) {
      return NextResponse.json({ error: 'You\'ve reached the daily submission limit. Try again tomorrow.' }, { status: 429 });
    }

    const { error } = await supabase
      .from('pub_submissions')
      .insert({
        pub_name,
        suburb,
        address: address || null,
        price: parsedPrice,
        beer_type: beer_type || null,
        submitter_email: submitter_email || null,
        ip_hash: ipHash,
      });

    if (error) {
      console.error('Error inserting pub submission:', error);
      return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Pub submitted! We\'ll review it shortly.' });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str + 'arvo-salt-2025');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}
