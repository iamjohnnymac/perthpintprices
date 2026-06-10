'use client'

import { useState, useEffect, ReactNode } from 'react'
import { Pub } from '@/types/pub'
import { getPubs, getCrowdLevels, CrowdReport } from '@/lib/supabase'
import SubPageNav from '@/components/SubPageNav'
import Footer from '@/components/Footer'
import { ErrorBoundary } from '@/components/ErrorBoundary'

interface BreadcrumbLink {
  label: string
  href?: string
}

interface FeaturePageShellProps {
  breadcrumbs: BreadcrumbLink[]
  title?: string
  /** Render the H1 visibly (type-hero) instead of sr-only, with an intro line under it. */
  intro?: string
  needsCrowd?: boolean
  /** Server-fetched pubs. When provided the shell renders content in the initial
   *  HTML instead of spinning while the browser fetches from Supabase. */
  initialPubs?: Pub[]
  children: (props: {
    pubs: Pub[]
    userLocation: { lat: number; lng: number } | null
    crowdReports: Record<string, CrowdReport>
  }) => ReactNode
}

export default function FeaturePageShell({ breadcrumbs, title, intro, needsCrowd = false, initialPubs, children }: FeaturePageShellProps) {
  const hasServerPubs = Boolean(initialPubs && initialPubs.length > 0)
  const [pubs, setPubs] = useState<Pub[]>(initialPubs ?? [])
  const [crowdReports, setCrowdReports] = useState<Record<string, CrowdReport>>({})
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoading, setIsLoading] = useState(!hasServerPubs)

  useEffect(() => {
    async function load() {
      if (!hasServerPubs) {
        setPubs(await getPubs())
      }
      if (needsCrowd) {
        setCrowdReports(await getCrowdLevels())
      }
      setIsLoading(false)
    }
    load()
  }, [needsCrowd, hasServerPubs])

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
      )
    }
  }, [])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#FDF8F0]">
        <SubPageNav breadcrumbs={breadcrumbs} />
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 border-4 border-gray border-t-amber rounded-full animate-spin" />
            <span className="text-gray-mid font-medium text-lg">Loading...</span>
          </div>
        </div>
      </main>
    )
  }

  if (pubs.length === 0) {
    return (
      <main className="min-h-screen bg-[#FDF8F0]">
        <SubPageNav breadcrumbs={breadcrumbs} />
        {title && <h1 className="sr-only">{title}</h1>}
        <div className="max-w-container mx-auto px-6 py-16">
          <div className="bg-white border-3 border-ink rounded-card shadow-hard-sm p-8 text-center">
            <h2 className="font-mono text-lg font-extrabold text-ink mb-2">The pub list didn&apos;t load</h2>
            <p className="font-body text-[0.9rem] leading-relaxed text-gray-mid mb-5 max-w-[420px] mx-auto">
              Could be a patchy connection, could be us. Give it another go.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.05em] text-ink bg-white border-3 border-ink rounded-pill px-5 py-2.5 shadow-hard-sm hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover transition-all cursor-pointer"
            >
              Try again
            </button>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FDF8F0]">
      <SubPageNav breadcrumbs={breadcrumbs} />
      {title && (intro ? (
        <div className="max-w-container mx-auto px-6 pt-8 sm:pt-12">
          <h1 className="type-hero">{title}</h1>
          <p className="font-body text-[0.9rem] leading-relaxed text-gray-mid mt-3 max-w-[560px]">{intro}</p>
        </div>
      ) : (
        <h1 className="sr-only">{title}</h1>
      ))}
      <div className="max-w-container mx-auto px-6 py-8 sm:py-12">
        <ErrorBoundary>
          {children({ pubs, userLocation, crowdReports })}
        </ErrorBoundary>
      </div>
      <Footer />
    </main>
  )
}
