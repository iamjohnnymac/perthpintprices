'use client'

import { useState, useMemo } from 'react'
import { Pub } from '@/types/pub'
import { CrowdReport, CROWD_LEVELS } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import E from '@/lib/emoji'
import InfoTooltip from './InfoTooltip'
import { getDistanceKm, formatDistance } from '@/lib/location'

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
  if (score <= 1.5) return 'bg-blue-500'
  if (score <= 2.0) return 'bg-green-500'
  if (score <= 2.5) return 'bg-emerald-500'
  if (score <= 3.0) return 'bg-yellow-500'
  if (score <= 3.5) return 'bg-orange-500'
  return 'bg-red-500'
}

function getConfidenceLabel(reportCount: number): { label: string; color: string } {
  if (reportCount >= 5) return { label: 'High', color: 'text-green-600' }
  if (reportCount >= 3) return { label: 'Medium', color: 'text-yellow-600' }
  return { label: 'Low', color: 'text-stone-400' }
}

function formatTimeAgo(minutes: number): string {
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

export default function CrowdPulse({ pubs, crowdReports, userLocation }: CrowdPulseProps) {
  const [isExpanded, setIsExpanded] = useState(false)

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
      .slice(0, 5)
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
      .slice(0, 5)
  }, [reportEntries, userLocation])

  const liveCount = reportEntries.length
  const totalCount = pubs.length

  if (liveCount === 0) {
    return null
  }

  return (
    <Card
      className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-stone-200/40 cursor-pointer transition-all duration-300"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <CardContent className="p-4">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="text-2xl">{E.chart_up}</span>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-teal border border-white animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold font-heading text-stone-800 text-sm flex items-center">LIVE MARKET INTEL<InfoTooltip text="Crowd reports submitted by users in the last 3 hours. Vibe score is a weighted average of busyness across all reporting venues." /></h3>
              <p className="text-xs text-stone-500">
                {liveCount} venue{liveCount !== 1 ? 's' : ''} reporting {E.bullet} Perth Vibe: {getVibeLabel(vibeScore)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-20 h-2 rounded-full bg-stone-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getVibeColor(vibeScore)}`}
                  style={{ width: `${(vibeScore / 4) * 100}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-stone-600">{vibeScore.toFixed(1)}/4</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" className={`text-stone-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-stone-200/60" onClick={(e) => e.stopPropagation()}>
            {/* Vibe Meter */}
            <div className="mb-4 p-3 rounded-xl bg-white/70 border border-stone-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-stone-600">Perth Vibe Meter</span>
                <span className="text-xs text-stone-400">{liveCount}/{totalCount} venues tracked</span>
              </div>
              <div className="w-full h-3 rounded-full bg-stone-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getVibeColor(vibeScore)}`}
                  style={{ width: `${(vibeScore / 4) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-stone-400">Dead Quiet</span>
                <span className="text-[10px] font-medium text-stone-600">{getVibeLabel(vibeScore)}</span>
                <span className="text-[10px] text-stone-400">Electric</span>
              </div>
            </div>

            {/* Busiest Venues */}
            {busyVenues.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-coral mb-2 flex items-center gap-1">
                  {E.fire} HOT TRADING {E.dash} Busiest Venues
                </h4>
                <div className="space-y-1.5">
                  {busyVenues.map(({ pub, report }) => {
                    const levelInfo = CROWD_LEVELS[report.crowd_level]
                    const confidence = getConfidenceLabel(report.report_count)
                    return (
                      <div key={pub.id} className="flex items-center justify-between p-2 rounded-lg bg-coral/5 border border-coral/20">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm">{levelInfo.emoji}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-stone-800 truncate">{pub.name}</p>
                            <p className="text-[10px] text-stone-400">{pub.suburb}{userLocation && ` · ${formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng))}`}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-[10px] font-medium ${confidence.color}`}>{confidence.label}</span>
                          <span className="text-[10px] text-stone-400">{formatTimeAgo(report.minutes_ago)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quiet Venues - Hidden Gems */}
            {quietVenues.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-teal mb-2 flex items-center gap-1">
                  {E.green_circle} HIDDEN GEMS {E.dash} Undervalued Venues
                </h4>
                <div className="space-y-1.5">
                  {quietVenues.map(({ pub, report }) => {
                    const levelInfo = CROWD_LEVELS[report.crowd_level]
                    const confidence = getConfidenceLabel(report.report_count)
                    return (
                      <div key={pub.id} className="flex items-center justify-between p-2 rounded-lg bg-teal/5 border border-teal/20">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm">{levelInfo.emoji}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-stone-800 truncate">{pub.name}</p>
                            <p className="text-[10px] text-stone-400">{pub.suburb}{userLocation && ` · ${formatDistance(getDistanceKm(userLocation.lat, userLocation.lng, pub.lat, pub.lng))}`} {E.bullet} {pub.price !== null ? `$${pub.price.toFixed(2)}` : 'TBC'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-[10px] font-medium ${confidence.color}`}>{confidence.label}</span>
                          <span className="text-[10px] text-stone-400">{formatTimeAgo(report.minutes_ago)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* CTA */}
            {liveCount < 5 && (
              <div className="mt-3 text-center text-xs py-2 rounded-lg bg-white/40 text-stone-400">
                {E.chart_bar} Only {liveCount} report{liveCount !== 1 ? 's' : ''} in {E.dash} be a market analyst and report crowd levels!
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
