'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  AudioWaveform,
  Check,
  Clock3,
  Database,
  FileCheck2,
  PhoneCall,
  Play,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react'

const STEPS = [
  { label: 'Dial', short: 'Calling venue' },
  { label: 'Listen', short: 'Answer captured' },
  { label: 'Validate', short: 'Fields validated' },
  { label: 'Preview', short: 'Update ready for review' },
]

const TRANSCRIPT = [
  { speaker: 'Andrew', text: 'Hi, is this The Northbridge Hotel?' },
  { speaker: 'Venue', text: 'Yep, speaking.' },
  {
    speaker: 'Andrew',
    text: 'Andrew from Perth Pint Prices. Could you help me with your cheapest pint, what it is, and any happy hour?',
  },
  {
    speaker: 'Venue',
    text: 'Swan Draught is nine dollars a pint. Happy hour is four to six, Monday to Friday.',
  },
]

const DELAYS = [700, 2100, 3300]

export default function AiPriceDemo() {
  const [stage, setStage] = useState(0)
  const [running, setRunning] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const runPriceCheck = () => {
    timers.current.forEach(clearTimeout)
    setStage(0)
    setRunning(true)

    DELAYS.forEach((delay, index) => {
      timers.current.push(
        setTimeout(() => {
          setStage(index + 1)
          if (index === DELAYS.length - 1) setRunning(false)
        }, delay),
      )
    })
  }

  const resetPriceCheck = () => {
    timers.current.forEach(clearTimeout)
    setRunning(false)
    setStage(0)
  }

  const visibleTranscript = stage === 0 ? 1 : TRANSCRIPT.length
  const isCaptured = stage >= 1
  const isValidated = stage >= 2
  const isReady = stage >= 3

  return (
    <main className="min-h-screen overflow-hidden bg-[#FDF8F0] text-ink">
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none opacity-[0.045] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:32px_32px]" />

      <header className="relative max-w-container mx-auto px-6 pt-6">
        <div className="flex items-center justify-between border-b-3 border-ink pb-4">
          <Link href="/" className="flex items-center gap-2.5 no-underline text-ink">
            <span className="grid h-8 w-8 place-items-center rounded-card border-3 border-ink bg-amber shadow-hard-sm">
              <AudioWaveform size={17} strokeWidth={3} className="text-white" aria-hidden="true" />
            </span>
            <span className="whitespace-nowrap font-mono text-[0.78rem] font-extrabold tracking-[-0.04em] sm:text-[0.92rem]">Perth Pint Prices</span>
          </Link>
          <span className="rounded-pill border-3 border-ink bg-white px-2 py-1 font-mono text-[0.52rem] font-bold uppercase tracking-[0.1em] sm:px-3 sm:text-[0.62rem] sm:tracking-[0.12em]">
            Andrew · Price check
          </span>
        </div>
      </header>

      <section className="relative max-w-container mx-auto px-6 pb-8 pt-12 sm:pb-12 sm:pt-16">
        <div className="max-w-[690px]">
          <p className="type-eyebrow mb-4 flex items-center gap-2 text-amber">
            <span className="h-2 w-2 rounded-full bg-amber" />
            AI in the real world
          </p>
          <h1 className="font-display text-[3.25rem] font-normal leading-[0.92] tracking-[-0.035em] sm:text-[5.5rem]">
            One phone call.
            <span className="block italic text-amber">One fresher price.</span>
          </h1>
          <p className="mt-6 max-w-[590px] text-[1rem] font-medium leading-relaxed text-ink/70 sm:text-[1.12rem]">
            Andrew rings the pub, understands the answer, checks the price and glass size, then prepares a clean listing update for review.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={runPriceCheck}
            disabled={running}
            className="inline-flex items-center justify-center gap-2 rounded-pill border-3 border-ink bg-amber px-6 py-3 font-mono text-[0.78rem] font-extrabold uppercase tracking-[0.05em] text-white shadow-hard-sm transition-all hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover disabled:cursor-wait disabled:opacity-70"
          >
            {running ? <AudioWaveform size={17} className="animate-pulse" /> : <Play size={16} fill="currentColor" />}
            {running ? 'Andrew is on the call' : 'See Andrew at work'}
          </button>
          <button
            type="button"
            onClick={resetPriceCheck}
            className="inline-flex items-center justify-center gap-2 rounded-pill px-4 py-3 font-mono text-[0.72rem] font-bold uppercase tracking-[0.05em] text-gray-mid transition-colors hover:text-ink"
          >
            <RotateCcw size={15} /> Reset
          </button>
        </div>
      </section>

      <section className="relative max-w-container mx-auto px-6 pb-14">
        <div className="mb-4 grid grid-cols-4 gap-1 sm:gap-3">
          {STEPS.map((step, index) => {
            const active = stage >= index
            return (
              <div key={step.label} className="min-w-0">
                <div className={`mb-2 h-1.5 rounded-pill transition-colors duration-500 ${active ? 'bg-amber' : 'bg-gray'}`} />
                <p className={`font-mono text-[0.58rem] font-bold uppercase tracking-[0.08em] sm:text-[0.65rem] ${active ? 'text-ink' : 'text-gray-mid'}`}>
                  <span className="hidden sm:inline">0{index + 1} · </span>{step.label}
                </p>
              </div>
            )
          })}
        </div>

        <div className="grid overflow-hidden rounded-card border-3 border-ink bg-white shadow-hard-sm lg:grid-cols-[1.15fr_0.85fr]">
          <div className="bg-ink p-5 text-white sm:p-7">
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <div className="flex items-center gap-3">
                <span className={`grid h-10 w-10 place-items-center rounded-full border-2 ${running ? 'border-amber-light bg-amber text-white' : 'border-white/20 bg-white/10 text-white'}`}>
                  <PhoneCall size={19} />
                </span>
                <div>
                  <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.1em] text-white/45">Outbound call</p>
                  <p className="mt-0.5 text-sm font-bold">The Northbridge Hotel</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 font-mono text-[0.62rem] font-bold uppercase tracking-[0.08em] text-amber-light">
                  <span className={`h-2 w-2 rounded-full bg-amber-light ${running ? 'animate-pulse' : ''}`} />
                  {isReady ? 'Complete' : running ? 'Live' : 'Ready'}
                </div>
                <p className="mt-1 font-mono text-[0.62rem] text-white/40">00:{stage === 0 ? '03' : stage === 1 ? '24' : '31'}</p>
              </div>
            </div>

            <div className="min-h-[292px] space-y-4 py-5" aria-live="polite">
              {TRANSCRIPT.slice(0, visibleTranscript).map((line, index) => (
                <div key={`${line.speaker}-${index}`} className="grid grid-cols-[62px_1fr] gap-3 transition-all duration-500">
                  <span className={`pt-0.5 font-mono text-[0.6rem] font-bold uppercase tracking-[0.08em] ${line.speaker === 'Andrew' ? 'text-amber-light' : 'text-white/40'}`}>
                    {line.speaker}
                  </span>
                  <p className="text-[0.82rem] leading-relaxed text-white/80">{line.text}</p>
                </div>
              ))}
            </div>

            <div className={`rounded-card border border-white/15 bg-white/[0.06] p-4 transition-all duration-500 ${isCaptured ? 'opacity-100' : 'opacity-45'}`}>
              <div className="mb-3 flex items-center justify-between">
                <p className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.1em] text-white/45">Structured capture</p>
                {isCaptured && <span className="font-mono text-[0.58rem] font-bold uppercase text-amber-light">High confidence</span>}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['Price', isCaptured ? '$9.00' : '—'],
                  ['Tap', isCaptured ? 'Swan Draught' : '—'],
                  ['Happy hour', isCaptured ? 'Mon–Fri · 4–6' : '—'],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <p className="font-mono text-[0.52rem] uppercase tracking-[0.08em] text-white/35">{label}</p>
                    <p className="mt-1 truncate font-mono text-[0.68rem] font-bold text-white sm:text-[0.72rem]">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col bg-off-white p-5 sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="type-eyebrow">Listing update</p>
                <p className="mt-1 font-mono text-[0.65rem] font-bold text-green">ready for review</p>
              </div>
              <FileCheck2 size={22} className="text-gray-mid" />
            </div>

            <div className="my-7 flex-1 rounded-card border-3 border-ink bg-white p-5 shadow-hard-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.1em] text-gray-mid">Northbridge</p>
                  <h2 className="mt-1 font-display text-[1.8rem] font-normal leading-none">The Northbridge Hotel</h2>
                </div>
                <span className={`rounded-pill px-2.5 py-1 font-mono text-[0.55rem] font-bold uppercase tracking-[0.06em] ${isValidated ? 'bg-green-pale text-green' : 'bg-gray-light text-gray-mid'}`}>
                  {isValidated ? 'Validated' : 'Checking'}
                </span>
              </div>

              <div className="mt-7 flex items-end justify-between border-y-3 border-ink py-5">
                <div>
                  <p className="type-eyebrow">Cheapest pint</p>
                  <p className={`mt-2 font-mono text-[3.3rem] font-extrabold leading-none tracking-[-0.06em] transition-colors duration-500 ${isReady ? 'text-amber' : 'text-gray'}`}>
                    {isReady ? '$9' : '$—'}
                  </p>
                </div>
                <div className="pb-1 text-right">
                  <p className="font-mono text-[0.68rem] font-bold">{isReady ? 'Swan Draught' : 'Awaiting capture'}</p>
                  <p className="mt-1 font-mono text-[0.55rem] uppercase tracking-[0.06em] text-gray-mid">570ml pint</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-gray-mid">
                  <Clock3 size={14} />
                  <span className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.06em]">
                    {isReady ? 'Captured just now' : 'Awaiting price check'}
                  </span>
                </div>
                {isReady && <Check size={18} strokeWidth={3} className="text-green" />}
              </div>
            </div>

            <div className={`flex items-center gap-3 rounded-card border-2 p-3 transition-all duration-500 ${isReady ? 'border-green bg-green-pale text-green' : 'border-gray bg-white text-gray-mid'}`}>
              <span className={`grid h-8 w-8 flex-none place-items-center rounded-full ${isReady ? 'bg-green text-white' : 'bg-gray-light'}`}>
                {isReady ? <Check size={16} strokeWidth={3} /> : <Database size={16} />}
              </span>
              <div>
                <p className="font-mono text-[0.65rem] font-extrabold uppercase tracking-[0.05em]">{STEPS[stage].short}</p>
                <p className="mt-0.5 text-[0.7rem] opacity-70">{isReady ? 'The captured fields are ready for a human review.' : 'Andrew keeps the source, quote, and time on record.'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-y-3 border-ink bg-amber-pale">
        <div className="max-w-container mx-auto grid divide-y-3 divide-ink px-6 py-2 sm:grid-cols-3 sm:divide-x-3 sm:divide-y-0 sm:px-0">
          {[
            { icon: PhoneCall, number: '01', title: 'Sounds local', copy: 'A short, natural call that respects the person answering.' },
            { icon: ShieldCheck, number: '02', title: 'Keeps the record', copy: 'The transcript, confidence, timestamp, and source stay attached.' },
            { icon: Database, number: '03', title: 'Prepares the update', copy: 'Range and glass-size checks turn the answer into fields ready for review.' },
          ].map(({ icon: Icon, number, title, copy }) => (
            <article key={number} className="py-6 sm:px-6">
              <div className="flex items-center justify-between">
                <Icon size={20} className="text-amber" />
                <span className="font-mono text-[0.6rem] font-bold text-gray-mid">{number}</span>
              </div>
              <h2 className="mt-4 font-mono text-[0.84rem] font-extrabold uppercase tracking-[-0.01em]">{title}</h2>
              <p className="mt-2 text-[0.78rem] leading-relaxed text-ink/65">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="relative max-w-container mx-auto px-6 py-12 sm:py-16">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="type-eyebrow text-amber">The useful bit</p>
            <h2 className="mt-3 max-w-[520px] font-display text-[2.4rem] font-normal leading-[1.02] sm:text-[3.4rem]">
              The AI does not make up the price. It goes and gets it.
            </h2>
          </div>
          <Link href="/" className="inline-flex items-center gap-2 self-start font-mono text-[0.7rem] font-bold uppercase tracking-[0.06em] text-ink underline decoration-2 underline-offset-4 sm:self-auto">
            View the live website <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </main>
  )
}
