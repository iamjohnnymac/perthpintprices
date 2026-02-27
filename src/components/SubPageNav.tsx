'use client'

import Link from 'next/link'

interface BreadcrumbLink {
  label: string
  href?: string
}

interface SubPageNavProps {
  breadcrumbs?: BreadcrumbLink[]
  title?: string
  subtitle?: string
  showSubmit?: boolean
}

export default function SubPageNav({ breadcrumbs, title, subtitle, showSubmit = true }: SubPageNavProps) {
  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-stone-200/60 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-1.5 text-stone-warm hover:text-charcoal transition-colors text-sm flex-shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="flex-shrink-0"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" stroke="#E8820C" strokeWidth="2.5" strokeLinecap="round"/></svg>
            <span className="font-serif text-lg text-charcoal">arvo</span>
          </Link>
          {breadcrumbs ? (
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0 overflow-hidden">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1.5 min-w-0">
                  <span className="text-stone-300 text-sm flex-shrink-0">/</span>
                  {crumb.href ? (
                    <Link href={crumb.href} className="text-sm text-stone-warm hover:text-charcoal transition-colors whitespace-nowrap">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold text-charcoal truncate">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          ) : title ? (
            <>
              <span className="text-stone-300 text-sm">/</span>
              <div>
                <span className="text-sm font-semibold text-charcoal">{title}</span>
                {subtitle && <span className="text-xs text-stone-400 ml-2 hidden sm:inline">{subtitle}</span>}
              </div>
            </>
          ) : null}
        </div>
        {showSubmit && (
          <Link
            href="/"
            className="px-3 py-1.5 bg-charcoal hover:bg-charcoal/90 text-white rounded-full font-semibold transition-all text-xs flex-shrink-0"
          >
            <span className="hidden sm:inline">Submit a Price</span>
            <span className="sm:hidden">Submit</span>
          </Link>
        )}
      </div>
    </header>
  )
}
