import { NextRequest } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { serviceClient } from '@/lib/supabaseGateway'
import { toSuburbSlug } from '@/lib/urls'
import { handleRecordPrice } from './handler'

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  return handleRecordPrice(req, { params }, {
    getSupabase: serviceClient,
    now: new Date(),
    afterWrite: pub => {
      revalidateTag(`pub:${pub.slug}`)
      revalidatePath(`/${toSuburbSlug(pub.suburb)}/${pub.slug}`)
    },
  })
}
