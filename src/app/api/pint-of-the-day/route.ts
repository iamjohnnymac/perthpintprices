import { NextResponse } from 'next/server'
import { getPintOfTheDay } from '@/lib/pintOfTheDay'

// The response is labelled with Perth's current date, so it must not cross a
// local midnight through a stale route cache.
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const decision = await getPintOfTheDay()
    if (!decision) {
      return NextResponse.json({ error: 'No pubs available' }, { status: 500 })
    }
    return NextResponse.json(decision)
  } catch (err) {
    console.error('Pint of the Day error:', err)
    return NextResponse.json({ error: 'Failed to pick pint of the day' }, { status: 500 })
  }
}
