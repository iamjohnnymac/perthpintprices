import { NextRequest } from 'next/server'
import { serviceClient } from '@/lib/supabaseGateway'
import { handlePostCall } from './handler'

export async function POST(req: NextRequest) {
  return handlePostCall(req, { getSupabase: serviceClient, now: new Date() })
}
