'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import MobileNav from '@/components/MobileNav'
import PintIndexBadge from '@/components/PintIndexBadge'

interface BreadcrumbLink {
  label: string
  href?: string
}

interface SubPageNavProps {
  breadcrumbs?: BreadcrumbLink[]
  title?: string
  subtitle?: string
  showSubmit?: boolean
  /** Optional chip rendered after the page label, e.g. "Beta". */
  badge?: string
}

export default function SubPageNav({ breadcrumbs, title, subtitle, showSubmit = true, badge }: SubPageNavProps) {
  const pathname = usePathname()
  const navLinks = [
    { href: '/discover', label: 'Discover' },
    { href: '/happy-hour', label: 'Happy Hours' },
    { href: '/articles', label: 'Articles' },
  ].filter((link) => link.href !== pathname)

  const pageLabel = breadcrumbs
    ? breadcrumbs[breadcrumbs.length - 1]?.label
    : title

  return (
    <header className="max-w-container mx-auto px-6 pt-6 pb-3">
      {/* Row 1: Logo + nav links */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2 no-underline flex-shrink-0">
            <div className="w-7 h-7 bg-amber border-2 border-ink rounded-md flex items-center justify-center text-sm shadow-[2px_2px_0_#171717]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
            </div>
            <span className="font-mono text-[0.95rem] sm:text-[1.05rem] font-extrabold text-ink tracking-[-0.04em] leading-none whitespace-nowrap">Perth Pint Prices</span>
          </Link>

          {/* Mobile-only breadcrumb (page name) */}
          {pageLabel && (
            <div className="flex md:hidden items-center gap-1.5 min-w-0">
              <span className="text-gray-mid text-sm flex-shrink-0">/</span>
              <span className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.05em] text-ink truncate">{pageLabel}</span>
              {badge && (
                <span className="font-mono text-[0.53rem] font-extrabold uppercase tracking-[0.08em] bg-amber text-white rounded-pill px-2 py-0.5 flex-shrink-0 whitespace-nowrap">{badge}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.05em] text-gray-mid hover:text-amber transition-colors no-underline px-3 py-1.5 whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <MobileNav />
        </div>
      </div>

      {/* Row 2: Badge + breadcrumb + submit */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3 min-w-0">
          <PintIndexBadge className="flex" />

          {/* Desktop-only breadcrumb (page name, no subtitle) */}
          {breadcrumbs ? (
            <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1.5 min-w-0 overflow-hidden">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1.5 min-w-0">
                  <span className="text-gray-mid text-sm flex-shrink-0">/</span>
                  {crumb.href ? (
                    <Link href={crumb.href} className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.05em] text-gray-mid hover:text-amber transition-colors whitespace-nowrap no-underline">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.05em] text-ink truncate">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          ) : title ? (
            <div className="hidden md:flex items-center gap-1.5 min-w-0">
              <span className="text-gray-mid text-sm flex-shrink-0">/</span>
              <span className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.05em] text-ink truncate">{title}</span>
            </div>
          ) : null}
          {badge && (
            <span className="hidden md:inline-flex font-mono text-[0.53rem] font-extrabold uppercase tracking-[0.08em] bg-amber text-white rounded-pill px-2 py-0.5 flex-shrink-0 whitespace-nowrap">{badge}</span>
          )}
        </div>

        {showSubmit && (
          <Link
            href="/?submit=1"
            className="hidden sm:inline-flex font-mono text-[0.72rem] font-bold uppercase tracking-[0.05em] text-ink bg-white border-3 border-ink rounded-pill px-5 py-2.5 shadow-hard-sm hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover transition-all no-underline flex-shrink-0"
          >
            Report a price
          </Link>
        )}
      </div>
    </header>
  )
}
