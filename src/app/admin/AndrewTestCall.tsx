'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowUpRight,
  AudioWaveform,
  Check,
  Clock3,
  Database,
  FileCheck2,
  Loader2,
  PhoneCall,
  ShieldCheck,
} from 'lucide-react'

type Availability = {
  state: 'ready' | 'active' | 'cooldown'
  retryAfterSeconds: number
  conversationId?: string | null
}

type ConversationStatus = 'initiated' | 'in-progress' | 'processing' | 'done' | 'failed'

interface TestCallState {
  destination?: { masked: string }
  availability?: Availability
  conversation?: {
    id: string
    status: ConversationStatus
    terminal: boolean
  }
  transcript?: Array<{ role: 'Andrew' | 'Owner'; message: string }>
  proposedListing?: {
    price: number | null
    beerType: string | null
    happyHour: string | null
    confidence: string | null
  }
}

const STATUS_STEPS = [
  { id: 'ready', label: 'Ready' },
  { id: 'initiated', label: 'Dialling' },
  { id: 'in-progress', label: 'In call' },
  { id: 'processing', label: 'Processing' },
  { id: 'done', label: 'Captured' },
] as const

function statusIndex(status: string) {
  if (status === 'failed') return 1
  const index = STATUS_STEPS.findIndex(step => step.id === status)
  return index === -1 ? 0 : index
}

function cooldownLabel(seconds: number) {
  const minutes = Math.max(1, Math.ceil(seconds / 60))
  return `${minutes} min cooldown`
}

function formatProposedPrice(price: number | null | undefined) {
  if (price == null) return '$—'
  return Number.isInteger(price) ? `$${price}` : `$${price.toFixed(2)}`
}

