import { type ReactNode } from 'react'
import { PenLine } from 'lucide-react'
import { type PriceRecencyTier } from '@/lib/freshness'

/**
 * Data the pint receipt renders. `price` is the happy-hour-aware effective price
 * shown as the hero; `regularPrice` is the standard pint. Unpriced pubs pass
 * null prices and render cleanly as "TBC".
 */
export interface PintReceiptData {
  name: string
  suburb: string
  beerType: string
  price: number | null          // effective (HH-aware) price shown as the hero
  regularPrice: number | null
  isHappyHourNow: boolean
  avgPrice: number
  priceDiff: number             // effective - city avg ; negative = below avg (good)
  happyHour: { days: string | null; time: string | null; price: number | null } | null
  checkedDate: string | null
  sourcePhrase: string | null
  confidenceLabel: string | null
  recencyLabel: string
  recencyTier: PriceRecencyTier
  cheaperNearby: { name: string; price: number; distance: string } | null
  googleRating: number | null
  googleRatingCount: number | null
  amenities: string[]
  editorialSummary: string | null
}

const money = (n: number | null) => (n == null ? 'TBC' : `$${n.toFixed(2)}`)

function vsAvg(d: PintReceiptData) {
  if (Math.abs(d.priceDiff) < 0.05) return { text: 'on the city average', cls: 'text-gray-mid' }
  const below = d.priceDiff < 0
  return { text: `${money(Math.abs(d.priceDiff))} ${below ? 'below' : 'above'} the ${money(d.avgPrice)} avg`, cls: below ? 'text-green' : 'text-red' }
}

/** "7 days 4pm - 5pm" reads like a sentence fragment; "daily 4–5pm" reads like a receipt. */
function happyHourSchedule(hh: NonNullable<PintReceiptData['happyHour']>): string | null {
  const days = hh.days === '7 days' ? 'daily' : hh.days
  const schedule = [days, hh.time].filter(Boolean).join(' ')
  return schedule || null
}

/** LABEL ········ VALUE — dotted leader line. */
function Leader({ label, value, valueClass = 'text-ink' }: { label: string; value: ReactNode; valueClass?: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="font-mono text-[0.72rem] uppercase tracking-[0.02em] text-gray-mid">{label}</span>
      <span className="flex-1 border-b border-dotted border-gray-mid/50 translate-y-[-3px]" />
      <span className={`font-mono text-[0.78rem] font-bold whitespace-nowrap ${valueClass}`}>{value}</span>
    </div>
  )
}

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating)
  return <span className="text-amber tracking-[0.1em]">{'★★★★★'.slice(0, full)}<span className="text-gray-light">{'★★★★★'.slice(full)}</span></span>
}

/**
 * Pint price card — the "receipt" on every pub page. An amber-headed docket:
 * venue banner, the hero price, an itemised sheet (standard pint, happy hour,
 * cheaper-nearby, checked date, Google rating), amenity stamps, and a report CTA.
 * Unpriced pubs render "TBC" cleanly — no vs-average line, and the CTA asks for
 * the price rather than a better one.
 */
export default function PintReceipt({ data, onReport }: { data: PintReceiptData; onReport: () => void }) {
  const v = vsAvg(data)
  return (
    <div className="border-3 border-ink rounded-card bg-white shadow-hard-sm overflow-hidden">
      {/* Banner */}
      <div className="bg-amber border-b-3 border-ink px-4 py-3 text-center text-ink">
        <p className="font-display text-[1.2rem] leading-none">{data.name}</p>
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] mt-1">{data.suburb}{data.beerType ? ` · ${data.beerType}` : ''}</p>
      </div>

      {/* Price */}
      <div className="px-5 py-4 text-center border-b-2 border-dashed border-ink">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-gray-mid">{data.isHappyHourNow ? 'Pouring now' : 'Pint price'}</p>
        {data.isHappyHourNow && data.regularPrice != null && data.regularPrice !== data.price && (
          <p className="font-mono text-[0.8rem] text-gray-mid line-through">{money(data.regularPrice)}</p>
        )}
        <p className="type-price text-[clamp(2.8rem,11vw,3.8rem)] leading-none">{money(data.price)}</p>
        {data.price != null && <p className={`font-mono text-[0.7rem] font-bold ${v.cls}`}>{v.text}</p>}
      </div>

      {/* Itemised rows */}
      <div className="px-5 py-3 space-y-1.5">
        {/* The hero already says the standard price outside happy hour — only itemise it when it differs. */}
        {data.regularPrice !== data.price && <Leader label="Standard pint" value={money(data.regularPrice)} />}
        {data.happyHour && (() => {
          const schedule = happyHourSchedule(data.happyHour)
          // No price yet? The schedule is still real information — lead with it instead of "TBC".
          const value = data.happyHour.price ? money(data.happyHour.price) : (schedule ?? 'TBC')
          return (
            <>
              <Leader label="Happy hour" value={value} valueClass={data.happyHour.price ? 'text-red' : schedule ? 'text-ink' : 'text-gray-mid'} />
              {data.happyHour.price != null && schedule && (
                <p className="text-right font-mono text-[0.65rem] text-gray-mid leading-tight">{schedule}</p>
              )}
            </>
          )
        })()}
        {data.cheaperNearby && (
          <>
            <Leader label="Cheaper nearby" value={money(data.cheaperNearby.price)} valueClass="text-green" />
            <Leader label={data.cheaperNearby.name} value={data.cheaperNearby.distance} valueClass="text-gray-mid" />
          </>
        )}
        {data.checkedDate && (
          <Leader
            label="Checked"
            value={`${data.checkedDate}${data.recencyTier === 'aging' || data.recencyTier === 'stale' ? ` · ${data.recencyLabel.replace(/^Checked /, '')}` : ''}`}
            valueClass={data.recencyTier === 'aging' || data.recencyTier === 'stale' ? 'text-amber' : 'text-ink'}
          />
        )}
        {data.sourcePhrase && <Leader label="Source" value={data.sourcePhrase} valueClass="text-gray-mid" />}
        {data.googleRating != null && (
          <Leader label="Google" value={<><Stars rating={data.googleRating} /> {data.googleRating.toFixed(1)} ({data.googleRatingCount?.toLocaleString()})</>} />
        )}
      </div>

      {data.amenities.length > 0 && (
        <div className="px-5 pb-1 flex flex-wrap gap-1">
          {data.amenities.map(a => (
            <span key={a} className="font-mono text-[0.62rem] uppercase tracking-[0.05em] border border-ink/40 px-1.5 py-0.5 text-ink">{a}</span>
          ))}
        </div>
      )}

      {/* Report CTA */}
      <div className="m-4 mt-3 border-2 border-ink rounded-card bg-amber-pale px-3 py-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-gray-mid">Help keep prices honest</p>
          <p className="font-mono text-[0.72rem] font-bold text-ink">{data.price == null ? 'Know the price?' : 'Know a better price?'}</p>
        </div>
        <button onClick={onReport} className="shrink-0 flex items-center gap-1.5 font-mono text-[0.65rem] font-bold uppercase tracking-[0.05em] text-white bg-ink border-2 border-ink rounded-pill px-3 py-1.5 hover:bg-amber hover:text-ink transition-colors">
          <PenLine className="w-3 h-3" /> Report a price
        </button>
      </div>
    </div>
  )
}
