'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import SubPageNav from '@/components/SubPageNav'
import Footer from '@/components/Footer'
import {
  formatTimeLeft,
  SIGNAL_TTL_MS,
  type SignalAnswer,
  type SignalAnswerValue,
} from '@/lib/signals'

export interface SignalView {
  id: string
  pubName: string
  pubShortName: string
  suburb: string | null
  crewName: string | null
  litBy: string
  meetLabel: string
  meetAt: string
  expiresAt: string
  priceLine: string | null
  hhLine: string | null
}

interface SignalClientProps {
  view: SignalView | null
  initialAnswers: SignalAnswer[]
  state: 'live' | 'expired' | 'missing'
}

// Deterministic avatar colors from the site palette.
const AVATAR_COLORS = ['#D4740A', '#2D7A3D', '#C43D2E', '#3B82F6', '#7C3AED', '#171717']

function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

interface StoredAnswer {
  answer: SignalAnswerValue
  name: string
  note: string
}

function readStoredAnswer(id: string): StoredAnswer | null {
  try {
    const raw = window.localStorage.getItem(`pps-signal-answer-${id}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredAnswer
    if (parsed && (parsed.answer === 'in' || parsed.answer === 'out')) return parsed
    return null
  } catch {
    return null
  }
}

function PintGlyph({ size = 46 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 3h8l-1 9.5a3 3 0 0 1-3 2.5 3 3 0 0 1-3-2.5L8 3Z" stroke="#F2A91A" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M16 5h2.2a1.8 1.8 0 0 1 0 3.6H15.6" stroke="#F2A91A" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 15v4M9.5 19h5" stroke="#F2A91A" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 6.5c.8.7 2.2.7 3 0 .8-.7 2.2-.7 3 0" stroke="#F2A91A" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

// Beam sway/flicker + glyph glow ported from the prototype. Class names are
// prefixed so this stays self-contained to the signal card.
const SIGNAL_CARD_CSS = `
@keyframes pps-signal-sway {
  from { transform: translateX(-50%) rotate(7deg); }
  to { transform: translateX(-50%) rotate(-7deg); }
}
@keyframes pps-signal-flicker {
  0%, 100% { opacity: 1; }
  48% { opacity: .84; }
  52% { opacity: .96; }
  71% { opacity: .8; }
  74% { opacity: 1; }
}
@keyframes pps-signal-glow {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.3); }
}
@keyframes pps-signal-landed {
  to { opacity: 1; transform: none; }
}
.pps-signal-beam {
  position: absolute; bottom: -20%; left: 50%; width: 300px; height: 150%;
  transform-origin: 50% 100%; transform: translateX(-50%) rotate(8deg);
  background: linear-gradient(to top, rgba(242,169,26,.32), rgba(242,169,26,.1) 55%, transparent);
  clip-path: polygon(43% 100%, 57% 100%, 100% 0, 0 0);
  animation: pps-signal-sway 8s ease-in-out infinite alternate, pps-signal-flicker 4.2s steps(12) infinite;
}
.pps-signal-glyph {
  animation: pps-signal-glow 4.2s ease-in-out infinite;
}
.pps-signal-glyph svg {
  filter: drop-shadow(0 0 18px rgba(242,169,26,.8));
}
.pps-signal-row {
  opacity: 0; transform: translateY(7px);
  animation: pps-signal-landed .35s ease-out forwards;
}
`

function BurnedOutCard({ view, state }: { view: SignalView | null; state: 'expired' | 'missing' }) {
  return (
    <div className="border-3 border-ink rounded-card bg-white shadow-hard-sm px-6 py-10 mt-4 text-center">
      <div className="w-16 h-16 mx-auto rounded-full bg-off-white border-2 border-gray-light flex items-center justify-center opacity-60">
        <PintGlyph size={32} />
      </div>
      <h1 className="font-mono font-extrabold text-ink text-2xl tracking-[-0.03em] mt-5">
        {state === 'expired' ? 'This signal burned out' : 'No signal here'}
      </h1>
      <p className="font-body text-sm text-gray-mid mt-3 max-w-[380px] mx-auto leading-relaxed">
        {state === 'expired' ? (
          view
            ? `${view.pubName} at ${view.meetLabel} — that round is done. Signals only last three hours past the meet time.`
            : 'That round is done. Signals only last three hours past the meet time.'
        ) : (
          'That link does not point at a live signal. It may have burned out and been cleared.'
        )}
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-7">
        <Link
          href="/signal/new"
          className="inline-flex items-center justify-center font-mono text-[0.72rem] font-extrabold uppercase tracking-[0.05em] bg-amber text-white border-3 border-ink rounded-pill px-6 py-3 shadow-hard-sm hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover transition-all no-underline whitespace-nowrap"
        >
          Light a new one
        </Link>
        <Link
          href="/"
          className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.05em] text-gray-mid underline underline-offset-4 hover:text-amber transition-colors"
        >
          Back to the prices
        </Link>
      </div>
    </div>
  )
}

export default function SignalClient({ view, initialAnswers, state }: SignalClientProps) {
  const [answers, setAnswers] = useState<SignalAnswer[]>(initialAnswers)
  const [burnedOut, setBurnedOut] = useState(state === 'expired')
  const [nowMs, setNowMs] = useState<number | null>(null)

  const [myAnswer, setMyAnswer] = useState<StoredAnswer | null>(null)
  const [pending, setPending] = useState<SignalAnswerValue | null>(null)
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [answerError, setAnswerError] = useState<string | null>(null)

  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const signalId = view?.id ?? null
  const expiresAtMs = view ? new Date(view.expiresAt).getTime() : 0

  // Restore my own answer + remembered name.
  useEffect(() => {
    if (!signalId) return
    const stored = readStoredAnswer(signalId)
    if (stored) setMyAnswer(stored)
    const rememberedName = window.localStorage.getItem('pps-signal-name')
    if (rememberedName) setName(rememberedName)
  }, [signalId])

  // Tick the burn bar every second.
  useEffect(() => {
    if (state !== 'live') return
    setNowMs(Date.now())
    const interval = setInterval(() => setNowMs(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [state])

  useEffect(() => {
    if (state === 'live' && nowMs !== null && nowMs >= expiresAtMs) {
      setBurnedOut(true)
    }
  }, [state, nowMs, expiresAtMs])

  // Poll for fresh answers every 30s.
  useEffect(() => {
    if (state !== 'live' || !signalId) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/signal/${signalId}`, { cache: 'no-store' })
        if (res.status === 404 || res.status === 410) {
          setBurnedOut(true)
          return
        }
        if (!res.ok) return
        const data = await res.json()
        if (Array.isArray(data.answers)) setAnswers(data.answers)
        if (data.expired === true) setBurnedOut(true)
      } catch {
        // Network blip — next poll will catch up.
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [state, signalId])

  const showToast = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }, [])

  const handleShare = useCallback(async () => {
    if (!view) return
    const url = window.location.href
    const shareData = {
      title: `Pint Signal — ${view.pubName} ${view.meetLabel}`,
      text: `${view.litBy} lit the signal: ${view.pubName}, ${view.meetLabel}. Answer it before it burns out.`,
      url,
    }
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData)
        return
      } catch {
        // Cancelled or unsupported payload — fall through to clipboard.
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      showToast('Link copied — paste it in the chat')
    } catch {
      showToast('Could not copy the link')
    }
  }, [view, showToast])

  const refreshAnswers = useCallback(async () => {
    if (!signalId) return
    try {
      const res = await fetch(`/api/signal/${signalId}`, { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data.answers)) setAnswers(data.answers)
    } catch {
      // Leave the optimistic list in place.
    }
  }, [signalId])

  const submitAnswer = useCallback(async () => {
    if (!signalId || !pending || submitting) return
    const trimmedName = name.trim()
    if (trimmedName.length < 1) {
      setAnswerError('Add your name so the crew knows who answered.')
      return
    }
    setSubmitting(true)
    setAnswerError(null)
    try {
      const res = await fetch(`/api/signal/${signalId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, answer: pending, note: note.trim() || undefined }),
      })
      if (res.status === 410) {
        setBurnedOut(true)
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setAnswerError(data?.error || 'Could not save your answer. Try again.')
        return
      }
      const stored: StoredAnswer = { answer: pending, name: trimmedName, note: note.trim() }
      setMyAnswer(stored)
      setPending(null)
      try {
        window.localStorage.setItem(`pps-signal-answer-${signalId}`, JSON.stringify(stored))
        window.localStorage.setItem('pps-signal-name', trimmedName)
      } catch {
        // Private browsing — the answer still landed server-side.
      }
      // Optimistic row while the canonical list refreshes.
      setAnswers(prev => [
        ...prev.filter(a => a.name !== trimmedName),
        {
          id: `local-${Date.now()}`,
          signal_id: signalId,
          name: trimmedName,
          answer: pending,
          note: note.trim() || null,
          created_at: new Date().toISOString(),
        },
      ])
      void refreshAnswers()
    } catch {
      setAnswerError('Could not save your answer. Try again.')
    } finally {
      setSubmitting(false)
    }
  }, [signalId, pending, submitting, name, note, refreshAnswers])

  // ── Burned out / missing states ───────────────────────────────────────────
  if (!view || burnedOut || state !== 'live') {
    return (
      <div className="min-h-screen flex flex-col">
        <SubPageNav breadcrumbs={[{ label: 'Pint Signal' }]} badge="Beta" showSubmit={false} />
        <main className="max-w-container mx-auto px-6 w-full flex-1">
          <BurnedOutCard view={view} state={!view || state === 'missing' ? 'missing' : 'expired'} />
        </main>
        <div className="mt-11">
          <Footer />
        </div>
      </div>
    )
  }

  // ── Live state ────────────────────────────────────────────────────────────
  const remainingMs = nowMs === null ? SIGNAL_TTL_MS : Math.max(0, expiresAtMs - nowMs)
  const burnPercent = Math.max(0, Math.min(100, (remainingMs / SIGNAL_TTL_MS) * 100))
  const inCount = answers.filter(a => a.answer === 'in').length
  const answeredLine = `${answers.length} answered · ${inCount} in`

  return (
    <div className="min-h-screen flex flex-col">
      <style>{SIGNAL_CARD_CSS}</style>
      <SubPageNav breadcrumbs={[{ label: 'Pint Signal' }]} badge="Beta" showSubmit={false} />

      <main className="max-w-container mx-auto px-6 w-full flex-1">
        {/* The dark signal card */}
        <div className="relative mt-4 border-3 border-ink rounded-card bg-[#100F0C] text-[#FDF8F0] overflow-hidden shadow-hard-sm">
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(130% 120% at 50% 130%, #2c2216 0%, #18130d 48%, #100F0C 100%)' }}
          />
          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage: [
                'radial-gradient(1px 1px at 12% 30%, #fff8 0, transparent 100%)',
                'radial-gradient(1px 1px at 80% 18%, #fff6 0, transparent 100%)',
                'radial-gradient(1.5px 1.5px at 60% 12%, #fff7 0, transparent 100%)',
                'radial-gradient(1px 1px at 30% 14%, #fff5 0, transparent 100%)',
                'radial-gradient(1px 1px at 92% 44%, #fff5 0, transparent 100%)',
              ].join(', '),
            }}
          />
          <div className="pps-signal-beam" />

          <div className="relative px-6 pt-8 pb-7 text-center">
            <div
              className="pps-signal-glyph w-[92px] h-[92px] mx-auto rounded-full flex items-center justify-center"
              style={{ background: 'radial-gradient(circle, rgba(242,169,26,.28) 0%, transparent 70%)' }}
            >
              <PintGlyph />
            </div>
            <p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.26em] text-amber-light mt-1.5">
              The signal is up{view.crewName ? ` · ${view.crewName}` : ''}
            </p>
            <h1 className="font-mono font-extrabold tracking-[-0.05em] leading-[1.05] mt-2 text-[clamp(1.75rem,6vw,2.4rem)]">
              {view.pubShortName}.{' '}
              <em className="font-display italic font-normal text-amber-light tracking-normal">{view.meetLabel}.</em>
            </h1>
            <p className="font-body text-[0.82rem] text-[#FDF8F0]/60 mt-2">
              Lit by <b className="text-[#FDF8F0] font-bold">{view.litBy}</b>
              {view.priceLine ? <> · {view.priceLine}</> : null}
              {view.hhLine ? <>, <b className="text-[#FDF8F0] font-bold">{view.hhLine}</b></> : null}
            </p>
          </div>

          {/* Burn bar — fused to the card's bottom edge */}
          <div className="relative border-t-3 border-ink bg-amber-pale text-ink px-4 sm:px-5 pt-2.5 pb-3">
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="font-mono text-[0.56rem] font-bold uppercase tracking-[0.1em] text-gray-mid">The glass is draining</span>
              <span className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.1em] text-amber">
                {nowMs === null ? '—' : formatTimeLeft(remainingMs)}
              </span>
            </div>
            <div className="h-3 border-[2.5px] border-ink rounded-pill bg-white overflow-hidden">
              <div
                className="h-full transition-[width] duration-1000 ease-linear"
                style={{ width: `${burnPercent}%`, background: 'linear-gradient(90deg, #D4740A, #F2A91A)' }}
              />
            </div>
          </div>
        </div>

        {/* Answer buttons */}
        <div className="flex gap-2.5 mt-5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              if (myAnswer) return
              setPending('in')
              setAnswerError(null)
            }}
            disabled={myAnswer !== null || submitting}
            className={`flex-[2_1_200px] font-mono font-extrabold text-sm uppercase tracking-[0.1em] border-3 border-ink rounded-pill py-4 shadow-hard-sm transition-all whitespace-nowrap ${
              myAnswer?.answer === 'in'
                ? 'bg-ink text-white cursor-default'
                : myAnswer
                  ? 'bg-green/40 text-white/80 cursor-default'
                  : 'bg-green text-white hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover'
            }`}
          >
            {myAnswer?.answer === 'in' ? `Locked in — see you at ${view.meetLabel}` : 'I’m in'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (myAnswer) return
              setPending('out')
              setAnswerError(null)
            }}
            disabled={myAnswer !== null || submitting}
            className={`flex-[1_1_130px] font-mono font-extrabold text-[0.72rem] uppercase tracking-[0.05em] border-3 border-ink rounded-pill py-4 px-5 shadow-hard-sm transition-all whitespace-nowrap ${
              myAnswer?.answer === 'out'
                ? 'bg-ink text-white cursor-default'
                : myAnswer
                  ? 'bg-white text-gray-mid cursor-default'
                  : 'bg-white text-ink hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover'
            }`}
          >
            {myAnswer?.answer === 'out' ? 'Noted — next time' : 'Can’t tonight'}
          </button>
        </div>

        {/* Inline name + note composer after choosing */}
        {pending && !myAnswer && (
          <div className="mt-4 border-3 border-ink rounded-card bg-white shadow-hard-sm p-4">
            <p className="type-eyebrow mb-3">
              {pending === 'in' ? 'Locking you in' : 'Fair enough'}
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') void submitAnswer() }}
                maxLength={30}
                placeholder="Your name"
                aria-label="Your name"
                className="flex-1 font-mono text-sm font-bold text-ink bg-off-white border-2 border-ink rounded-card px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber"
              />
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') void submitAnswer() }}
                maxLength={60}
                placeholder={pending === 'in' ? 'Add a note — optional' : 'Reason — optional'}
                aria-label="Note"
                className="flex-[1.4] font-body text-sm text-ink bg-off-white border-2 border-ink rounded-card px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber"
              />
              <button
                type="button"
                onClick={() => void submitAnswer()}
                disabled={submitting}
                className={`font-mono text-[0.68rem] font-extrabold uppercase tracking-[0.05em] border-3 border-ink rounded-pill px-5 py-2.5 shadow-hard-sm transition-all whitespace-nowrap ${
                  pending === 'in' ? 'bg-green text-white' : 'bg-white text-ink'
                } ${submitting ? 'opacity-60' : 'hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover'}`}
              >
                {submitting ? 'Sending…' : pending === 'in' ? 'Lock it in' : 'Send it'}
              </button>
            </div>
            {answerError && (
              <p className="font-mono text-[0.68rem] font-bold text-red mt-2.5">{answerError}</p>
            )}
          </div>
        )}

        {/* Share link */}
        <div className="flex justify-center mt-4">
          <button
            type="button"
            onClick={() => void handleShare()}
            className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.05em] text-gray-mid underline underline-offset-4 hover:text-amber transition-colors"
          >
            Share to the group chat
          </button>
        </div>

        {/* Who's answered */}
        <section className="mt-10">
          <div className="flex justify-between items-baseline pb-2.5 border-b-3 border-ink">
            <span className="type-eyebrow text-ink">Who&apos;s answered</span>
            <span className="type-eyebrow">{answeredLine}</span>
          </div>
          {answers.length === 0 ? (
            <p className="font-body text-sm text-gray-mid py-4">No answers yet. Send the link.</p>
          ) : (
            <div>
              {answers.map(a => (
                <div key={a.id} className="pps-signal-row flex items-center gap-3 py-3 border-b border-gray-light">
                  <div
                    className="w-[30px] h-[30px] rounded-full border-[2.5px] border-ink flex items-center justify-center font-mono text-[0.62rem] font-extrabold text-white flex-shrink-0"
                    style={{ backgroundColor: avatarColor(a.name) }}
                  >
                    {initialsFor(a.name)}
                  </div>
                  <span className="font-mono font-extrabold text-[0.84rem] text-ink flex-shrink-0">{a.name}</span>
                  {a.note && <span className="font-body text-[0.72rem] text-gray-mid truncate min-w-0">{a.note}</span>}
                  <span
                    className={`ml-auto font-mono text-[0.56rem] font-extrabold uppercase tracking-[0.06em] rounded-pill px-2.5 py-1 whitespace-nowrap flex-shrink-0 ${
                      a.answer === 'in'
                        ? 'bg-green text-white'
                        : 'bg-off-white text-gray-mid border border-gray-light'
                    }`}
                  >
                    {a.answer === 'in' ? 'IN' : 'OUT'}
                  </span>
                </div>
              ))}
            </div>
          )}
          {inCount >= 4 && (
            <p className="font-mono text-[0.7rem] font-extrabold text-green text-center pt-4">
              That&apos;s a table. See you down there.
            </p>
          )}
        </section>
      </main>

      {/* Toast */}
      <div
        aria-live="polite"
        className={`fixed left-1/2 bottom-6 -translate-x-1/2 bg-ink text-white font-mono text-[0.7rem] font-bold rounded-pill px-5 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.35)] z-50 transition-all duration-300 whitespace-nowrap ${
          toast ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
        }`}
      >
        {toast}
      </div>

      <div className="mt-11">
        <Footer />
      </div>
    </div>
  )
}