export default function AndrewTestCall({ password }: { password: string }) {
  const [state, setState] = useState<TestCallState | null>(null)
  const [consented, setConsented] = useState(false)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const request = useCallback(async (url: string, init?: RequestInit) => {
    const response = await fetch(url, {
      ...init,
      headers: {
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        Authorization: `Bearer ${password}`,
        ...(init?.headers || {}),
      },
      cache: 'no-store',
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body.error || 'The test call could not be loaded.')
    return body as TestCallState
  }, [password])

  const loadReadiness = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const readiness = await request('/api/admin/andrew/test-call')
      setState(readiness)
      const activeConversation = readiness.availability?.state === 'active'
        ? readiness.availability.conversationId
        : null
      if (activeConversation) {
        const active = await request(`/api/admin/andrew/test-call?conversation_id=${encodeURIComponent(activeConversation)}`)
        setState(active)
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'The test call could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [request])

  useEffect(() => {
    void loadReadiness()
  }, [loadReadiness])

  const conversationId = state?.conversation?.id
  const isTerminal = state?.conversation?.terminal === true

  useEffect(() => {
    if (!conversationId || isTerminal) return
    const poll = window.setInterval(async () => {
      try {
        const update = await request(`/api/admin/andrew/test-call?conversation_id=${encodeURIComponent(conversationId)}`)
        setState(update)
      } catch (pollError) {
        setError(pollError instanceof Error ? pollError.message : 'Call status could not be refreshed.')
      }
    }, 2500)
    return () => window.clearInterval(poll)
  }, [conversationId, isTerminal, request])

  const startCall = async () => {
    if (!consented || starting) return
    setStarting(true)
    setError(null)
    try {
      const started = await request('/api/admin/andrew/test-call', {
        method: 'POST',
        body: JSON.stringify({ consent: true }),
      })
      setState(started)
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : 'The test call could not be started.')
    } finally {
      setStarting(false)
    }
  }

  const callStatus = state?.conversation?.status || 'ready'
  const activeStep = statusIndex(callStatus)
  const availability = state?.availability
  const isReady = availability?.state === 'ready' || !!state?.conversation
  const canCall = consented && isReady && !starting && !conversationId
  const statusCopy = useMemo(() => {
    if (loading) return 'Checking the owner test line'
    if (callStatus === 'failed') return 'The call did not complete'
    if (callStatus === 'done') return 'Capture ready for review'
    if (callStatus === 'processing') return 'Turning the call into structured fields'
    if (callStatus === 'in-progress') return 'Andrew is speaking with you now'
    if (callStatus === 'initiated') return 'Your phone should ring shortly'
    if (availability?.state === 'active') return 'An owner test call is already active'
    if (availability?.state === 'cooldown') return cooldownLabel(availability.retryAfterSeconds)
    return 'Ready for one owner test call'
  }, [availability, callStatus, loading])

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-card border-3 border-ink bg-white shadow-hard-sm">
        <div className="grid md:grid-cols-[1.15fr_0.85fr]">
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-card border-3 border-ink bg-amber text-white shadow-hard-sm">
                  <AudioWaveform size={19} strokeWidth={3} />
                </span>
                <div>
                  <p className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.1em] text-amber">Andrew sandbox</p>
                  <h2 className="font-display text-[1.85rem] font-normal leading-none text-ink">Call the owner test line</h2>
                </div>
              </div>
              <Link
                href="/ai-price-demo"
                target="_blank"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-pill border-2 border-ink px-3 py-2 font-mono text-[0.62rem] font-bold uppercase tracking-[0.05em] text-ink transition-colors hover:bg-amber-pale"
              >
                Presentation view <ArrowUpRight size={13} />
              </Link>
            </div>

            <p className="mt-5 max-w-xl text-[0.82rem] leading-relaxed text-ink/70">
              This rings only the server-configured owner number. Andrew can capture a test price, beer and happy hour, but the reserved test venue cannot write to a live listing.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-card border-2 border-ink bg-off-white p-3">
                <PhoneCall size={16} className="text-amber" />
                <p className="mt-2 font-mono text-[0.55rem] font-bold uppercase tracking-[0.08em] text-gray-mid">Destination</p>
                <p className="mt-1 font-mono text-[0.72rem] font-extrabold text-ink" data-testid="masked-destination">
                  {state?.destination?.masked || 'Masked by server'}
                </p>
              </div>
              <div className="rounded-card border-2 border-ink bg-off-white p-3">
                <ShieldCheck size={16} className="text-green" />
                <p className="mt-2 font-mono text-[0.55rem] font-bold uppercase tracking-[0.08em] text-gray-mid">Write guard</p>
                <p className="mt-1 font-mono text-[0.72rem] font-extrabold text-ink">No live price writes</p>
              </div>
              <div className="rounded-card border-2 border-ink bg-off-white p-3">
                <Database size={16} className="text-amber" />
                <p className="mt-2 font-mono text-[0.55rem] font-bold uppercase tracking-[0.08em] text-gray-mid">Call record</p>
                <p className="mt-1 font-mono text-[0.72rem] font-extrabold text-ink">Validated fields only</p>
              </div>
            </div>
          </div>

          <div className="border-t-3 border-ink bg-ink p-5 text-white md:border-l-3 md:border-t-0 sm:p-7">
            <p className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.1em] text-white/45">Owner consent</p>
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-card border border-white/20 bg-white/[0.06] p-4">
              <input
                type="checkbox"
                checked={consented}
                onChange={event => setConsented(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-amber"
              />
              <span className="text-[0.78rem] leading-relaxed text-white/75">
                I consent to receive this AI-generated call. The provider transcribes it, but this preview withholds the raw conversation and keeps only validated fields.
              </span>
            </label>

            <button
              type="button"
              onClick={startCall}
              disabled={!canCall}
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-pill border-3 border-ink bg-amber px-5 py-3 font-mono text-[0.72rem] font-extrabold uppercase tracking-[0.06em] text-white shadow-hard-sm transition-transform hover:translate-x-[1px] hover:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {starting ? <Loader2 size={16} className="animate-spin" /> : <PhoneCall size={16} />}
              {starting ? 'Starting call' : 'Call my test line'}
            </button>
            <div className="mt-4 flex items-center gap-2 text-amber-light">
              <span className={`h-2 w-2 rounded-full bg-amber-light ${conversationId && !isTerminal ? 'animate-pulse' : ''}`} />
              <p className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.06em]" aria-live="polite">{statusCopy}</p>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-2 rounded-card border-2 border-red bg-red-pale px-4 py-3 font-mono text-[0.68rem] font-bold text-red">
          <AlertTriangle size={15} className="mt-0.5 flex-none" />
          <span>{error}</span>
        </div>
      )}

      <section className="rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.1em] text-gray-mid">Call status</p>
            <h3 className="mt-1 font-mono text-[0.82rem] font-extrabold uppercase tracking-[0.02em] text-ink">{statusCopy}</h3>
          </div>
          {loading ? <Loader2 size={19} className="animate-spin text-amber" /> : <Clock3 size={19} className="text-gray-mid" />}
        </div>

        <div className="mt-5 grid grid-cols-5 gap-1.5 sm:gap-3" data-testid="call-status-flow">
          {STATUS_STEPS.map((step, index) => {
            const reached = activeStep >= index && callStatus !== 'failed'
            return (
              <div key={step.id} className="min-w-0">
                <div className={`h-1.5 rounded-pill ${reached ? 'bg-amber' : 'bg-gray'}`} />
                <p className={`mt-2 truncate font-mono text-[0.5rem] font-bold uppercase tracking-[0.04em] sm:text-[0.58rem] ${reached ? 'text-ink' : 'text-gray-mid'}`}>
                  {step.label}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="overflow-hidden rounded-card border-3 border-ink bg-ink text-white shadow-hard-sm">
          <div className="flex items-center justify-between border-b border-white/15 px-5 py-4">
            <div className="flex items-center gap-2">
              <AudioWaveform size={16} className="text-amber-light" />
              <h3 className="font-mono text-[0.68rem] font-extrabold uppercase tracking-[0.07em]">Private call events</h3>
            </div>
            <span className="font-mono text-[0.55rem] uppercase tracking-[0.06em] text-white/40">Raw text withheld</span>
          </div>
          <div className="min-h-64 space-y-4 p-5" data-testid="andrew-transcript">
            {state?.transcript?.length ? state.transcript.map((line, index) => (
              <div key={`${line.role}-${index}`} className="grid grid-cols-[58px_1fr] gap-3">
                <span className={`font-mono text-[0.56rem] font-bold uppercase tracking-[0.06em] ${line.role === 'Andrew' ? 'text-amber-light' : 'text-white/40'}`}>{line.role}</span>
                <p className="text-[0.78rem] leading-relaxed text-white/75">{line.message}</p>
              </div>
            )) : (
              <div className="grid min-h-52 place-items-center text-center">
                <div>
                  <AudioWaveform size={24} className="mx-auto text-white/20" />
                  <p className="mt-3 font-mono text-[0.62rem] font-bold uppercase tracking-[0.06em] text-white/35">Call events appear after the call</p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-card border-3 border-ink bg-off-white p-5 shadow-hard-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.1em] text-gray-mid">Proposed listing</p>
              <h3 className="mt-1 font-display text-[1.65rem] font-normal leading-none text-ink">Owner test venue</h3>
            </div>
            <span className="rounded-pill border-2 border-ink bg-white px-2.5 py-1 font-mono text-[0.52rem] font-bold uppercase tracking-[0.06em] text-gray-mid">Not published</span>
          </div>

          <div className="mt-6 rounded-card border-3 border-ink bg-white p-5">
            <p className="font-mono text-[0.55rem] font-bold uppercase tracking-[0.08em] text-gray-mid">Cheapest pint</p>
            <p className="mt-2 font-mono text-[2.8rem] font-extrabold leading-none tracking-[-0.06em] text-amber" data-testid="proposed-price">
              {formatProposedPrice(state?.proposedListing?.price)}
            </p>

            <div className="mt-5 space-y-3 border-t-3 border-ink pt-4">
              {[
                ['Beer', state?.proposedListing?.beerType || 'Awaiting capture'],
                ['Happy hour', state?.proposedListing?.happyHour || 'Awaiting capture'],
                ['Confidence', state?.proposedListing?.confidence || 'Awaiting capture'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4">
                  <span className="font-mono text-[0.56rem] font-bold uppercase tracking-[0.06em] text-gray-mid">{label}</span>
                  <span className="text-right font-mono text-[0.66rem] font-bold text-ink">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-card border-2 border-green bg-green-pale p-3 text-green">
            <FileCheck2 size={17} className="mt-0.5 flex-none" />
            <div>
              <p className="font-mono text-[0.6rem] font-extrabold uppercase tracking-[0.05em]">Preview only</p>
              <p className="mt-1 text-[0.7rem] leading-relaxed opacity-75">The reserved test slug returns these fields without reading or updating the pubs table.</p>
            </div>
          </div>
        </section>
      </div>

      {state?.conversation?.terminal && (
        <button
          type="button"
          onClick={() => {
            setConsented(false)
            void loadReadiness()
          }}
          className="inline-flex min-h-11 items-center gap-2 rounded-pill border-3 border-ink bg-white px-4 py-2 font-mono text-[0.65rem] font-bold uppercase tracking-[0.05em] text-ink shadow-hard-sm"
        >
          <Check size={14} /> Refresh availability
        </button>
      )}
    </div>
  )
}
