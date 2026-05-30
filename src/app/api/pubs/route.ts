import { anonClient } from '@/lib/supabaseGateway';
import { NextResponse } from 'next/server';

const supabase = anonClient();

export const revalidate = 300; // cache for 5 minutes

export async function GET() {
  const { data, error } = await supabase
    .from('pubs')
    .select('slug, name, suburb')
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to load pubs' }, { status: 500 });
  }

  return NextResponse.json(data);
}
