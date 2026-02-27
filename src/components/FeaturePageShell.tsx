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
  needsCrowd?: boolean
  children: (props: {
    pubs: Pub[]
    userLocation: { lat: number; lng: number } | null
    crowdReports: Record<string, CrowdReport>
  }) => ReactNode
}

export default function FeaturePageShell({ breadcrumbs, needsCrowd = false, children }: FeaturePageShellProps) {
  const [pubs, setPubs] = useState<Pub[]>([])
  const [crowdReports, setCrowdReports] = useState<Record<string, CrowdReport>>({})
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const promises: Promise<unknown>[] = [getPubs()]
      if (needsCrowd) promises.push(getCrowdLevels())
      const results = await Promise.all(promises)
      setPubs(results[0] as Pub[])
      if (needsCrowd && results[1]) setCrowdReports(results[1] as Record<string, CrowdReport>)
      setIsLoading(false)
    }
    load()
  }, [needsCrowd])

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
      <main className="min-h-screen bg-cream">
        <SubPageNav breadcrumbs={breadcrumbs} />
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-stone-300 border-t-amber rounded-full animate-spin" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-cream">
      <SubPageNav breadcrumbs={breadcrumbs} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <ErrorBoundary>
          {children({ pubs, userLocation, crowdReports })}
        </ErrorBoundary>
      </div>
      <Footer />
    </main>
  )
}
