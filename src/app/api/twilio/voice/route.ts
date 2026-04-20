import { NextRequest, NextResponse } from 'next/server'

// Called by Twilio when our outbound call connects. Returns TwiML that plays
// the pre-rendered Charlie greeting, records the bartender's response, plays
// a thank-you, and hangs up. Recording is POSTed to /api/twilio/recording-complete
// along with any transcription Twilio produced.
export async function POST(req: NextRequest) {
  const base = new URL(req.url).origin
  // pubId is forwarded through Twilio as a custom parameter so we know which
  // pub the recording belongs to when the recording webhook fires.
  const pubId = req.nextUrl.searchParams.get('pubId') || ''

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${base}/voice/greeting.mp3</Play>
  <Record
    action="${base}/api/twilio/recording-complete?pubId=${encodeURIComponent(pubId)}"
    method="POST"
    maxLength="15"
    timeout="3"
    finishOnKey="#"
    playBeep="false"
    trim="trim-silence"
    transcribe="true"
    transcribeCallback="${base}/api/twilio/recording-complete?pubId=${encodeURIComponent(pubId)}"
  />
  <Play>${base}/voice/thanks-no-answer.mp3</Play>
  <Hangup/>
</Response>`
  return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } })
}

export async function GET(req: NextRequest) {
  return POST(req)
}
