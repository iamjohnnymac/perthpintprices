'use client'

import { useState, useEffect, useCallback } from 'react'

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
  pushSubscriptions: {
    total: number
    active: number
  }
  priceReports: {
    total: number
    pending: number
    recent: Array<{
      pubSlug: string
      reportedPrice: number
      beerType: string
      reporter: string
      status: string
      createdAt: string
    }>
  }
  snapshot: any
  priceHistory: {
    totalChanges: number
    recent: Array<{
      pubSlug: string
      oldPrice: number
      newPrice: number
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

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className="bg-[#1A1A1A] border border-[#333] rounded-lg p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent ? 'text-[#E8820C]' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

function StatusDot({ status }: { status: string }) {
  const color = status === 'success' ? 'bg-green-500' : status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />
}

function CategoryIcon({ category }: { category: string }) {
  const icons: Record<string, string> = {
    scraper: '🕷️',
    deployment: '🚀',
    database: '🗄️',
    system: '⚙️',
    price: '💰',
    notification: '🔔',
    general: '📋',
  }
  return <span>{icons[category] || '📋'}</span>
}

export default function AdminDashboard() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'reports' | 'health'>('overview')

  const fetchData = useCallback(async (pw?: string) => {
    const token = pw || sessionStorage.getItem('admin_pw') || ''
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      if (res.status === 429) {
        const json = await res.json()
        setError(json.error || 'Too many failed attempts. Try again later.')
        setLoading(false)
        return
      }
      if (res.status === 401) {
        setAuthed(false)
        sessionStorage.removeItem('admin_pw')
        setError('Invalid password')
        setLoading(false)
        return
      }
      const json = await res.json()
      setData(json)
      setAuthed(true)
      setLastRefresh(new Date())
      sessionStorage.setItem('admin_pw', token)
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }, [])

  // Auto-login from session
  useEffect(() => {
    const saved = sessionStorage.getItem('admin_pw')
    if (saved) fetchData(saved)
  }, [fetchData])

  // Auto-refresh every 30s
  useEffect(() => {
    if (!authed) return
    const interval = setInterval(() => fetchData(), 30000)
    return () => clearInterval(interval)
  }, [authed, fetchData])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    fetchData(password)
  }

  // Password gate
  if (!authed) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-[#1A1A1A] border border-[#333] rounded-xl p-6 w-full max-w-sm">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-[#E8820C] text-2xl">✳️</span>
            <h1 className="text-white text-xl font-bold">Arvo Admin</h1>
          </div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter admin password"
            className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#E8820C] mb-4"
            autoFocus
          />
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E8820C] text-white font-semibold rounded-lg py-3 hover:bg-[#d4750b] transition-colors disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Enter Dashboard'}
          </button>
        </form>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center">
        <div className="text-[#E8820C] animate-pulse text-lg">Loading dashboard...</div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: '📊' },
    { id: 'activity' as const, label: 'Activity', icon: '📋' },
    { id: 'reports' as const, label: 'Reports', icon: '📝' },
    { id: 'health' as const, label: 'Health', icon: '🏥' },
  ]

  return (
    <div className="min-h-screen bg-[#111] text-white">
      {/* Header */}
      <header className="border-b border-[#333] sticky top-0 bg-[#111] z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#E8820C] text-xl">✳️</span>
            <h1 className="text-lg font-bold">Arvo Admin</h1>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {loading && <span className="text-[#E8820C] animate-pulse">Refreshing...</span>}
            {lastRefresh && <span>Updated {timeAgo(lastRefresh.toISOString())}</span>}
            <button
              onClick={() => fetchData()}
              className="text-gray-400 hover:text-[#E8820C] transition-colors"
            >
              ↻ Refresh
            </button>
            <button
              onClick={() => { sessionStorage.removeItem('admin_pw'); setAuthed(false); setData(null) }}
              className="text-gray-400 hover:text-red-400 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-[#333]">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#E8820C] text-[#E8820C]'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Total Pubs" value={data.overview.totalPubs} accent />
              <StatCard label="Priced" value={data.overview.pricedPubs} sub={`${data.overview.unpricedPubs} unpriced`} />
              <StatCard label="Avg Price" value={`$${data.overview.avgPrice.toFixed(2)}`} accent />
              <StatCard label="Suburbs" value={data.overview.suburbs} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Cheapest" value={`$${data.overview.minPrice.toFixed(2)}`} />
              <StatCard label="Most Expensive" value={`$${data.overview.maxPrice.toFixed(2)}`} />
              <StatCard label="Vibe Tagged" value={data.overview.vibeTagged} sub={`of ${data.overview.totalPubs}`} />
              <StatCard label="Price Changes" value={data.priceHistory.totalChanges} />
            </div>

            {/* Feature Coverage */}
            <div className="bg-[#1A1A1A] border border-[#333] rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Feature Coverage</h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: 'Happy Hour', value: data.features.happyHour, icon: '🍻' },
                  { label: 'Cozy Pubs', value: data.features.cozyPubs, icon: '☕' },
                  { label: 'Sunset Spots', value: data.features.sunsetSpots, icon: '🌅' },
                  { label: 'Dad Bars', value: data.features.dadBars, icon: '👨‍👧' },
                  { label: 'TAB Venues', value: data.features.tabVenues, icon: '🏇' },
                ].map(f => (
                  <div key={f.label} className="text-center p-3 bg-[#111] rounded-lg">
                    <p className="text-lg">{f.icon}</p>
                    <p className="text-xl font-bold text-[#E8820C]">{f.value}</p>
                    <p className="text-xs text-gray-500">{f.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Push & Reports Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#1A1A1A] border border-[#333] rounded-lg p-4">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">🔔 Push Notifications</h2>
                <div className="flex gap-6">
                  <div>
                    <p className="text-2xl font-bold text-[#E8820C]">{data.pushSubscriptions.total}</p>
                    <p className="text-xs text-gray-500">Total subscribers</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{data.pushSubscriptions.active}</p>
                    <p className="text-xs text-gray-500">Active</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#1A1A1A] border border-[#333] rounded-lg p-4">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">📝 Crowdsourced Reports</h2>
                <div className="flex gap-6">
                  <div>
                    <p className="text-2xl font-bold text-[#E8820C]">{data.priceReports.total}</p>
                    <p className="text-xs text-gray-500">Total reports</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-400">{data.priceReports.pending}</p>
                    <p className="text-xs text-gray-500">Pending review</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recently Updated Pubs */}
            <div className="bg-[#1A1A1A] border border-[#333] rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Recently Updated Pubs</h2>
              <div className="space-y-2">
                {data.recentlyUpdated.map((pub, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-[#222] last:border-0">
                    <div>
                      <span className="text-white font-medium">{pub.name}</span>
                      <span className="text-gray-500 text-xs ml-2">{pub.suburb}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#E8820C] font-mono">${pub.price?.toFixed(2) || 'TBC'}</span>
                      <span className="text-gray-600 text-xs">{pub.lastUpdated ? timeAgo(pub.lastUpdated) : '—'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ACTIVITY TAB */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            <div className="bg-[#1A1A1A] border border-[#333] rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Agent Activity Feed</h2>
              {data.agentActivity.length === 0 ? (
                <p className="text-gray-600 text-sm">No activity logged yet. Activity will appear here as the agent runs tasks.</p>
              ) : (
                <div className="space-y-3">
                  {data.agentActivity.map((activity, i) => (
                    <div key={i} className="flex items-start gap-3 py-3 border-b border-[#222] last:border-0">
                      <div className="mt-0.5">
                        <CategoryIcon category={activity.category} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <StatusDot status={activity.status} />
                          <span className="text-white font-medium text-sm">{activity.action}</span>
                        </div>
                        {activity.details?.description && (
                          <p className="text-gray-500 text-xs mt-1 truncate">{activity.details.description}</p>
                        )}
                      </div>
                      <span className="text-gray-600 text-xs whitespace-nowrap">{timeAgo(activity.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {/* Price Reports */}
            <div className="bg-[#1A1A1A] border border-[#333] rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Crowdsourced Price Reports</h2>
              {data.priceReports.recent.length === 0 ? (
                <p className="text-gray-600 text-sm">No price reports submitted yet.</p>
              ) : (
                <div className="space-y-2">
                  {data.priceReports.recent.map((report, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-[#222] last:border-0">
                      <div className="flex-1 min-w-0">
                        <span className="text-white font-medium text-sm">{report.pubSlug.replace(/-/g, ' ')}</span>
                        {report.beerType && <span className="text-gray-500 text-xs ml-2">({report.beerType})</span>}
                        <p className="text-gray-600 text-xs">by {report.reporter}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[#E8820C] font-mono font-bold">${report.reportedPrice}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          report.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' :
                          report.status === 'verified' ? 'bg-green-900/30 text-green-400' :
                          'bg-red-900/30 text-red-400'
                        }`}>{report.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Price History */}
            <div className="bg-[#1A1A1A] border border-[#333] rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Price Change History <span className="text-[#E8820C]">({data.priceHistory.totalChanges} total)</span>
              </h2>
              {data.priceHistory.recent.length === 0 ? (
                <p className="text-gray-600 text-sm">No price changes recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {data.priceHistory.recent.map((change, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-[#222] last:border-0">
                      <span className="text-white text-sm">{change.pubSlug.replace(/-/g, ' ')}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-mono text-sm">${change.oldPrice?.toFixed(2)}</span>
                        <span className="text-gray-600">→</span>
                        <span className={`font-mono font-bold text-sm ${
                          (change.newPrice || 0) < (change.oldPrice || 0) ? 'text-green-400' : 'text-red-400'
                        }`}>${change.newPrice?.toFixed(2)}</span>
                        <span className="text-gray-600 text-xs">{timeAgo(change.changedAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* HEALTH TAB */}
        {activeTab === 'health' && (
          <div className="space-y-4">
            {/* Data Quality */}
            <div className="bg-[#1A1A1A] border border-[#333] rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Data Quality</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Price coverage</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-[#333] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#E8820C] rounded-full" 
                        style={{ width: `${(data.overview.pricedPubs / data.overview.totalPubs * 100)}%` }}
                      />
                    </div>
                    <span className="text-white text-sm font-mono">
                      {Math.round(data.overview.pricedPubs / data.overview.totalPubs * 100)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Vibe tags</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-[#333] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#E8820C] rounded-full" 
                        style={{ width: `${(data.overview.vibeTagged / data.overview.totalPubs * 100)}%` }}
                      />
                    </div>
                    <span className="text-white text-sm font-mono">
                      {Math.round(data.overview.vibeTagged / data.overview.totalPubs * 100)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Happy hour data</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-[#333] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#E8820C] rounded-full" 
                        style={{ width: `${(data.features.happyHour / data.overview.totalPubs * 100)}%` }}
                      />
                    </div>
                    <span className="text-white text-sm font-mono">
                      {Math.round(data.features.happyHour / data.overview.totalPubs * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Unpriced Pubs */}
            {data.unpricedPubs.length > 0 && (
              <div className="bg-[#1A1A1A] border border-[#333] rounded-lg p-4">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  ⚠️ Pubs Without Prices ({data.unpricedPubs.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {data.unpricedPubs.map((pub, i) => (
                    <div key={i} className="flex items-center gap-2 py-1">
                      <span className="text-red-400 text-xs">●</span>
                      <span className="text-white text-sm">{pub.name}</span>
                      <span className="text-gray-600 text-xs">{pub.suburb}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Snapshot Info */}
            {data.snapshot && (
              <div className="bg-[#1A1A1A] border border-[#333] rounded-lg p-4">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Latest Snapshot</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Date</p>
                    <p className="text-white font-mono">{data.snapshot.snapshot_date}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Pub Count</p>
                    <p className="text-white font-mono">{data.snapshot.total_pubs}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Avg Price</p>
                    <p className="text-[#E8820C] font-mono">${data.snapshot.avg_price}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Range</p>
                    <p className="text-white font-mono">${data.snapshot.min_price} - ${data.snapshot.max_price}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Security Monitor */}
            {data.agentActivity.filter(a => a.category === 'security').length > 0 && (
              <div className="bg-[#1A1A1A] border border-red-900/50 rounded-lg p-4">
                <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3">🔒 Security Events</h2>
                <div className="space-y-2">
                  {data.agentActivity.filter(a => a.category === 'security').slice(0, 5).map((event, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-[#222] last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-400 rounded-full" />
                        <span className="text-white text-sm">{event.action}</span>
                      </div>
                      <span className="text-gray-600 text-xs">{timeAgo(event.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* System Status */}
            <div className="bg-[#1A1A1A] border border-[#333] rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">System Status</h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Dashboard data</span>
                  <span className="text-green-400 flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full inline-block" /> Live</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Rate limiting</span>
                  <span className="text-green-400 flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full inline-block" /> Active (5 attempts / 15min)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Auth protection</span>
                  <span className="text-green-400 flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full inline-block" /> Timing-safe</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Auto-refresh</span>
                  <span className="text-green-400">Every 30s</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Last generated</span>
                  <span className="text-gray-300 font-mono">{new Date(data.generatedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
