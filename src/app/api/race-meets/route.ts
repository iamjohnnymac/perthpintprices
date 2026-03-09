import { NextResponse } from 'next/server'

export const revalidate = 3600 // Cache for 1 hour

interface RaceMeeting {
  venue: string
  type: 'T' | 'H' | 'G' // Thoroughbred, Harness, Greyhound
  raceCount: number
  firstRace: string | null
  lastRace: string | null
}

interface RaceMeetsResponse {
  meetings: RaceMeeting[]
  date: string
  source: 'tab-api' | 'fallback'
}

// Perth racing follows a fairly predictable weekly schedule
function getFallbackMeetings(): RaceMeeting[] {
  const now = new Date()
  const perthDate = new Date(now.toLocaleString('en-US', { timeZone: 'Australia/Perth' }))
  const day = perthDate.getDay() // 0=Sun, 1=Mon...

  switch (day) {
    case 0: // Sunday
      return [
        { venue: 'Gloucester Park', type: 'H', raceCount: 10, firstRace: '17:00', lastRace: '21:30' },
      ]
    case 1: // Monday
      return [
        { venue: 'Cannington', type: 'G', raceCount: 12, firstRace: '18:30', lastRace: '22:00' },
      ]
    case 2: // Tuesday
      return [
        { venue: 'Cannington', type: 'G', raceCount: 12, firstRace: '18:30', lastRace: '22:00' },
      ]
    case 3: // Wednesday
      return [
        { venue: 'Ascot', type: 'T', raceCount: 8, firstRace: '12:30', lastRace: '16:30' },
        { venue: 'Cannington', type: 'G', raceCount: 12, firstRace: '18:30', lastRace: '22:00' },
      ]
    case 4: // Thursday
      return [
        { venue: 'Cannington', type: 'G', raceCount: 12, firstRace: '18:30', lastRace: '22:00' },
      ]
    case 5: // Friday
      return [
        { venue: 'Gloucester Park', type: 'H', raceCount: 10, firstRace: '17:30', lastRace: '22:00' },
        { venue: 'Cannington', type: 'G', raceCount: 12, firstRace: '18:30', lastRace: '22:00' },
      ]
    case 6: // Saturday
      return [
        { venue: 'Ascot', type: 'T', raceCount: 9, firstRace: '12:00', lastRace: '17:00' },
        { venue: 'Gloucester Park', type: 'H', raceCount: 10, firstRace: '17:30', lastRace: '22:00' },
      ]
    default:
      return []
  }
}

export async function GET() {
  const perthNow = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Perth' })

  try {
    // Try the TAB API first
    const res = await fetch(
      `https://api.beta.tab.com.au/v1/tab-info-service/racing/dates/${perthNow}/meetings?jurisdiction=WA`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Arvo/1.0',
        },
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(5000),
      }
    )

    if (res.ok) {
      const data = await res.json()
      const meetings: RaceMeeting[] = []

      // TAB API returns meetings array with race details
      if (data?.meetings && Array.isArray(data.meetings)) {
        for (const meeting of data.meetings) {
          const type = meeting.raceType === 'R' ? 'T'
            : meeting.raceType === 'H' ? 'H'
            : meeting.raceType === 'G' ? 'G'
            : 'T'

          const races = meeting.races || []
          meetings.push({
            venue: meeting.meetingName || meeting.venueName || 'Unknown',
            type: type as 'T' | 'H' | 'G',
            raceCount: races.length || meeting.raceCount || 0,
            firstRace: races[0]?.raceStartTime?.slice(11, 16) || null,
            lastRace: races[races.length - 1]?.raceStartTime?.slice(11, 16) || null,
          })
        }
      }

      if (meetings.length > 0) {
        return NextResponse.json({
          meetings,
          date: perthNow,
          source: 'tab-api',
        } satisfies RaceMeetsResponse)
      }
    }
  } catch {
    // TAB API unavailable — fall through to fallback
  }

  // Fallback to day-of-week schedule
  return NextResponse.json({
    meetings: getFallbackMeetings(),
    date: perthNow,
    source: 'fallback',
  } satisfies RaceMeetsResponse)
}
