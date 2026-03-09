'use client'

import Link from 'next/link'

import { useState, useMemo } from 'react'
import { Pub } from '@/types/pub'
import { getDistanceKm, formatDistance } from '@/lib/location'
import { Users, MapPin } from 'lucide-react'

const DAD_JOKES = [
  "I told my kids I'd buy them a drink at the pub. They got lemonade. I got a pint. Everyone won.",
  "My kid asked why we go to pubs with playgrounds. I said \"it's called multitasking, son.\"",
  "A dad walks into a pub with a playground. He doesn't walk out for 4 hours.",
  "What's a dad's favourite pub feature? Fenced. Play. Area.",
  "I used to go to trendy bars. Now I rate pubs by slide height.",
  "The Baysie has a 10m slide. My kids rate it 5 stars. I rate the beer garden 5 stars. Everyone's happy.",
  "They say it takes a village to raise a child. In Perth, it takes a pub with a playground.",
  "My wife said \"take the kids somewhere fun.\" So I took them to a pub. With a playground. Loophole.",
]

// Playground quality ratings based on research
const PLAYGROUND_NOTES: Record<number, string> = {
  152: 'Climbing tower, slide, sandpit & chalkboard area',
  165: '10-metre mega slide + full adventure playground',
  10: 'Nature-style play area with imaginative zones',
  23: 'Huge grassy area right by the harbour',
  104: 'Vintage Land Cruiser & cray boats to climb',
  162: "Geoff's Smash Repairs themed playground + Mario Kart arcade",
  103: 'Big sandpit & play area overlooking the water',
  167: 'Replica tractor, cubby, swings & boats + resident animals',
  11: "Percy's Paddock: fort, sandpit, soft-play, ball pit for toddlers",
  118: 'Adjacent playground + optional Camfield Creche service',
  150: 'Wooden climbing tower, slides, ropes + shade sails',
  34: 'The Park: dedicated play area with shade sails',
}

export default function DadBar({ pubs, userLocation }: { pubs: Pub[], userLocation?: { lat: number; lng: number } | null }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showAll, setShowAll] = useState(false)

  const dadPubs = useMemo(() => {
    return pubs
      .filter(p => p.kidFriendly && p.price !== null && p.price > 0)
      .sort((a, b) => {
        if (userLocation) {
          return getDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) - getDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng)
        }
        return (a.price ?? 0) - (b.price ?? 0)
      })
  }, [pubs, userLocation])

  const joke = useMemo(() => DAD_JOKES[Math.floor(Math.random() * DAD_JOKES.length)], [])

  if (dadPubs.length === 0) return (
    <div className="border-3 border-ink rounded-card shadow-hard-sm bg-white p-6 text-center">
      <p className="text-gray-mid text-sm font-body">No dad-friendly pubs found nearby.</p>
    </div>
  )

  const avgPrice = dadPubs.reduce((sum, p) => sum + (p.price ?? 0), 0) / dadPubs.length
  const displayPubs = showAll ? dadPubs : dadPubs.slice(0, 10)

  return (
    <div
      className="border-3 border-ink rounded-card shadow-hard-sm bg-white overflow-hidden cursor-pointer transition-all"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-off-white border-2 border-ink rounded-full flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-ink" />
            </div>
            <div>
              <h3 className="font-mono text-[0.85rem] font-extrabold text-ink">The Dad Bar</h3>
              <p className="font-body text-[0.75rem] text-gray-mid">Playgrounds for them. Pints for you.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.05em] px-1.5 py-0.5 rounded-pill border-2 border-amber/30 bg-amber-pale text-amber">
              {dadPubs.length} venues
            </span>
            {!isExpanded && dadPubs[0]?.price && (
              <span className="font-mono text-sm font-extrabold text-amber">from ${dadPubs[0].price.toFixed(2)}</span>
            )}
            <svg width="16" height="16" viewBox="0 0 16 16" className={`text-gray-mid transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-light" onClick={(e) => e.stopPropagation()}>
            {/* Dad joke */}
            <div className="bg-amber-pale border-2 border-amber/30 rounded-card p-3 mb-3">
              <p className="font-body text-[0.75rem] text-gray-mid italic leading-relaxed">&ldquo;{joke}&rdquo;</p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-off-white border-2 border-gray-light rounded-card p-2 text-center">
                <p className="font-mono text-lg font-extrabold text-amber">{dadPubs.length}</p>
                <p className="font-mono text-[0.55rem] text-gray-mid">Dad-approved</p>
              </div>
              <div className="bg-off-white border-2 border-gray-light rounded-card p-2 text-center">
                <p className="font-mono text-lg font-extrabold text-ink">${dadPubs[0]?.price?.toFixed(2)}</p>
                <p className="font-mono text-[0.55rem] text-gray-mid">Cheapest pint</p>
              </div>
              <div className="bg-off-white border-2 border-gray-light rounded-card p-2 text-center">
                <p className="font-mono text-lg font-extrabold text-ink">${avgPrice.toFixed(2)}</p>
                <p className="font-mono text-[0.55rem] text-gray-mid">Avg dad pint</p>
              </div>
            </div>

            {/* Pub list */}
            <div className="space-y-0">
              {displayPubs.map((pub, i) => (
                <Link key={pub.id} href={`/pub/${pub.slug}`} className={`flex items-center gap-2 px-3 py-2.5 no-underline group ${i > 0 ? 'border-t border-gray-light' : ''} ${i === 0 ? 'bg-amber/5' : ''}`}>
                  <span className={`font-mono text-[0.65rem] font-bold w-4 ${i === 0 ? 'text-amber' : 'text-gray-mid'}`}>{i === 0 ? '\u2605' : `${i + 1}`}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-body text-sm font-bold text-ink group-hover:text-amber transition-colors truncate block">{pub.name}</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-2.5 h-2.5 text-gray-mid flex-shrink-0" />
                      <p className="font-body text-[0.7rem] text-gray-mid truncate">{pub.suburb}{userLocation && ` · ${formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng))}`}</p>
                      {PLAYGROUND_NOTES[pub.id] && (
                        <>
                          <span className="text-gray-mid text-[0.7rem]">·</span>
                          <p className="font-body text-[0.7rem] text-amber truncate">{PLAYGROUND_NOTES[pub.id]}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-1">
                    <span className="font-mono text-[1rem] font-extrabold text-ink">${pub.price?.toFixed(2)}</span>
                    <p className="font-body text-[0.6rem] text-gray-mid truncate max-w-[60px]">{pub.beerType}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Show all button */}
            {dadPubs.length > 10 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full mt-2 flex items-center justify-center gap-1.5 py-1.5 font-mono text-[0.75rem] font-bold text-gray-mid hover:text-ink transition-colors"
              >
                {showAll ? 'Show less' : `Show all ${dadPubs.length} dad bars`}
                <svg
                  width="16" height="16" viewBox="0 0 16 16" fill="none"
                  className={`transition-transform duration-200 ${showAll ? 'rotate-180' : ''}`}
                >
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}

            {/* Footer */}
            <p className="font-mono text-[0.55rem] text-gray-mid text-center mt-2">
              Sources: Buggybuddys, Urban List Perth · All venues verified for playground facilities
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
