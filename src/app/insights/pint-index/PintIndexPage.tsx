'use client'

import SubPageNav from '@/components/SubPageNav'
import PintIndex from '@/components/PintIndex'
import Footer from '@/components/Footer'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function PintIndexPage() {
  return (
    <main className="min-h-screen bg-cream">
      <SubPageNav breadcrumbs={[
        { label: 'Insights', href: '/insights' },
        { label: 'Perth Pint Index™' },
      ]} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <ErrorBoundary><PintIndex /></ErrorBoundary>
      </div>
      <Footer />
    </main>
  )
}
