import { NextRequest } from 'next/server'
import { serviceClient } from '@/lib/supabaseGateway'
import { handleKickoff } from './handler'

export async function POST(req: NextRequest) {
  return handleKickoff(req, { getSupabase: serviceClient, now: new Date(), fetchFn: fetch })
}
