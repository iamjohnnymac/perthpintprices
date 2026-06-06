#!/usr/bin/env node
/**
 * Throwaway: turns the vision-pick results (slug -> candidate NN) into
 * scripts/photo-overrides.json (slug -> stable photo ref) by looking up the ref in
 * .photo-candidates/manifest.tsv. "NONE" passes through as a hide. Safe to delete.
 */
import { readFile, writeFile } from 'fs/promises'

const PICKS = {
  '3sheets-on-the-harbour': '00',
  '7th-ave-bar-and-restaurant': '00',
  'alabama-song': '00',
  'amani-bar': '05',
  'bassendean-hotel': '05',
  'carine-glades-tavern': '00',
  'carmel-cider-co': '01',
  'charles-hotel': '03',
  'clancys-fish-pub': '02',
  'currambine-bar-and-bistro': '00',
  'drunk-elephant-bar-bistro-and-shisha': '02',
  'el-grotto': '02',
  'ferrara-karaoke-bar': '02',
  'guildford-hotel': '02',
  'herdsman-lake-tavern': '00',
  'jackadders-restaurant': '00',
  'joes-juice-joint': '07',
  'leederville-hotel': '02',
  'mollys-irish-pub': '07',
  'mullaloo-beach-hotel': '03',
  'niche-bar': '00',
  'northbridge-brewing-company': '06',
  'oyster-bar-elizabeth-quay': '00',
  'paddington-ale-house': '02',
  'palace-arcade': '07',
  'picabar': '03',
  'pinchos-bar-de-tapas': '04',
  'raffles-hotel': '02',
  'social-house': '06',
  'steves-nedlands-park': '02',
  'stirling-arms-hotel': '02',
  'stories': '06',
  'tgi-fridays-carousel': '00',
  'the-arbor': '03',
  'the-brass-monkey': '02',
  'the-brook-bar-and-bistro': '00',
  'the-garden': '00',
  'the-gate-bar-and-bistro': '00',
  'the-grosvenor-hotel': '05',
  'the-left-bank': '03',
  'the-lookout-bar': '05',
  'the-lucky-shag': '04',
  'the-morris-hotel': 'NONE',
  'the-royal': '05',
  'the-russell-inn-bar-and-restaurant': '07',
  'the-sporting-globe-floreat': '00',
  'the-wembley-hotel': '02',
  'the-windsor-hotel': '03',
  'upperhand-burgers': '03',
  'warnbro-tavern': 'NONE',
  'waverley-brewhouse': '00',
}

const rows = (await readFile('.photo-candidates/manifest.tsv', 'utf8'))
  .trim()
  .split('\n')
  .filter(Boolean)
  .map((l) => l.split('\t'))

const refByKey = {}
for (const [slug, nn, ref] of rows) refByKey[`${slug}/${nn}`] = ref

const overrides = {}
const missing = []
for (const [slug, nn] of Object.entries(PICKS)) {
  if (nn === 'NONE') { overrides[slug] = 'NONE'; continue }
  const ref = refByKey[`${slug}/${nn}`]
  if (ref) overrides[slug] = ref
  else missing.push(`${slug}/${nn}`)
}

await writeFile('scripts/photo-overrides.json', JSON.stringify(overrides, null, 2) + '\n')
console.log(`wrote ${Object.keys(overrides).length} overrides; missing refs: ${missing.join(', ') || 'none'}`)
