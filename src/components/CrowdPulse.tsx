'use client'

import Link from 'next/link'

import { useState, useMemo } from 'react'
import { Pub } from '@/types/pub'
import { CrowdReport, CROWD_LEVELS } from '@/lib/supabase'
import { getDistanceKm, formatDistance } from '@/lib/location'
import LucideIcon from '@/components/LucideIcon'
import { TrendingUp, Flame, Volume2, BarChart3 } from 'lucide-react'

interface CrowdPulseProps {
  pubs: Pub[]
  crowdReports: Record<string, CrowdReport>
  userLocation?: { lat: number; lng: number } | null
}

function getVibeLabel(score: number): string {
  if (score <= 1.5) return 'Dead Quiet'
  if (score <= 2.0) return 'Chill'
  if (score <= 2.5) return 'Moderate'
  if (score <= 3.0) return 'Lively'
  if (score <= 3.5) return 'Buzzing'
  return 'Electric'
}

function getVibeColor(score: number): string {
  if (score <= 1.5) return 'bg-off-white'
  if (score <= 2.5) return 'bg-amber'
  if (score <= 3.5) return 'bg-amber'
  return 'bg-red'
}

function getConfidenceLabel(reportCount: number): { label: string; color: string } {
  if (reportCount >= 5) return { label: 'High', color: 'text-ink' }
  if (reportCount >= 3) return { label: 'Medium', color: 'text-amber' }
  return { label: 'Low', color: 'text-gray-mid' }
}

