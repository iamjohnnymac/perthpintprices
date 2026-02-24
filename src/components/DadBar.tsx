'use client'

import Link from 'next/link'

import { useState, useMemo } from 'react'
import { Pub } from '@/types/pub'
import { getDistanceKm, formatDistance } from '@/lib/location'
import { Card, CardContent } from '@/components/ui/card'
import InfoTooltip from './InfoTooltip'

const DAD_JOKES = [
  "I told my kids I’d buy them a drink at the pub. They got lemonade. I got a pint. Everyone won.",
  "My kid asked why we go to pubs with playgrounds. I said “it’s called multitasking, son.”",
  "A dad walks into a pub with a playground. He doesn’t walk out for 4 hours.",
  "What’s a dad’s favourite pub feature? Fenced. Play. Area.",
  "I used to go to trendy bars. Now I rate pubs by slide height.",
  "The Baysie has a 10m slide. My kids rate it 5 stars. I rate the beer garden 5 stars. Everyone’s happy.",
  "They say it takes a village to raise a child. In Perth, it takes a pub with a playground.",
  "My wife said “take the kids somewhere fun.” So I took them to a pub. With a playground. Loophole.",
]

// Playground quality ratings based on research
const PLAYGROUND_NOTES: Record<number, string> = {
  152: 'Climbing tower, slide, sandpit & chalkboard area',
  165: '10-metre mega slide + full adventure playground',
  10: 'Nature-style play area with imaginative zones',
  23: 'Huge grassy area right by the harbour',
  104: 'Vintage Land Cruiser & cray boats to climb',
  162: 'Geoff’s Smash Repairs themed playground + Mario Kart arcade',
  103: 'Big sandpit & play area overlooking the water',
  167: 'Replica tractor, cubby, swings & boats + resident animals',
  11: 'Percy’s Paddock: fort, sandpit, soft-play, ball pit for toddlers',
  118: 'Adjacent playground + optional Camfield Crèche service',
  150: 'Wooden climbing tower, slides, ropes + shade sails',
  34: 'The Park: dedicated play area with shade sails',
}

export default function DadBar({ pubs, userLocation }: { pubs: Pub[], userLocation?: { lat: number; lng: number } | null }) {
  const [isExpanded, setIsExpanded] = useState(false)
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

  if (dadPubs.length === 0) return null

  const avgPrice = dadPubs.reduce((sum, p) => sum + (p.price ?? 0), 0) / dadPubs.length
  const displayPubs = showAll ? dadPubs : dadPubs.slice(0, 5)

  return (
    <Card className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.08)] border border-stone-200/40 cursor-pointer transition-all duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] active:scale-[0.995] overflow-hidden" onClick={() => setIsExpanded(!isExpanded)}>
      <CardContent className="p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="5" r="3" fill="white" opacity="0.9"/>
              <path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5" fill="white" opacity="0.9"/>
              <circle cx="12" cy="7" r="2" fill="white" opacity="0.6"/>
              <path d="M9 14c0-1.7 1.3-3 3-3s3 1.3 3 3" fill="white" opacity="0.6"/>
            </svg>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold font-heading text-stone-800 flex items-center gap-2">
              THE DAD BAR
              <InfoTooltip text="Kid-friendly pubs verified from Buggybuddys and Urban List Perth. All venues have dedicated playgrounds or play areas, plus food menus for children. Perfect for a cheeky pint while the kids wear themselves out." />
            </h3>
            <p className="text-xs text-stone-500">Playgrounds for them. Pints for you.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200">
              <span className="text-[10px] font-semibold text-amber">{dadPubs.length} VENUES</span>
            </div>
            {!isExpanded && dadPubs[0]?.price && (
              <span className="text-sm font-bold text-amber">from ${dadPubs[0].price.toFixed(2)}</span>
            )}
            <svg width="16" height="16" viewBox="0 0 16 16" className={`text-stone-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
      </div>

      {isExpanded && (<>
      {/* Dad joke */}
      <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3 mb-3">
        <div className="flex items-start gap-2">
          <span className="text-stone-400 flex-shrink-0 mt-0.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1C3.7 1 1 3.7 1 7s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 9.5c-.4 0-.7-.3-.7-.7s.3-.7.7-.7.7.3.7.7-.3.7-.7.7zm.7-3c0 .4-.3.7-.7.7s-.7-.3-.7-.7V5.2c0-.4.3-.7.7-.7s.7.3.7.7v2.3z" fill="currentColor"/>
            </svg>
          </span>
          <p className="text-xs text-stone-600 italic leading-relaxed">&ldquo;{joke}&rdquo;</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-white border border-stone-200 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-amber">{dadPubs.length}</p>
          <p className="text-[10px] text-stone-500">Dad-approved</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-stone-800">${dadPubs[0]?.price?.toFixed(2)}</p>
          <p className="text-[10px] text-stone-500">Cheapest pint</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-stone-800">${avgPrice.toFixed(2)}</p>
          <p className="text-[10px] text-stone-500">Avg dad pint</p>
        </div>
      </div>

      {/* Pub list */}
      <div className="space-y-2">
        {displayPubs.map((pub, i) => (
          <Link key={pub.id} href={`/pub/${pub.slug}`} className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg p-2">
            <div className="w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-amber">{i + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-800 truncate block">{pub.name}</span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="flex-shrink-0">
                  <path d="M4 0C2.5 0 1 1.3 1 3c0 2.5 3 5 3 5s3-2.5 3-5c0-1.7-1.5-3-3-3z" fill="#a8a29e"/>
                </svg>
                <p className="text-[10px] text-stone-400 truncate">{pub.suburb}{userLocation && ` · ${formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng))}`}</p>
                {PLAYGROUND_NOTES[pub.id] && (
                  <>
                    <span className="text-stone-300 text-[10px]">{"·"}</span>
                    <p className="text-[10px] text-amber truncate">{PLAYGROUND_NOTES[pub.id]}</p>
                  </>
                )}
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-1">
              <p className="text-sm font-bold text-stone-800">${pub.price?.toFixed(2)}</p>
              <p className="text-[10px] text-stone-400 truncate max-w-[60px]">{pub.beerType}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Show all button */}
      {dadPubs.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-2 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold text-stone-500 hover:text-stone-700 transition-colors"
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
      <p className="text-[10px] text-stone-400 text-center mt-2">
        Sources: Buggybuddys, Urban List Perth {"·"} All venues verified for playground facilities
      </p>
      </>)}
      </CardContent>
    </Card>
  )
}
