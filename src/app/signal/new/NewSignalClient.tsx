'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import SubPageNav from '@/components/SubPageNav'
import Footer from '@/components/Footer'
import { perthNow } from '@/lib/perthClock'
import type { SlimPub } from '@/lib/pubPhoto'

interface NewSignalClientProps {
  pubs: SlimPub[]
}

interface TimeChip {
  key: string
  label: string
  /** Perth hour of day (24h), or null for "Now". */
  hour: number | null
}

const TIME_CHIPS: TimeChip[] = [
  { key: 'now', label: 'Now', hour: null },
  { key: '17', label: '5pm', hour: 17 },
  { key: '18', label: '6pm', hour: 18 },
  { key: '19', label: '7pm', hour: 19 },
  { key: '20', label: '8pm', hour: 20 },
]

const PERTH_OFFSET_HOURS = 8

/** ISO instant for a Perth wall-clock hour today. */
function perthHourTodayIso(hour: number): string {
  const perth = perthNow(new Date())
  const [y, m, d] = perth.ymd.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, hour - PERTH_OFFSET_HOURS, 0, 0)).toISOString()
}

export default function NewSignalClient({ pubs }: NewSignalClientProps) {
  const router = useRouter()

  const [query, setQuery] = useState('')
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [timeKey, setTimeKey] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Perth clock for disabling past chips — set after mount so server and
  // client render the same initial HTML.
  const [perthMinutes, setPerthMinutes] = useState<number | null>(null)
  useEffect(() => {
    const tick = () => setPerthMinutes(perthNow(new Date()).minutesOfDay)
    tick()
    const interval = setInterval(tick, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const remembered = window.localStorage.getItem('pps-signal-name')
    if (remembered) setName(remembered)
  }, [])

  const shownPubs = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list: SlimPub[]
    if (q === '') {
      // Top suggestions: cheapest priced pubs, live happy hours first.
      list = pubs
        .filter(p => p.price != null)
        .sort((a, b) => {
          if (a.isHappyHourNow !== b.isHappyHourNow) return a.isHappyHourNow ? -1 : 1
          return (a.price ?? Number.MAX_VALUE) - (b.price ?? Number.MAX_VALUE)
        })
        .slice(0, 5)
    } else {
      list = pubs
        .filter(p =>
          p.name.toLowerCase().includes(q) || (p.suburb || '').toLowerCase().includes(q),
        )
        .sort((a, b) => (a.price ?? Number.MAX_VALUE) - (b.price ?? Number.MAX_VALUE))
        .slice(0, 12)
    }
    // Keep the chosen pub visible even when the filter no longer matches it.
    if (selectedSlug && !list.some(p => p.slug === selectedSlug)) {
      const selected = pubs.find(p => p.slug === selectedSlug)
      if (selected) list = [selected, ...list]
    }
    return list
  }, [pubs, query, selectedSlug])

  const chipDisabled = (chip: TimeChip): boolean => {
    if (chip.hour === null) return false
    if (perthMinutes === null) return false
    return perthMinutes >= chip.hour * 60
  }

  const canSubmit = selectedSlug !== null && timeKey !== null && name.trim().length >= 1 && !submitting

  const handleSubmit = async () => {
    if (!canSubmit || !selectedSlug || !timeKey) return
    setSubmitting(true)
    setError(null)

    const chip = TIME_CHIPS.find(c => c.key === timeKey)
    const meetAt = chip && chip.hour !== null ? perthHourTodayIso(chip.hour) : new Date().toISOString()

    try {
      const res = await fetch('/api/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pubSlug: selectedSlug, litBy: name.trim(), meetAt }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.id) {
        setError(data?.error || 'Could not light the signal. Try again.')
        setSubmitting(false)
        return
      }

      try {
        window.localStorage.setItem('pps-signal-name', name.trim())
        // The lighter is auto-answered IN — remember that on this device too.
        window.localStorage.setItem(
          `pps-signal-answer-${data.id}`,
          JSON.stringify({ answer: 'in', name: name.trim(), note: 'lit the signal' }),
        )
      } catch {
        // Private browsing — carry on.
      }

      const url = `${window.location.origin}/signal/${data.id}`
      if (typeof navigator.share === 'function') {
        try {
          await navigator.share({ title: 'Pint Signal', text: 'The signal is up. Answer it before it burns out.', url })
        } catch {
          // Share sheet dismissed or blocked — the answer page has its own share link.
        }
      }
      router.push(`/signal/${data.id}`)
    } catch {
      setError('Could not light the signal. Try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SubPageNav breadcrumbs={[{ label: 'Pint Signal' }]} badge="Beta" showSubmit={false} />

      <main className="max-w-container mx-auto px-6 w-full flex-1">
        <h1 className="type-hero mt-6">
          Light the <em className="font-display italic font-normal text-amber tracking-normal">signal</em>
        </h1>
        <p className="font-body text-sm text-gray-mid mt-2 max-w-[440px] leading-relaxed">
          Pick the pub, pick the time, send the link. The crew answers before it burns out — signals last three hours past the meet time.
        </p>

        {/* ── Pub picker ── */}
        <section className="mt-8">
          <div className="flex justify-between items-baseline pb-2.5 border-b-3 border-ink">
            <span className="type-eyebrow text-ink">Where</span>
            {query.trim() === '' && <span className="type-eyebrow">Cheapest first</span>}
          </div>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pub or suburb"
            aria-label="Search pub or suburb"
            className="w-full mt-4 font-mono text-sm font-bold text-ink bg-white border-3 border-ink rounded-pill px-5 py-3 shadow-hard-sm focus:outline-none focus:ring-2 focus:ring-amber placeholder:text-gray-mid placeholder:font-normal"
          />
          <div className="mt-2">
            {shownPubs.length === 0 ? (
              <p className="font-body text-sm text-gray-mid py-4">No pubs match that. Try the suburb name.</p>
            ) : (
              shownPubs.map(pub => {
                const selected = pub.slug === selectedSlug
                return (
                  <button
                    key={pub.slug}
                    type="button"
                    onClick={() => setSelectedSlug(pub.slug)}
                    aria-pressed={selected}
                    className="w-full flex items-center gap-3 py-3.5 px-0.5 border-b border-gray-light text-left hover:bg-off-white transition-colors"
                  >
                    <span
                      className={`w-5 h-5 rounded-full border-2 border-ink flex-shrink-0 flex items-center justify-center ${selected ? 'bg-amber' : 'bg-white'}`}
                      aria-hidden="true"
                    >
                      {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="font-body font-bold text-[1.02rem] text-ink truncate">{pub.name}</span>
                        {pub.isHappyHourNow && (
                          <span className="font-mono text-[0.52rem] font-extrabold uppercase tracking-[0.05em] bg-amber text-white rounded-pill px-2 py-0.5 whitespace-nowrap flex-shrink-0">HH now</span>
                        )}
                      </span>
                      <span className="block font-body text-xs text-gray-mid mt-0.5">{pub.suburb}</span>
                    </span>
                    <span className="ml-auto font-mono font-extrabold text-[1.1rem] text-ink flex-shrink-0">
                      {pub.price != null ? `$${pub.price.toFixed(2)}` : 'TBC'}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </section>

        {/* ── Time chips ── */}
        <section className="mt-8">
          <div className="pb-2.5 border-b-3 border-ink">
            <span className="type-eyebrow text-ink">When</span>
          </div>
          <div className="flex flex-wrap gap-2.5 mt-4">
            {TIME_CHIPS.map(chip => {
              const disabled = chipDisabled(chip)
              const selected = timeKey === chip.key
              return (
                <button
                  key={chip.key}
                  type="button"
                  disabled={disabled}
                  onClick={() => setTimeKey(chip.key)}
                  aria-pressed={selected}
                  className={`font-mono text-[0.72rem] font-extrabold uppercase tracking-[0.05em] border-3 border-ink rounded-pill px-5 py-2.5 transition-all whitespace-nowrap ${
                    disabled
                      ? 'opacity-30 bg-white text-gray-mid cursor-not-allowed'
                      : selected
                        ? 'bg-ink text-white shadow-hard-sm'
                        : 'bg-white text-ink shadow-hard-sm hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover'
                  }`}
                >
                  {chip.label}
                </button>
              )
            })}
          </div>
        </section>

        {/* ── Name ── */}
        <section className="mt-8">
          <div className="pb-2.5 border-b-3 border-ink">
            <span className="type-eyebrow text-ink">Who&apos;s lighting it</span>
          </div>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={30}
            placeholder="Your name"
            aria-label="Your name"
            className="w-full sm:max-w-[320px] mt-4 font-mono text-sm font-bold text-ink bg-white border-3 border-ink rounded-card px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber placeholder:text-gray-mid placeholder:font-normal"
          />
        </section>

        {error && (
          <div className="mt-6 border-3 border-ink rounded-card bg-red-pale shadow-hard-sm p-4">
            <p className="type-eyebrow text-red">Signal not lit</p>
            <p className="font-body text-sm text-ink mt-1.5">{error}</p>
          </div>
        )}

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!canSubmit}
          className={`w-full mt-8 font-mono font-extrabold text-sm uppercase tracking-[0.1em] border-3 border-ink rounded-pill py-4 transition-all whitespace-nowrap ${
            canSubmit
              ? 'bg-amber text-white shadow-hard-sm hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover'
              : 'bg-amber/40 text-white/80 cursor-not-allowed shadow-hard-sm'
          }`}
        >
          {submitting ? 'Lighting…' : 'Light the signal'}
        </button>
        <p className="font-body text-xs text-gray-mid text-center mt-3">
          You&apos;re automatically in. Next stop: the group chat.
        </p>
      </main>

      <div className="mt-11">
        <Footer />
      </div>
    </div>
  )
}
