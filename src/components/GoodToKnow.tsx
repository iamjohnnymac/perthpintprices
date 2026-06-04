import { Baby, CalendarCheck, Dog, Music, Star, Trees, Tv, Users, Utensils } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Pub } from '@/types/pub'

// Compact, sourced fact row from the Google Places attribute backfill. Decision-
// page ethos: scannable chips, not prose. Every chip is a fact Google affirms as
// true — null/false signals render nothing (truthful absence). Attributed inline.

type ChipDef = { key: keyof Pub; label: string; Icon: LucideIcon }

const CHIPS: ChipDef[] = [
  { key: 'outdoorSeating', label: 'Beer garden', Icon: Trees },
  { key: 'allowsDogs', label: 'Dog-friendly', Icon: Dog },
  { key: 'goodForWatchingSports', label: 'Shows the footy', Icon: Tv },
  { key: 'goodForChildren', label: 'Kids welcome', Icon: Baby },
  { key: 'servesFood', label: 'Kitchen', Icon: Utensils },
  { key: 'liveMusic', label: 'Live music', Icon: Music },
  { key: 'goodForGroups', label: 'Good for a group', Icon: Users },
  { key: 'reservable', label: 'Takes bookings', Icon: CalendarCheck },
]

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function GoodToKnow({ pub }: { pub: Pub }) {
  const chips = CHIPS.filter(({ key }) => pub[key] === true)
  const hasRating = pub.googleRating != null
  const summary = pub.googleEditorialSummary

  if (chips.length === 0 && !hasRating && !summary) return null

  return (
    <section>
      <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-gray-mid mb-2">
        Good to know
      </p>

      {summary && (
        <p className="text-[0.85rem] text-gray-mid leading-relaxed mb-3">{summary}</p>
      )}

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map(({ key, label, Icon }) => (
            <span
              key={String(key)}
              className="inline-flex items-center gap-1.5 font-mono text-[0.65rem] font-bold text-ink bg-off-white border border-gray-light px-2.5 py-1 rounded-full"
            >
              <Icon className="w-3.5 h-3.5 text-amber" aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>
      )}

      {hasRating && (
        <p className="flex items-center gap-1.5 mt-3 font-mono text-[0.7rem] text-gray-mid">
          <Star className="w-3.5 h-3.5 text-amber fill-amber" aria-hidden="true" />
          <span className="font-bold text-ink">{pub.googleRating!.toFixed(1)}</span>
          on Google
          {pub.googleRatingCount != null && ` · ${pub.googleRatingCount.toLocaleString('en-AU')} ratings`}
        </p>
      )}

      {pub.googleAttrsUpdatedAt && (
        <p className="mt-2 font-mono text-[0.6rem] text-gray-mid">
          Per Google, checked{' '}
          <time dateTime={pub.googleAttrsUpdatedAt}>{formatDate(pub.googleAttrsUpdatedAt)}</time>
        </p>
      )}
    </section>
  )
}
