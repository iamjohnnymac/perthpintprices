'use client'

import SubPageNav from '@/components/SubPageNav'
import PintOfTheDay from '@/components/PintOfTheDay'
import Footer from '@/components/Footer'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function PintOfTheDayPage() {
  return (
    <main className="min-h-screen bg-cream">
      <SubPageNav breadcrumbs={[
        { label: 'Insights', href: '/insights' },
        { label: 'Pint of the Day' },
      ]} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <ErrorBoundary><PintOfTheDay /></ErrorBoundary>
      </div>
      <Footer />
    </main>
  )
}
