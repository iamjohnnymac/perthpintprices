'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DollarSign, Bell, BarChart3, Activity, FileText, Heart,
  Beer, Sunset, Users, Trophy, MapPin, AlertTriangle, Shield,
  Clock, RefreshCw, LogOut, Check, X, ChevronDown, ChevronUp,
  Copy, PenLine, Eye, EyeOff, Loader2, Store
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
    <div className="bg-white border border-gray-light rounded-card p-4">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon size={14} className="text-gray-mid" />}
        <p className="text-xs font-medium text-gray-mid">{label}</p>
      </div>
      <p className="text-2xl font-bold text-ink">{value}</p>
      {sub && <p className="text-xs text-gray-mid mt-1">{sub}</p>}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-pale text-amber',
    verified: 'bg-green-pale text-green',
    approved: 'bg-green-pale text-green',
    rejected: 'bg-red-pale text-red',
    success: 'bg-green-pale text-green',
    error: 'bg-red-pale text-red',
    warning: 'bg-amber-pale text-amber',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-light text-gray-mid'}`}>
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
    <div className="min-h-screen bg-off-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-amber text-2xl font-bold">✳</span>
            <span className="font-display text-2xl text-ink">arvo</span>
          </div>
          <p className="text-gray-mid text-sm">Admin Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-light rounded-card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-off-white border border-gray-light rounded-lg text-ink text-sm focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber pr-10"
                placeholder="Enter admin password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-mid hover:text-ink"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red text-sm bg-red-pale rounded-lg px-3 py-2">
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-2.5 bg-amber text-white font-semibold rounded-lg hover:bg-amber/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
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
    <div className="space-y-6">
      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Venues" value={data.overview.totalPubs} icon={Store} />
        <StatCard label="Priced" value={data.overview.pricedPubs} sub={`${data.overview.unpricedPubs} TBC`} icon={DollarSign} />
        <StatCard label="Suburbs" value={data.overview.suburbs} icon={MapPin} />
        <StatCard label="Avg Price" value={`$${data.overview.avgPrice.toFixed(2)}`} sub={`$${data.overview.minPrice} – $${data.overview.maxPrice}`} icon={Beer} />
      </div>

      {/* Features */}
      <div>
        <h3 className="text-sm font-semibold text-ink mb-3">Feature Coverage</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Happy Hour" value={data.features.happyHour} icon={Clock} />
          <StatCard label="Cozy Pubs" value={data.features.cozyPubs} icon={Heart} />
          <StatCard label="Sunset Spots" value={data.features.sunsetSpots} icon={Sunset} />
          <StatCard label="Dad Bars" value={data.features.dadBars} icon={Users} />
          <StatCard label="TAB Venues" value={data.features.tabVenues} icon={Trophy} />
        </div>
      </div>

      {/* Recently Updated */}
      <div>
        <h3 className="text-sm font-semibold text-ink mb-3">Recently Updated</h3>
        <div className="bg-white border border-gray-light rounded-card overflow-hidden">
          {data.recentlyUpdated.map((pub, i) => (
            <div key={i} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-gray-light' : ''}`}>
              <div>
                <p className="text-sm font-medium text-ink">{pub.name}</p>
                <p className="text-xs text-gray-mid">{pub.suburb}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-semibold text-ink">{pub.price ? `$${Number(pub.price).toFixed(2)}` : 'TBC'}</p>
                <p className="text-xs text-gray-mid">{timeAgo(pub.lastUpdated)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price History */}
      <div>
        <h3 className="text-sm font-semibold text-ink mb-3">Price Change History</h3>
        <div className="bg-white border border-gray-light rounded-card overflow-hidden">
          {data.priceHistory.recent.length === 0 ? (
            <p className="text-sm text-gray-mid px-4 py-6 text-center">No price changes recorded yet</p>
          ) : (
            data.priceHistory.recent.map((h, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-gray-light' : ''}`}>
                <div>
                  <p className="text-sm font-medium text-ink">{h.pubName}</p>
                  <p className="text-xs text-gray-mid">{h.source || h.changeType}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-semibold text-ink">${Number(h.price).toFixed(2)}</p>
                  <p className="text-xs text-gray-mid">{timeAgo(h.changedAt)}</p>
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
      <h3 className="text-sm font-semibold text-ink">Agent Activity Log</h3>
      <div className="bg-white border border-gray-light rounded-card overflow-hidden">
        {data.agentActivity.length === 0 ? (
          <p className="text-sm text-gray-mid px-4 py-6 text-center">No activity recorded</p>
        ) : (
          data.agentActivity.map((a, i) => (
            <div key={i} className={`flex items-start gap-3 px-4 py-3 ${i > 0 ? 'border-t border-gray-light' : ''}`}>
              <div className="mt-0.5">
                <CategoryIcon category={a.category} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink">{a.action}</p>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={a.status} />
                  <span className="text-xs text-gray-mid">{timeAgo(a.createdAt)}</span>
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
    <div className="space-y-6">
      {actionError && (
        <div className="flex items-center gap-2 text-red text-sm bg-red-pale rounded-lg px-3 py-2">
          <AlertTriangle size={14} />
          {actionError}
          <button onClick={() => setActionError(null)} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* Price Reports */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-ink">Price Reports</h3>
          {data.priceReports.pending > 0 && (
            <span className="bg-amber text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {data.priceReports.pending} pending
            </span>
          )}
        </div>
        <div className="bg-white border border-gray-light rounded-card overflow-hidden">
          {data.priceReports.recent.length === 0 ? (
            <p className="text-sm text-gray-mid px-4 py-6 text-center">No price reports yet</p>
          ) : (
            data.priceReports.recent.map((r, i) => {
              const isPending = r.status === 'pending'
              const approveKey = `price_report-${r.id}-approve`
              const rejectKey = `price_report-${r.id}-reject`
              return (
                <div key={r.id} className={`px-4 py-3 ${i > 0 ? 'border-t border-gray-light' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink">{r.pubSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <span className="text-sm font-mono font-semibold text-ink">${Number(r.reportedPrice).toFixed(2)}</span>
                        {r.beerType && <span className="text-xs text-gray-mid">{r.beerType}</span>}
                        <span className="text-xs text-gray-mid">by {r.reporter}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <StatusBadge status={r.status} />
                        <span className="text-xs text-gray-mid">{timeAgo(r.createdAt)}</span>
                      </div>
                    </div>
                    {isPending && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleReview('price_report', r.id, 'approve')}
                          disabled={actionLoading !== null}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green text-white text-xs font-medium rounded-lg hover:bg-green/90 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === approveKey ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                          Approve
                        </button>
                        <button
                          onClick={() => handleReview('price_report', r.id, 'reject')}
                          disabled={actionLoading !== null}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red text-white text-xs font-medium rounded-lg hover:bg-red/90 disabled:opacity-50 transition-colors"
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
          <h3 className="text-sm font-semibold text-ink">Pub Submissions</h3>
          {data.pubSubmissions.pending > 0 && (
            <span className="bg-amber text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {data.pubSubmissions.pending} pending
            </span>
          )}
        </div>
        <div className="bg-white border border-gray-light rounded-card overflow-hidden">
          {data.pubSubmissions.recent.length === 0 ? (
            <p className="text-sm text-gray-mid px-4 py-6 text-center">No pub submissions yet</p>
          ) : (
            data.pubSubmissions.recent.map((s, i) => {
              const isPending = s.status === 'pending'
              const approveKey = `pub_submission-${s.id}-approve`
              const rejectKey = `pub_submission-${s.id}-reject`
              return (
                <div key={s.id} className={`px-4 py-3 ${i > 0 ? 'border-t border-gray-light' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink">{s.pubName}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <span className="text-xs text-gray-mid flex items-center gap-1">
                          <MapPin size={10} />{s.suburb}
                        </span>
                        {s.address && <span className="text-xs text-gray-mid">{s.address}</span>}
                        {s.price && <span className="text-sm font-mono font-semibold text-ink">${Number(s.price).toFixed(2)}</span>}
                        {s.beerType && <span className="text-xs text-gray-mid">{s.beerType}</span>}
                      </div>
                      {s.submitterEmail && (
                        <p className="text-xs text-gray-mid mt-0.5">{s.submitterEmail}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <StatusBadge status={s.status} />
                        <span className="text-xs text-gray-mid">{timeAgo(s.createdAt)}</span>
                      </div>
                    </div>
                    {isPending && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleReview('pub_submission', s.id, 'approve')}
                          disabled={actionLoading !== null}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green text-white text-xs font-medium rounded-lg hover:bg-green/90 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === approveKey ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                          Approve
                        </button>
                        <button
                          onClick={() => handleReview('pub_submission', s.id, 'reject')}
                          disabled={actionLoading !== null}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red text-white text-xs font-medium rounded-lg hover:bg-red/90 disabled:opacity-50 transition-colors"
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
          className="flex items-center gap-2 text-sm font-semibold text-ink"
        >
          Unpriced Venues ({data.unpricedPubs.length})
          {showUnpriced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showUnpriced && (
          <div className="bg-white border border-gray-light rounded-card mt-3 overflow-hidden max-h-64 overflow-y-auto">
            {data.unpricedPubs.map((p, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-2 ${i > 0 ? 'border-t border-gray-light' : ''}`}>
                <span className="text-sm text-ink">{p.name}</span>
                <span className="text-xs text-gray-mid">{p.suburb}</span>
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
    <div className="space-y-6">
      {/* Push Notifications */}
      <div>
        <h3 className="text-sm font-semibold text-ink mb-3">Push Notifications</h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Subscribers" value={data.pushSubscriptions.total} icon={Bell} />
          <StatCard label="Active" value={data.pushSubscriptions.active} icon={Check} />
        </div>
      </div>

      {/* Latest Snapshot */}
      {snapshot && (
        <div>
          <h3 className="text-sm font-semibold text-ink mb-3">Latest Weekly Snapshot</h3>
          <div className="bg-white border border-gray-light rounded-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-mid">Snapshot Date</span>
              <span className="text-sm font-medium text-ink">{new Date(snapshot.snapshot_date).toLocaleDateString()}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-gray-mid">Avg Price</span>
                <p className="font-mono font-semibold text-ink">${Number(snapshot.avg_price || 0).toFixed(2)}</p>
              </div>
              <div>
                <span className="text-xs text-gray-mid">Median Price</span>
                <p className="font-mono font-semibold text-ink">${Number(snapshot.median_price || 0).toFixed(2)}</p>
              </div>
              <div>
                <span className="text-xs text-gray-mid">Total Pubs</span>
                <p className="font-semibold text-ink">{snapshot.total_pubs}</p>
              </div>
              <div>
                <span className="text-xs text-gray-mid">Suburbs</span>
                <p className="font-semibold text-ink">{snapshot.total_suburbs}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Quality */}
      <div>
        <h3 className="text-sm font-semibold text-ink mb-3">Data Quality</h3>
        <div className="bg-white border border-gray-light rounded-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink">Price Coverage</span>
            <span className="text-sm font-semibold text-ink">
              {data.overview.totalPubs > 0
                ? Math.round((data.overview.pricedPubs / data.overview.totalPubs) * 100)
                : 0}%
            </span>
          </div>
          <div className="w-full bg-gray-light rounded-full h-2">
            <div
              className="bg-amber h-2 rounded-full transition-all"
              style={{ width: `${data.overview.totalPubs > 0 ? (data.overview.pricedPubs / data.overview.totalPubs) * 100 : 0}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink">Vibe Tagged</span>
            <span className="text-sm font-semibold text-ink">
              {data.overview.vibeTagged} / {data.overview.totalPubs}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink">Price Reports</span>
            <span className="text-sm font-semibold text-ink">
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

  // Auto-login from session
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
    <div className="min-h-screen bg-off-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-light sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-amber text-xl font-bold">✳</span>
            <span className="font-display text-lg text-ink">arvo</span>
            <span className="text-xs text-gray-mid ml-1">admin</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ink border border-gray-light rounded-lg hover:bg-gray-light disabled:opacity-50 transition-colors"
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
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-mid hover:text-ink transition-colors"
            >
              <LogOut size={12} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white border border-gray-light rounded-card p-1">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            const hasPending = tab.id === 'reports' && data &&
              ((data.priceReports?.pending || 0) + (data.pubSubmissions?.pending || 0)) > 0
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                  isActive
                    ? 'bg-amber text-white'
                    : 'text-gray-mid hover:text-ink hover:bg-gray-light'
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{tab.label}</span>
                {hasPending && (
                  <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${isActive ? 'bg-white' : 'bg-amber'}`} />
                )}
              </button>
            )
          })}
        </div>

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-2 text-red text-sm bg-red-pale rounded-lg px-3 py-2 mb-4">
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && !data && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-amber" />
          </div>
        )}

        {/* Tab Content */}
        {data && (
          <>
            {activeTab === 'overview' && <OverviewTab data={data} />}
            {activeTab === 'activity' && <ActivityTab data={data} />}
            {activeTab === 'reports' && <ReportsTab data={data} password={password} onRefresh={fetchData} />}
            {activeTab === 'health' && <HealthTab data={data} />}
          </>
        )}

        {/* Footer */}
        {data && (
          <p className="text-center text-xs text-gray-mid mt-8 pb-4">
            Last fetched {timeAgo(data.generatedAt)}
          </p>
        )}
      </div>
    </div>
  )
}
