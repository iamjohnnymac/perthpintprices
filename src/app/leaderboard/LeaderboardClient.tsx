'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import SubPageNav from '@/components/SubPageNav'
import Footer from '@/components/Footer'
import { Trophy, Medal } from 'lucide-react'

interface Reporter {
  reporter_name: string
  verified_count: number
  total_reports: number
  last_report: string
}

const BADGES = [
  { min: 1, label: 'Rookie Scout', color: 'bg-off-white text-gray-mid border border-gray-light' },
  { min: 5, label: 'Price Spotter', color: 'bg-blue-50 text-blue-700 border border-blue-200' },
  { min: 10, label: 'Price Scout', color: 'bg-amber/10 text-amber border border-amber/30' },
  { min: 25, label: 'Price Pro', color: 'bg-amber/20 text-amber border border-amber/40' },
  { min: 50, label: 'Perth Legend', color: 'bg-amber text-white border border-amber' },
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
    <div className="min-h-screen bg-[#FDF8F0]">
      <SubPageNav title="Leaderboard" subtitle="Perth's top price reporters" />

      <div className="max-w-container mx-auto px-6 py-8">
        {/* Heading */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-3.5 h-3.5 rounded-[4px] bg-amber" />
            <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.1em] text-gray-mid">Rankings</span>
          </div>
          <h1 className="font-mono font-extrabold text-[clamp(1.8rem,5vw,2.4rem)] tracking-[-0.03em] text-ink leading-[1.1]">
            Leaderboard
          </h1>
          <p className="text-gray-mid text-[0.85rem] mt-1">Perth&apos;s top price reporters</p>
        </div>

        {/* How it works */}
        <div className="border-3 border-ink rounded-card p-5 shadow-hard-sm mb-6 bg-off-white">
          <h2 className="font-mono text-[0.75rem] font-extrabold text-ink uppercase tracking-[0.05em] mb-3">How to climb</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { color: '#D4740A', label: 'Report', desc: 'Visit any pub page and tap "Report Current Price"' },
              { color: '#2D7A3D', label: 'Verify', desc: 'Reports matching other data get verified automatically' },
              { color: '#3B82F6', label: 'Badge Up', desc: 'Rookie Scout → Price Spotter → Price Scout → Perth Legend' },
            ].map((step) => (
              <div key={step.label}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-[3px]" style={{ background: step.color }} />
                  <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.08em] text-gray-mid">{step.label}</span>
                </div>
                <p className="text-[0.75rem] text-gray-mid leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="border-3 border-ink rounded-card shadow-hard-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 border-4 border-stone-300 border-t-amber rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-mid">Loading leaderboard...</p>
            </div>
          ) : reporters.length === 0 ? (
            <div className="p-8 text-center">
              <Trophy className="w-10 h-10 text-amber mx-auto mb-3" />
              <h3 className="font-mono font-extrabold text-lg text-ink mb-1">Be the first!</h3>
              <p className="text-[0.85rem] text-gray-mid mb-4">No price reports yet. Visit any pub page and report the current pint price.</p>
              <Link href="/" className="inline-flex font-mono text-[0.75rem] font-bold uppercase tracking-[0.05em] text-white bg-ink border-3 border-ink rounded-pill px-6 py-3 shadow-hard-sm hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover transition-all no-underline">
                Browse Pubs
              </Link>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="grid grid-cols-[40px_1fr_80px_60px] sm:grid-cols-[50px_1fr_120px_100px_80px] gap-2 px-4 py-2.5 bg-off-white border-b border-gray-light font-mono text-[0.6rem] font-bold uppercase tracking-wider text-gray-mid">
                <span>#</span>
                <span>Reporter</span>
                <span className="hidden sm:block">Badge</span>
                <span className="text-right">Reports</span>
                <span className="text-right">Last</span>
              </div>
              {reporters.map((r, i) => {
                const badge = getBadge(r.total_reports)
                return (
                  <div key={r.reporter_name} className="grid grid-cols-[40px_1fr_80px_60px] sm:grid-cols-[50px_1fr_120px_100px_80px] gap-2 px-4 py-3 border-b border-gray-light last:border-0 items-center hover:bg-off-white transition-colors">
                    <span className="font-mono text-[0.75rem] font-bold">
                      {i === 0 ? <Trophy className="w-4 h-4 text-amber inline" /> : i === 1 ? <Medal className="w-4 h-4 text-gray-400 inline" /> : i === 2 ? <Medal className="w-4 h-4 text-amber-700 inline" /> : <span className="text-gray-mid">{i + 1}</span>}
                    </span>
                    <div className="min-w-0">
                      <p className="font-mono text-[0.8rem] font-bold text-ink truncate">{r.reporter_name}</p>
                      <span className={`sm:hidden inline-block text-[0.55rem] px-1.5 py-0.5 rounded-full ${badge.color} font-bold mt-0.5`}>{badge.label}</span>
                    </div>
                    <span className={`hidden sm:inline-block text-[0.6rem] px-2 py-0.5 rounded-full ${badge.color} font-bold w-fit`}>{badge.label}</span>
                    <div className="text-right">
                      <span className="font-mono text-[0.85rem] font-extrabold text-ink">{r.total_reports}</span>
                      {r.verified_count > 0 && (
                        <span className="block text-[0.6rem] text-gray-mid">{r.verified_count} verified</span>
                      )}
                    </div>
                    <span className="text-[0.65rem] text-gray-mid text-right">{timeAgo(r.last_report)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
