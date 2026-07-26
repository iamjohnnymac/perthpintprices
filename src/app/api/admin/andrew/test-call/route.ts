import { NextRequest } from 'next/server'
import { handleAndrewTestCallGet, handleAndrewTestCallPost } from './handler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  return handleAndrewTestCallGet(request)
}

export async function POST(request: NextRequest) {
  return handleAndrewTestCallPost(request)
}
