'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DollarSign, Bell, BarChart3, Activity, FileText, Heart,
  Beer, Sunset, Users, Trophy, MapPin, AlertTriangle, Shield,
  Clock, RefreshCw, LogOut, Check, X, ChevronDown, ChevronUp,
  Eye, EyeOff, Loader2, Store
} from 'lucide-react'

/* ================================================================
   TYPES
   ================================================================ */

interface DashboardData {
  overview: {
    totalPubs: number
    pricedPubs: number
    unpricedPubs: number
    suburbs: number
    avgPrice: number
    minPrice: number
    maxPrice: number
    vibeTagged: number
  }
  features: {
    happyHour: number
    cozyPubs: number
    sunsetSpots: number
    dadBars: number
    tabVenues: number
  }
  pushSubscriptions: { total: number; active: number }
  priceReports: {
    total: number
    pending: number
    recent: Array<{
      id: string
      pubSlug: string
      reportedPrice: number
      beerType: string
      reporter: string
      status: string
      createdAt: string
    }>
  }
  pubSubmissions: {
    total: number
    pending: number
    recent: Array<{
      id: number
      pubName: string
      suburb: string
      address: string
      price: number | null
      beerType: string | null
      submitterEmail: string | null
      status: string
      createdAt: string
    }>
  }
  snapshot: any
  priceHistory: {
    totalChanges: number
    recent: Array<{
      pubSlug: string
      pubName: string
      price: number
      happyHourPrice: number | null
      changeType: string
      source: string | null
      changedAt: string
    }>
  }
  recentlyUpdated: Array<{
    name: string
    suburb: string
    price: number
    lastUpdated: string
  }>
  agentActivity: Array<{
    action: string
    category: string
    details: any
    status: string
    createdAt: string
  }>
  unpricedPubs: Array<{ name: string; suburb: string }>
  generatedAt: string
}

/* ================================================================
   HELPERS
   ================================================================ */

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

/* ================================================================
   SMALL COMPONENTS
   ================================================================ */

function StatCard({ label, value, sub, icon: Icon }: {
  label: string; value: string | number; sub?: string; icon?: React.ElementType
}) {
  return (
    <div className="bg-white border-3 border-ink rounded-card p-4 shadow-hard-sm">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon size={14} className="text-gray-mid" />}
        <p className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.08em] text-gray-mid">{label}</p>
      </div>
      <p className="font-mono text-2xl font-extrabold text-ink">{value}</p>
      {sub && <p className="font-mono text-[0.65rem] text-gray-mid mt-1">{sub}</p>}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-pale text-amber border-amber',
    verified: 'bg-green-pale text-green border-green',
    approved: 'bg-green-pale text-green border-green',
    rejected: 'bg-red-pale text-red border-red',
    success: 'bg-green-pale text-green border-green',
    error: 'bg-red-pale text-red border-red',
    warning: 'bg-amber-pale text-amber border-amber',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 border-2 rounded-pill font-mono text-[0.6rem] font-bold uppercase tracking-[0.05em] ${styles[status] || 'bg-gray-light text-gray-mid border-gray'}`}>
      {status}
    </span>
  )
}

function CategoryIcon({ category }: { category: string }) {
  const icons: Record<string, React.ElementType> = {
    scraper: RefreshCw,
    deployment: BarChart3,
    'price-update': DollarSign,
    security: Shield,
    notification: Bell,
    submission: FileText,
  }
  const Icon = icons[category] || Activity
  return <Icon size={14} className="text-gray-mid" />
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.08em] text-ink mb-3">{children}</h3>
  )
}

/* ================================================================
   LOGIN SCREEN
   ================================================================ */

function LoginScreen({ onLogin }: { onLogin: (pw: string) => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${password}` },
      })
      if (res.ok) {
        onLogin(password)
      } else if (res.status === 429) {
        setError('Too many attempts. Try again later.')
      } else {
        setError('Wrong password')
      }
    } catch {
      setError('Connection error')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#FDF8F0] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-9 h-9 bg-amber border-3 border-ink rounded-md flex items-center justify-center shadow-[2px_2px_0_#171717]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
            </div>
            <span className="font-mono text-[2rem] font-extrabold text-ink tracking-[-0.04em]">arvo</span>
          </div>
          <p className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.1em] text-gray-mid">Admin Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border-3 border-ink rounded-card p-6 shadow-hard-sm space-y-4">
          <div>
            <label className="block font-mono text-[0.65rem] font-bold uppercase tracking-[0.08em] text-ink mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-off-white border-3 border-ink rounded-card font-mono text-sm text-ink focus:outline-none focus:border-amber pr-10"
                placeholder="Enter admin password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-mid hover:text-ink transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red font-mono text-[0.7rem] font-bold bg-red-pale border-2 border-red rounded-card px-3 py-2">
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 bg-amber text-white font-mono text-[0.75rem] font-bold uppercase tracking-[0.05em] border-3 border-ink rounded-card shadow-hard-sm hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ================================================================
   TABS
   ================================================================ */

