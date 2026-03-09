'use client'
import { useState } from 'react'
import { CircleCheck, PenLine, Beer } from 'lucide-react'

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
          try { localStorage.setItem('arvo-reporter-name', name) } catch {}
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
      const saved = localStorage.getItem('arvo-reporter-name')
      if (saved && !name) setName(saved)
    } catch {}
  }

  if (status === 'success') {
    return (
      <div className="bg-green-pale border-3 border-green rounded-card p-4">
        <div className="flex items-center gap-2">
          <CircleCheck className="w-5 h-5 text-green" />
          <div>
            <p className="text-sm font-mono font-bold text-ink">Price reported!</p>
            <p className="text-xs text-gray-mid">Thanks for helping keep Arvo accurate.</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-ink text-white border-3 border-ink rounded-pill font-mono text-sm font-bold uppercase tracking-[0.05em] shadow-hard-sm hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover transition-all active:scale-[0.98]"
      >
        <PenLine className="w-4 h-4" />
        <span>Report Current Price</span>
      </button>
    )
  }

  return (
    <div className="bg-white rounded-card border-3 border-ink shadow-hard-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-mono text-sm font-extrabold text-ink"><PenLine className="w-4 h-4 inline" /> Report Price</h3>
        <button onClick={() => setIsOpen(false)} className="text-gray-mid hover:text-ink font-mono text-xs font-bold">✕ Close</button>
      </div>
      <p className="text-xs text-gray-mid mb-3">
        Seen the current pint price at {pubName}? Help us keep prices accurate!
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block font-mono text-[0.65rem] font-bold uppercase tracking-[0.08em] text-gray-mid mb-1">Pint price *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-mid text-sm font-mono font-bold">$</span>
            <input
              type="number"
              step="0.10"
              min="1"
              max="50"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="9.00"
              className="w-full pl-7 pr-3 py-2.5 border-2 border-gray-light rounded-card text-sm font-mono focus:outline-none focus:border-ink transition-all"
              required
            />
          </div>
        </div>
        <div>
          <label className="block font-mono text-[0.65rem] font-bold uppercase tracking-[0.08em] text-gray-mid mb-1">Beer type (optional)</label>
          <input
            type="text"
            value={beerType}
            onChange={(e) => setBeerType(e.target.value)}
            placeholder="e.g. Swan Draught, Emu Export"
            className="w-full px-3 py-2.5 border-2 border-gray-light rounded-card text-sm font-mono focus:outline-none focus:border-ink transition-all"
          />
        </div>
        <div>
          <label className="block font-mono text-[0.65rem] font-bold uppercase tracking-[0.08em] text-gray-mid mb-1">Your name (optional)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Anonymous"
            maxLength={30}
            className="w-full px-3 py-2.5 border-2 border-gray-light rounded-card text-sm font-mono focus:outline-none focus:border-ink transition-all"
          />
          <p className="text-[10px] text-gray-mid mt-1 font-mono">Show your name on the Arvo leaderboard</p>
        </div>

        {(status === 'error' || status === 'ratelimit') && (
          <div className="bg-red-pale border-2 border-red rounded-card px-3 py-2">
            <p className="text-xs text-red font-mono font-bold">{errorMsg}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'submitting' || !price}
          className="w-full py-3 bg-ink text-white rounded-pill border-3 border-ink font-mono font-bold text-sm uppercase tracking-[0.05em] shadow-hard-sm hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'submitting' ? 'Submitting...' : <><Beer className="w-4 h-4 inline" /> Submit Price Report</>}
        </button>
      </form>
    </div>
  )
}
