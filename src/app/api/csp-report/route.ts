import { NextRequest } from 'next/server'
import { handleCspReport } from './handler'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  return handleCspReport(req)
}