type TabId = 'overview' | 'activity' | 'reports' | 'health'

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'health', label: 'Health', icon: Heart },
]

/* ================================================================
   TAB: OVERVIEW
   ================================================================ */

function OverviewTab({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Venues" value={data.overview.totalPubs} icon={Store} />
        <StatCard label="Priced" value={data.overview.pricedPubs} sub={`${data.overview.unpricedPubs} TBC`} icon={DollarSign} />
        <StatCard label="Suburbs" value={data.overview.suburbs} icon={MapPin} />
        <StatCard label="Avg Price" value={`$${data.overview.avgPrice.toFixed(2)}`} sub={`$${data.overview.minPrice} – $${data.overview.maxPrice}`} icon={Beer} />
      </div>

      <div>
        <SectionTitle>Feature Coverage</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Happy Hour" value={data.features.happyHour} icon={Clock} />
          <StatCard label="Cozy Pubs" value={data.features.cozyPubs} icon={Heart} />
          <StatCard label="Sunset Spots" value={data.features.sunsetSpots} icon={Sunset} />
          <StatCard label="Dad Bars" value={data.features.dadBars} icon={Users} />
          <StatCard label="TAB Venues" value={data.features.tabVenues} icon={Trophy} />
        </div>
      </div>

      <div>
        <SectionTitle>Recently Updated</SectionTitle>
        <div className="bg-white border-3 border-ink rounded-card shadow-hard-sm overflow-hidden">
          {data.recentlyUpdated.map((pub, i) => (
            <div key={i} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t-2 border-ink/10' : ''}`}>
              <div>
                <p className="font-mono text-[0.8rem] font-bold text-ink">{pub.name}</p>
                <p className="font-mono text-[0.65rem] text-gray-mid">{pub.suburb}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[0.85rem] font-extrabold text-ink tabular-nums">{pub.price ? `$${Number(pub.price).toFixed(2)}` : 'TBC'}</p>
                <p className="font-mono text-[0.6rem] text-gray-mid">{timeAgo(pub.lastUpdated)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>Price Change History</SectionTitle>
        <div className="bg-white border-3 border-ink rounded-card shadow-hard-sm overflow-hidden">
          {data.priceHistory.recent.length === 0 ? (
            <p className="font-mono text-[0.75rem] text-gray-mid px-4 py-6 text-center">No price changes recorded yet</p>
          ) : (
            data.priceHistory.recent.map((h, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t-2 border-ink/10' : ''}`}>
                <div>
                  <p className="font-mono text-[0.8rem] font-bold text-ink">{h.pubName}</p>
                  <p className="font-mono text-[0.65rem] text-gray-mid">{h.source || h.changeType}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[0.85rem] font-extrabold text-ink tabular-nums">${Number(h.price).toFixed(2)}</p>
                  <p className="font-mono text-[0.6rem] text-gray-mid">{timeAgo(h.changedAt)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   TAB: ACTIVITY
   ================================================================ */

function ActivityTab({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-3">
      <SectionTitle>Agent Activity Log</SectionTitle>
      <div className="bg-white border-3 border-ink rounded-card shadow-hard-sm overflow-hidden">
        {data.agentActivity.length === 0 ? (
          <p className="font-mono text-[0.75rem] text-gray-mid px-4 py-6 text-center">No activity recorded</p>
        ) : (
          data.agentActivity.map((a, i) => (
            <div key={i} className={`flex items-start gap-3 px-4 py-3 ${i > 0 ? 'border-t-2 border-ink/10' : ''}`}>
              <div className="mt-0.5">
                <CategoryIcon category={a.category} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[0.75rem] font-medium text-ink">{a.action}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <StatusBadge status={a.status} />
                  <span className="font-mono text-[0.6rem] text-gray-mid">{timeAgo(a.createdAt)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

/* ================================================================
   TAB: REPORTS (with approve/reject)
   ================================================================ */

function ReportsTab({ data, password, onRefresh }: { data: DashboardData; password: string; onRefresh: () => void }) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [showUnpriced, setShowUnpriced] = useState(false)

  const handleReview = async (type: 'price_report' | 'pub_submission', id: string | number, action: 'approve' | 'reject') => {
    const key = `${type}-${id}-${action}`
    setActionLoading(key)
    setActionError(null)
    try {
      const res = await fetch('/api/admin/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify({ type, id, action }),
      })
      const result = await res.json()
      if (!res.ok) {
        setActionError(result.error || 'Action failed')
      } else {
        onRefresh()
      }
    } catch {
      setActionError('Network error')
    }
    setActionLoading(null)
  }

  return (
    <div className="space-y-8">
      {actionError && (
        <div className="flex items-center gap-2 text-red font-mono text-[0.7rem] font-bold bg-red-pale border-2 border-red rounded-card px-3 py-2">
          <AlertTriangle size={14} />
          {actionError}
          <button onClick={() => setActionError(null)} className="ml-auto hover:text-ink transition-colors"><X size={14} /></button>
        </div>
      )}

      {/* Price Reports */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>Price Reports</SectionTitle>
          {data.priceReports.pending > 0 && (
            <span className="bg-amber text-white font-mono text-[0.6rem] font-bold uppercase tracking-[0.05em] px-2.5 py-1 border-2 border-ink rounded-pill">
              {data.priceReports.pending} pending
            </span>
          )}
        </div>
        <div className="bg-white border-3 border-ink rounded-card shadow-hard-sm overflow-hidden">
          {data.priceReports.recent.length === 0 ? (
            <p className="font-mono text-[0.75rem] text-gray-mid px-4 py-6 text-center">No price reports yet</p>
          ) : (
            data.priceReports.recent.map((r, i) => {
              const isPending = r.status === 'pending'
              const approveKey = `price_report-${r.id}-approve`
              const rejectKey = `price_report-${r.id}-reject`
              return (
                <div key={r.id} className={`px-4 py-4 ${i > 0 ? 'border-t-2 border-ink/10' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[0.85rem] font-bold text-ink">{r.pubSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                        <span className="font-mono text-[0.9rem] font-extrabold text-ink tabular-nums">${Number(r.reportedPrice).toFixed(2)}</span>
                        {r.beerType && <span className="font-mono text-[0.65rem] text-gray-mid">{r.beerType}</span>}
                        <span className="font-mono text-[0.65rem] text-gray-mid">by {r.reporter}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <StatusBadge status={r.status} />
                        <span className="font-mono text-[0.6rem] text-gray-mid">{timeAgo(r.createdAt)}</span>
                      </div>
                    </div>
                    {isPending && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleReview('price_report', r.id, 'approve')}
                          disabled={actionLoading !== null}
                          className="flex items-center gap-1.5 px-4 py-2 bg-green text-white font-mono text-[0.65rem] font-bold uppercase tracking-[0.05em] border-3 border-ink rounded-card shadow-hard-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-hard-hover disabled:opacity-50 transition-all"
                        >
                          {actionLoading === approveKey ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                          Approve
                        </button>
                        <button
                          onClick={() => handleReview('price_report', r.id, 'reject')}
                          disabled={actionLoading !== null}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red text-white font-mono text-[0.65rem] font-bold uppercase tracking-[0.05em] border-3 border-ink rounded-card shadow-hard-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-hard-hover disabled:opacity-50 transition-all"
                        >
                          {actionLoading === rejectKey ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Pub Submissions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>Pub Submissions</SectionTitle>
          {data.pubSubmissions.pending > 0 && (
            <span className="bg-amber text-white font-mono text-[0.6rem] font-bold uppercase tracking-[0.05em] px-2.5 py-1 border-2 border-ink rounded-pill">
              {data.pubSubmissions.pending} pending
            </span>
          )}
        </div>
        <div className="bg-white border-3 border-ink rounded-card shadow-hard-sm overflow-hidden">
          {data.pubSubmissions.recent.length === 0 ? (
            <p className="font-mono text-[0.75rem] text-gray-mid px-4 py-6 text-center">No pub submissions yet</p>
          ) : (
            data.pubSubmissions.recent.map((s, i) => {
              const isPending = s.status === 'pending'
              const approveKey = `pub_submission-${s.id}-approve`
              const rejectKey = `pub_submission-${s.id}-reject`
              return (
                <div key={s.id} className={`px-4 py-4 ${i > 0 ? 'border-t-2 border-ink/10' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[0.85rem] font-bold text-ink">{s.pubName}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                        <span className="font-mono text-[0.65rem] text-gray-mid flex items-center gap-1">
                          <MapPin size={10} />{s.suburb}
                        </span>
                        {s.address && <span className="font-mono text-[0.65rem] text-gray-mid">{s.address}</span>}
                        {s.price && <span className="font-mono text-[0.9rem] font-extrabold text-ink tabular-nums">${Number(s.price).toFixed(2)}</span>}
                        {s.beerType && <span className="font-mono text-[0.65rem] text-gray-mid">{s.beerType}</span>}
                      </div>
                      {s.submitterEmail && (
                        <p className="font-mono text-[0.6rem] text-gray-mid mt-1">{s.submitterEmail}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <StatusBadge status={s.status} />
                        <span className="font-mono text-[0.6rem] text-gray-mid">{timeAgo(s.createdAt)}</span>
                      </div>
                    </div>
                    {isPending && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleReview('pub_submission', s.id, 'approve')}
                          disabled={actionLoading !== null}
                          className="flex items-center gap-1.5 px-4 py-2 bg-green text-white font-mono text-[0.65rem] font-bold uppercase tracking-[0.05em] border-3 border-ink rounded-card shadow-hard-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-hard-hover disabled:opacity-50 transition-all"
                        >
                          {actionLoading === approveKey ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                          Approve
                        </button>
                        <button
                          onClick={() => handleReview('pub_submission', s.id, 'reject')}
                          disabled={actionLoading !== null}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red text-white font-mono text-[0.65rem] font-bold uppercase tracking-[0.05em] border-3 border-ink rounded-card shadow-hard-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-hard-hover disabled:opacity-50 transition-all"
                        >
                          {actionLoading === rejectKey ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Unpriced Pubs */}
      <div>
        <button
          onClick={() => setShowUnpriced(!showUnpriced)}
          className="flex items-center gap-2 font-mono text-[0.7rem] font-bold uppercase tracking-[0.08em] text-ink hover:text-amber transition-colors"
        >
          Unpriced Venues ({data.unpricedPubs.length})
          {showUnpriced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showUnpriced && (
          <div className="bg-white border-3 border-ink rounded-card shadow-hard-sm mt-3 overflow-hidden max-h-64 overflow-y-auto">
            {data.unpricedPubs.map((p, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-2.5 ${i > 0 ? 'border-t-2 border-ink/10' : ''}`}>
                <span className="font-mono text-[0.75rem] font-medium text-ink">{p.name}</span>
                <span className="font-mono text-[0.65rem] text-gray-mid">{p.suburb}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ================================================================
   TAB: HEALTH
   ================================================================ */

function HealthTab({ data }: { data: DashboardData }) {
  const snapshot = data.snapshot
  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>Push Notifications</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Subscribers" value={data.pushSubscriptions.total} icon={Bell} />
          <StatCard label="Active" value={data.pushSubscriptions.active} icon={Check} />
        </div>
      </div>

      {snapshot && (
        <div>
          <SectionTitle>Latest Weekly Snapshot</SectionTitle>
          <div className="bg-white border-3 border-ink rounded-card shadow-hard-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.08em] text-gray-mid">Snapshot Date</span>
              <span className="font-mono text-[0.8rem] font-bold text-ink">{new Date(snapshot.snapshot_date).toLocaleDateString()}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.08em] text-gray-mid">Avg Price</span>
                <p className="font-mono text-lg font-extrabold text-ink tabular-nums">${Number(snapshot.avg_price || 0).toFixed(2)}</p>
              </div>
              <div>
                <span className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.08em] text-gray-mid">Median Price</span>
                <p className="font-mono text-lg font-extrabold text-ink tabular-nums">${Number(snapshot.median_price || 0).toFixed(2)}</p>
              </div>
              <div>
                <span className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.08em] text-gray-mid">Total Pubs</span>
                <p className="font-mono text-lg font-extrabold text-ink">{snapshot.total_pubs}</p>
              </div>
              <div>
                <span className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.08em] text-gray-mid">Suburbs</span>
                <p className="font-mono text-lg font-extrabold text-ink">{snapshot.total_suburbs}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <SectionTitle>Data Quality</SectionTitle>
        <div className="bg-white border-3 border-ink rounded-card shadow-hard-sm p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[0.7rem] font-medium text-ink">Price Coverage</span>
              <span className="font-mono text-[0.75rem] font-extrabold text-ink">
                {data.overview.totalPubs > 0
                  ? Math.round((data.overview.pricedPubs / data.overview.totalPubs) * 100)
                  : 0}%
              </span>
            </div>
            <div className="w-full bg-off-white border-2 border-ink rounded-pill h-4 overflow-hidden">
              <div
                className="bg-amber h-full rounded-pill transition-all"
                style={{ width: `${data.overview.totalPubs > 0 ? (data.overview.pricedPubs / data.overview.totalPubs) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t-2 border-ink/10">
            <span className="font-mono text-[0.7rem] font-medium text-ink">Vibe Tagged</span>
            <span className="font-mono text-[0.75rem] font-extrabold text-ink">
              {data.overview.vibeTagged} / {data.overview.totalPubs}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t-2 border-ink/10">
            <span className="font-mono text-[0.7rem] font-medium text-ink">Price Reports</span>
            <span className="font-mono text-[0.75rem] font-extrabold text-ink">
              {data.priceReports.total} ({data.priceReports.pending} pending)
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   MAIN DASHBOARD
   ================================================================ */

export default function AdminDashboard() {
  const [password, setPassword] = useState<string | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!password) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${password}` },
      })
      if (res.ok) {
        setData(await res.json())
      } else {
        setError('Failed to fetch data')
      }
    } catch {
      setError('Connection error')
    }
    setLoading(false)
  }, [password])

  useEffect(() => {
    if (password) fetchData()
  }, [password, fetchData])

  const handleLogin = (pw: string) => {
    setPassword(pw)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('arvo-admin', pw)
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('arvo-admin')
      if (saved) setPassword(saved)
    }
  }, [])

  if (!password) {
    return <LoginScreen onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-[#FDF8F0]">
      {/* Header */}
      <header className="bg-white border-b-3 border-ink sticky top-0 z-50">
        <div className="max-w-container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-amber border-2 border-ink rounded-md flex items-center justify-center shadow-[2px_2px_0_#171717]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
            </div>
            <span className="font-mono text-[1.6rem] font-extrabold text-ink tracking-[-0.04em]">arvo</span>
            <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.08em] text-gray-mid ml-1">admin</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 font-mono text-[0.65rem] font-bold uppercase tracking-[0.05em] text-ink bg-white border-3 border-ink rounded-card shadow-hard-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-hard-hover disabled:opacity-50 transition-all"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={() => {
                setPassword(null)
                setData(null)
                sessionStorage.removeItem('arvo-admin')
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-gray-mid hover:text-ink transition-colors"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-container mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            const hasPending = tab.id === 'reports' && data &&
              ((data.priceReports?.pending || 0) + (data.pubSubmissions?.pending || 0)) > 0
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 font-mono text-[0.65rem] font-bold uppercase tracking-[0.05em] border-3 border-ink rounded-card transition-all relative ${
                  isActive
                    ? 'bg-amber text-white shadow-hard-sm'
                    : 'bg-white text-gray-mid hover:text-ink shadow-hard-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-hard-hover'
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{tab.label}</span>
                {hasPending && (
                  <span className={`absolute -top-1.5 -right-1.5 w-3 h-3 border-2 border-ink rounded-full ${isActive ? 'bg-white' : 'bg-amber'}`} />
                )}
              </button>
            )
          })}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red font-mono text-[0.7rem] font-bold bg-red-pale border-2 border-red rounded-card px-3 py-2 mb-6">
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {loading && !data && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-amber" />
          </div>
        )}

        {data && (
          <>
            {activeTab === 'overview' && <OverviewTab data={data} />}
            {activeTab === 'activity' && <ActivityTab data={data} />}
            {activeTab === 'reports' && <ReportsTab data={data} password={password} onRefresh={fetchData} />}
            {activeTab === 'health' && <HealthTab data={data} />}
          </>
        )}

        {data && (
          <p className="text-center font-mono text-[0.6rem] text-gray-mid mt-10 pb-6">
            Last fetched {timeAgo(data.generatedAt)}
          </p>
        )}
      </div>
    </div>
  )
}
