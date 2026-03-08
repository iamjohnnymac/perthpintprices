'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Compass, Clock, Trophy, Map, BarChart3, Beer } from 'lucide-react'

interface MobileNavProps {
  onSubmitClick?: () => void
}

const NAV_LINKS = [
  { href: '/discover', label: 'Discover', icon: Compass, desc: 'Guides, stats and pub picks' },
  { href: '/happy-hour', label: 'Happy Hours', icon: Clock, desc: 'Live deals right now' },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy, desc: 'Top price reporters' },
  { href: '/pint-crawl', label: 'Pint Crawl', icon: Map, desc: 'Plan your pub route' },
  { href: '/weekly-report', label: 'Weekly Report', icon: BarChart3, desc: 'This week in pints' },
]

export default function MobileNav({ onSubmitClick }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  // Lock body scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="sm:hidden flex items-center justify-center w-10 h-10 -mr-2"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-ink" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] sm:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-ink/30 backdrop-blur-sm animate-fadeIn"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-[340px] bg-[#FDF8F0] shadow-2xl flex flex-col animate-slideIn">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-light/60">
              <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2 no-underline">
                <div className="w-7 h-7 bg-amber border-2 border-ink rounded-md flex items-center justify-center shadow-[2px_2px_0_#171717]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
                </div>
                <span className="font-mono text-[1.3rem] font-extrabold text-ink tracking-[-0.04em]">arvo</span>
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/60 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-ink" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {NAV_LINKS.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-white/60 transition-colors no-underline group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white border-2 border-gray-light/60 flex items-center justify-center flex-shrink-0 group-hover:border-amber/50 transition-colors">
                      <Icon className="w-5 h-5 text-ink" />
                    </div>
                    <div>
                      <span className="font-mono text-[0.82rem] font-bold text-ink block">{link.label}</span>
                      <span className="text-[0.72rem] text-gray-mid leading-tight">{link.desc}</span>
                    </div>
                  </Link>
                )
              })}
            </nav>

            {/* Bottom CTA */}
            <div className="px-6 py-5 border-t border-gray-light/60">
              {onSubmitClick ? (
                <button
                  onClick={() => {
                    setOpen(false)
                    setTimeout(() => onSubmitClick(), 100)
                  }}
                  className="w-full font-mono text-[0.82rem] font-bold uppercase tracking-[0.05em] text-white bg-amber border-3 border-ink rounded-pill py-3.5 shadow-hard-sm hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover transition-all cursor-pointer text-center"
                >
                  <Beer className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                  Submit a Price
                </button>
              ) : (
                <Link
                  href="/?submit=1"
                  onClick={() => setOpen(false)}
                  className="block w-full font-mono text-[0.82rem] font-bold uppercase tracking-[0.05em] text-white bg-amber border-3 border-ink rounded-pill py-3.5 shadow-hard-sm hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover transition-all no-underline text-center"
                >
                  <Beer className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                  Submit a Price
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
