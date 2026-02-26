'use client'

import Link from 'next/link'

interface SubPageNavProps {
  title?: string
  subtitle?: string
  showSubmit?: boolean
}

export default function SubPageNav({ title, subtitle, showSubmit = true }: SubPageNavProps) {
  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-stone-200/60 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1.5 text-stone-warm hover:text-charcoal transition-colors text-sm">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </Link>
          <Link href="/" className="flex items-center gap-1.5">
            <span className="text-amber text-lg">✳</span>
            <span className="font-serif text-lg text-charcoal">arvo</span>
          </Link>
          {title && (
            <>
              <span className="text-stone-300 text-sm">/</span>
              <div>
                <span className="text-sm font-semibold text-charcoal">{title}</span>
                {subtitle && <span className="text-xs text-stone-400 ml-2 hidden sm:inline">{subtitle}</span>}
              </div>
            </>
          )}
        </div>
        {showSubmit && (
          <Link
            href="/"
            className="px-3 py-1.5 bg-charcoal hover:bg-charcoal/90 text-white rounded-full font-semibold transition-all text-xs"
          >
            <span className="hidden sm:inline">Submit a Price</span>
            <span className="sm:hidden">+ Price</span>
          </Link>
        )}
      </div>
    </header>
  )
}
