'use client'
import { useState } from 'react'

interface PriceReporterProps {
  pubSlug: string
  pubName: string
  currentPrice: number | null
}

export default function PriceReporter({ pubSlug, pubName, currentPrice }: PriceReporterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [price, setPrice] = useState(currentPrice?.toString() || '')
  const [beerType, setBeerType] = useState('')
  const [name, setName] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error' | 'ratelimit'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!price) return

    setStatus('submitting')
    try {
      const res = await fetch('/api/price-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pub_slug: pubSlug,
          reported_price: parseFloat(price),
          beer_type: beerType || undefined,
          reporter_name: name || 'Anonymous',
        }),
      })

      const data = await res.json()
      if (res.status === 429) {
        setStatus('ratelimit')
        setErrorMsg(data.error)
      } else if (!res.ok) {
        setStatus('error')
        setErrorMsg(data.error || 'Something went wrong')
      } else {
        setStatus('success')
        // Save reporter name for future use
        if (name) {
          try { localStorage.setItem('pintdex-reporter-name', name) } catch {}
        }
      }
    } catch {
      setStatus('error')
      setErrorMsg('Network error. Please try again.')
    }
  }

  // Load saved name on open
  function handleOpen() {
    setIsOpen(true)
    try {
      const saved = localStorage.getItem('pintdex-reporter-name')
      if (saved && !name) setName(saved)
    } catch {}
  }

  if (status === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <span className="text-green-600 text-lg">✅</span>
          <div>
            <p className="text-sm font-semibold text-green-800">Price reported!</p>
            <p className="text-xs text-green-600">Thanks for helping keep PintDex accurate.</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber/10 hover:bg-amber/20 border border-amber/30 rounded-xl text-sm font-semibold text-amber-dark transition-all active:scale-[0.98]"
      >
        <span>📝</span>
        <span>Report Current Price</span>
      </button>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-charcoal">📝 Report Price</h3>
        <button onClick={() => setIsOpen(false)} className="text-stone-400 hover:text-stone-600 text-xs">✕ Close</button>
      </div>
      <p className="text-xs text-stone-500 mb-3">
        Seen the current pint price at {pubName}? Help us keep prices accurate!
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Pint price *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-medium">$</span>
            <input
              type="number"
              step="0.10"
              min="1"
              max="50"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="9.00"
              className="w-full pl-7 pr-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/30"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Beer type (optional)</label>
          <input
            type="text"
            value={beerType}
            onChange={(e) => setBeerType(e.target.value)}
            placeholder="e.g. Swan Draught, Emu Export"
            className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/30"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Your name (optional)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Anonymous"
            maxLength={30}
            className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/30"
          />
          <p className="text-[10px] text-stone-400 mt-1">Show your name on the PintDex leaderboard</p>
        </div>

        {(status === 'error' || status === 'ratelimit') && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <p className="text-xs text-red-600">{errorMsg}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'submitting' || !price}
          className="w-full py-3 bg-charcoal hover:bg-charcoal/90 text-white rounded-lg font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {status === 'submitting' ? 'Submitting...' : '🍺 Submit Price Report'}
        </button>
      </form>
    </div>
  )
}
