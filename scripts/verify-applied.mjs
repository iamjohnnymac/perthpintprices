import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { writeFile, mkdir } from 'fs/promises'
config({ path: '.env.local' })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifxkoblvgttelzboenpi.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)
const slugs = process.argv.slice(2).length ? process.argv.slice(2) : ['the-bird', 'northbridge-brewing-company', 'palace-arcade']
const { data } = await supabase.from('pubs').select('slug,google_photo_url,google_photo_attribution').in('slug', slugs)
await mkdir('.photo-candidates', { recursive: true })
for (const p of data) {
  if (!p.google_photo_url) { console.log(`${p.slug}: NO PHOTO (hidden)`); continue }
  const img = await fetch(p.google_photo_url)
  await writeFile(`.photo-candidates/_verify-${p.slug}.jpg`, Buffer.from(await img.arrayBuffer()))
  console.log(`${p.slug}: downloaded (attribution: ${p.google_photo_attribution || 'none'})`)
}
