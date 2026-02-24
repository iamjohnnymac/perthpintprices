'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Reporter {
  reporter_name: string
  verified_count: number
  total_reports: number
  last_report: string
}

const BADGES = [
  { min: 1, label: '🔰 Rookie Scout', color: 'bg-stone-100 text-stone-600' },
  { min: 5, label: '🍺 Price Spotter', color: 'bg-blue-100 text-blue-700' },
  { min: 10, label: '🎯 Price Scout', color: 'bg-amber/10 text-amber-dark' },
  { min: 25, label: '⭐ Price Pro', color: 'bg-amber/20 text-amber-dark' },
  { min: 50, label: '🏆 Perth Legend', color: 'bg-yellow-100 text-yellow-800' },
]

function getBadge(count: number) {
  for (let i = BADGES.length - 1; i >= 0; i--) {
    if (count >= BADGES[i].min) return BADGES[i]
  }
  return BADGES[0]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

export default function LeaderboardClient() {
  const [reporters, setReporters] = useState<Reporter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/price-report?leaderboard=true')
      .then(res => res.json())
      .then(data => {
        setReporters(data.leaderboard || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-cream border-b border-stone-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-stone-400 hover:text-charcoal transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold font-heading text-charcoal">🏆 Price Scout Leaderboard</h1>
              <p className="text-xs text-stone-500">Perth&apos;s top price reporters</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4">
        {/* How it works */}
        <div className="bg-amber/5 border border-amber/20 rounded-2xl p-4 sm:p-5">
          <h2 className="text-sm font-bold text-charcoal mb-2">How to climb the leaderboard</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-start gap-2">
              <span className="text-lg">📝</span>
              <div>
                <p className="text-xs font-semibold text-charcoal">Report prices</p>
                <p className="text-[11px] text-stone-500">Visit any pub page and tap &quot;Report Current Price&quot;</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-lg">✅</span>
              <div>
                <p className="text-xs font-semibold text-charcoal">Get verified</p>
                <p className="text-[11px] text-stone-500">Reports matching other data get verified automatically</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-lg">🏅</span>
              <div>
                <p className="text-xs font-semibold text-charcoal">Earn badges</p>
                <p className="text-[11px] text-stone-500">Rookie Scout → Price Spotter → Price Scout → Perth Legend</p>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-2xl border border-stone-200/60 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-10 h-10 border-3 border-stone-200 border-t-amber rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-stone-500">Loading leaderboard...</p>
            </div>
          ) : reporters.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-3">🏆</div>
              <h3 className="text-lg font-bold text-charcoal mb-1">Be the first!</h3>
              <p className="text-sm text-stone-500 mb-4">No price reports yet. Visit any pub page and report the current pint price to get on the board.</p>
              <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-charcoal text-white rounded-full text-sm font-bold hover:bg-charcoal/90 transition-all">
                Browse Pubs →
              </Link>
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div className="grid grid-cols-[40px_1fr_80px_60px] sm:grid-cols-[50px_1fr_120px_100px_80px] gap-2 px-4 py-2.5 bg-stone-50 border-b border-stone-200/60 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                <span>#</span>
                <span>Reporter</span>
                <span className="hidden sm:block">Badge</span>
                <span className="text-right">Reports</span>
                <span className="text-right">Last</span>
              </div>
              {reporters.map((r, i) => {
                const badge = getBadge(r.total_reports)
                return (
                  <div key={r.reporter_name} className="grid grid-cols-[40px_1fr_80px_60px] sm:grid-cols-[50px_1fr_120px_100px_80px] gap-2 px-4 py-3 border-b border-stone-100 last:border-0 items-center hover:bg-stone-50/50 transition-colors">
                    <span className={`text-sm font-bold ${i === 0 ? 'text-amber' : i === 1 ? 'text-stone-400' : i === 2 ? 'text-amber-dark' : 'text-stone-500'}`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-charcoal truncate">{r.reporter_name}</p>
                      <span className={`sm:hidden inline-block text-[10px] px-1.5 py-0.5 rounded-full ${badge.color} font-medium mt-0.5`}>{badge.label}</span>
                    </div>
                    <span className={`hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full ${badge.color} font-medium w-fit`}>{badge.label}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-charcoal">{r.total_reports}</span>
                      {r.verified_count > 0 && (
                        <span className="block text-[10px] text-green-600">{r.verified_count} verified</span>
                      )}
                    </div>
                    <span className="text-[11px] text-stone-400 text-right">{timeAgo(r.last_report)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
