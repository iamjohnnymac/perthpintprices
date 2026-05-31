import { NextRequest } from 'next/server'
import { serviceClient } from '@/lib/supabaseGateway'
import { handleRecordPrice } from './handler'

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  return handleRecordPrice(req, { params }, { getSupabase: serviceClient, now: new Date() })
}