function formatTimeAgo(minutes: number): string {
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

export default function CrowdPulse({ pubs, crowdReports, userLocation }: CrowdPulseProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const reportEntries = useMemo(() => {
    return Object.entries(crowdReports).map(([pubId, report]) => {
      const pub = pubs.find(p => String(p.id) === pubId)
      return { pub, report }
    }).filter((e): e is { pub: Pub; report: CrowdReport } => e.pub !== undefined)
  }, [pubs, crowdReports])

  const vibeScore = useMemo(() => {
    if (reportEntries.length === 0) return 0
    const totalWeight = reportEntries.reduce((sum, e) => sum + e.report.report_count, 0)
    const weightedSum = reportEntries.reduce((sum, e) => sum + e.report.crowd_level * e.report.report_count, 0)
    return totalWeight > 0 ? weightedSum / totalWeight : 0
  }, [reportEntries])

  const busyVenues = useMemo(() => {
    return reportEntries
      .filter(e => e.report.crowd_level >= 3)
      .sort((a, b) => {
        const levelDiff = b.report.crowd_level - a.report.crowd_level
        if (levelDiff !== 0) return levelDiff
        if (userLocation) {
          return getDistanceKm(userLocation.lat, userLocation.lng, a.pub.lat, a.pub.lng) - getDistanceKm(userLocation.lat, userLocation.lng, b.pub.lat, b.pub.lng)
        }
        return 0
      })
      .slice(0, 10)
  }, [reportEntries, userLocation])

  const quietVenues = useMemo(() => {
    return reportEntries
      .filter(e => e.report.crowd_level <= 2)
      .sort((a, b) => {
        const levelDiff = a.report.crowd_level - b.report.crowd_level
        if (levelDiff !== 0) return levelDiff
        if (userLocation) {
          return getDistanceKm(userLocation.lat, userLocation.lng, a.pub.lat, a.pub.lng) - getDistanceKm(userLocation.lat, userLocation.lng, b.pub.lat, b.pub.lng)
        }
        return 0
      })
      .slice(0, 10)
  }, [reportEntries, userLocation])

  const liveCount = reportEntries.length
  const totalCount = pubs.length

  if (liveCount === 0) {
    return (
      <div className="border-3 border-ink rounded-card shadow-hard-sm bg-white p-6 text-center">
        <p className="text-gray-mid text-sm font-body">No crowd reports yet. Be the first!</p>
      </div>
    )
  }

  return (
    <div
      className="border-3 border-ink rounded-card shadow-hard-sm bg-white overflow-hidden cursor-pointer transition-all"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="p-5">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-off-white border-2 border-ink rounded-full flex items-center justify-center flex-shrink-0 relative">
              <TrendingUp className="w-5 h-5 text-ink" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber border-2 border-white animate-pulse" />
            </div>
            <div>
              <h3 className="font-mono text-[0.85rem] font-extrabold text-ink">Live Crowd Vibes</h3>
              <p className="font-body text-[0.75rem] text-gray-mid">
                {liveCount} venue{liveCount !== 1 ? 's' : ''} reporting · Perth Vibe: {getVibeLabel(vibeScore)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-20 h-2 rounded-pill bg-off-white overflow-hidden border border-gray-light">
                <div
                  className={`h-full rounded-pill transition-all ${getVibeColor(vibeScore)}`}
                  style={{ width: `${(vibeScore / 4) * 100}%` }}
                />
              </div>
              <span className="font-mono text-[0.65rem] font-bold text-gray-mid">{vibeScore.toFixed(1)}/4</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" className={`text-gray-mid transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-light" onClick={(e) => e.stopPropagation()}>
            {/* Vibe Meter */}
            <div className="mb-4 p-3 rounded-card bg-off-white border-2 border-gray-light">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.05em] text-ink">Perth Vibe Meter</span>
                <span className="font-mono text-[0.6rem] text-gray-mid">{liveCount}/{totalCount} venues tracked</span>
              </div>
              <div className="w-full h-3 rounded-pill bg-white overflow-hidden border border-gray-light">
                <div
                  className={`h-full rounded-pill transition-all duration-500 ${getVibeColor(vibeScore)}`}
                  style={{ width: `${(vibeScore / 4) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="font-mono text-[0.55rem] text-gray-mid">Dead Quiet</span>
                <span className="font-mono text-[0.55rem] font-bold text-ink">{getVibeLabel(vibeScore)}</span>
                <span className="font-mono text-[0.55rem] text-gray-mid">Electric</span>
              </div>
            </div>

            {/* Busiest Venues */}
            {busyVenues.length > 0 && (
              <div className="mb-3">
                <h4 className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.05em] text-red mb-2 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> Busiest Venues
                </h4>
                <div className="space-y-0">
                  {busyVenues.map(({ pub, report }, i) => {
                    const levelInfo = CROWD_LEVELS[report.crowd_level]
                    const confidence = getConfidenceLabel(report.report_count)
                    return (
                      <Link key={pub.id} href={`/pub/${pub.slug}`} className={`flex items-center justify-between px-3 py-2.5 no-underline group ${i > 0 ? 'border-t border-gray-light' : ''}`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <LucideIcon name={levelInfo.emoji} className="w-4 h-4 text-red" />
                          <div className="min-w-0">
                            <span className="font-body text-sm font-bold text-ink group-hover:text-amber transition-colors truncate block">{pub.name}</span>
                            <p className="font-body text-[0.7rem] text-gray-mid">{pub.suburb}{userLocation && ` · ${formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng))}`}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`font-mono text-[0.55rem] font-bold ${confidence.color}`}>{confidence.label}</span>
                          <span className="font-mono text-[0.55rem] text-gray-mid">{formatTimeAgo(report.minutes_ago)}</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quiet Venues */}
            {quietVenues.length > 0 && (
              <div className="mb-3">
                <h4 className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.05em] text-ink mb-2 flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5" /> Quiet Spots
                </h4>
                <div className="space-y-0">
                  {quietVenues.map(({ pub, report }, i) => {
                    const levelInfo = CROWD_LEVELS[report.crowd_level]
                    const confidence = getConfidenceLabel(report.report_count)
                    return (
                      <Link key={pub.id} href={`/pub/${pub.slug}`} className={`flex items-center justify-between px-3 py-2.5 no-underline group ${i > 0 ? 'border-t border-gray-light' : ''}`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <LucideIcon name={levelInfo.emoji} className="w-4 h-4 text-gray-mid" />
                          <div className="min-w-0">
                            <span className="font-body text-sm font-bold text-ink group-hover:text-amber transition-colors truncate block">{pub.name}</span>
                            <p className="font-body text-[0.7rem] text-gray-mid">{pub.suburb}{userLocation && ` · ${formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng))}`} · {pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`font-mono text-[0.55rem] font-bold ${confidence.color}`}>{confidence.label}</span>
                          <span className="font-mono text-[0.55rem] text-gray-mid">{formatTimeAgo(report.minutes_ago)}</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* CTA */}
            {liveCount < 5 && (
              <div className="bg-off-white rounded-card p-3 text-center">
                <p className="font-mono text-[0.75rem] text-gray-mid flex items-center justify-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Only {liveCount} report{liveCount !== 1 ? 's' : ''} in. Be a market analyst and report crowd levels!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
