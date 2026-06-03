'use client'

import Link from 'next/link'
import { ArrowUpRight, CircleDollarSign } from 'lucide-react'
import SubPageNav from '@/components/SubPageNav'
import PintIndex from '@/components/PintIndex'
import Footer from '@/components/Footer'
import { ErrorBoundary } from '@/components/ErrorBoundary'

interface PintIndexAnswerStats {
  averagePrice: string
  medianPrice: string
  verifiedCount: number
  trackedCount: number
  suburbCount: number
  underTenCount: number
  cheapestName: string | null
  cheapestSuburb: string | null
  cheapestPrice: string
  cheapestUrl: string | null
}

export default function PintIndexPage({ stats }: { stats: PintIndexAnswerStats }) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FDF8F0]">
      <SubPageNav breadcrumbs={[
        { label: 'Insights', href: '/insights' },
        { label: 'Perth Pint Index™' },
      ]} />
      <h1 className="sr-only">Perth Pint Index</h1>
      <div className="mx-auto w-[calc(100vw-3rem)] max-w-container py-8 sm:py-12">
        <section className="mb-5 rounded-card border-3 border-ink bg-ink p-5 text-white shadow-hard-sm">
          <div className="flex items-start gap-3">
            <CircleDollarSign className="mt-1 h-5 w-5 shrink-0 text-amber-light" />
            <div>
              <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.08em] text-white/55">
                Answer first
              </p>
              <h2 className="mt-2 font-mono text-xl font-extrabold text-white">
                What are Perth beer prices right now?
              </h2>
              <p className="mt-3 font-body text-[0.9rem] leading-relaxed text-white/70">
                Perth&apos;s checked pint average is {stats.averagePrice}, with a {stats.medianPrice} median across {stats.verifiedCount} verified regular pint rows. {stats.cheapestName && stats.cheapestUrl ? <>The cheapest checked pint is <Link href={stats.cheapestUrl} className="font-bold text-amber-light hover:underline">{stats.cheapestPrice} at {stats.cheapestName}</Link> in {stats.cheapestSuburb}.</> : 'The cheapest checked pint is still TBC.'} We track {stats.trackedCount} pubs across {stats.suburbCount} suburbs; {stats.underTenCount} verified rows currently sit under $10.
              </p>
              <Link
                href="/how-much-is-a-pint-in-perth"
                className="mt-4 inline-flex items-center gap-2 font-mono text-[0.72rem] font-bold uppercase tracking-[0.05em] text-amber-light no-underline hover:text-white"
              >
                Read the plain-English price answer <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>
        <div className="overflow-x-auto">
          <ErrorBoundary><PintIndex /></ErrorBoundary>
        </div>
      </div>
      <div className="mx-auto w-[calc(100vw-3rem)] max-w-container pb-8 sm:pb-12">
        <section
          className="mx-auto w-full max-w-container border-3 border-ink rounded-card bg-white p-5 sm:p-6 shadow-hard-sm"
          style={{ boxSizing: 'border-box' }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.08em] text-gray-mid mb-2">
                Methodology
              </p>
              <h2 className="font-mono font-extrabold text-xl tracking-[-0.02em] text-ink">
                How the Index works
              </h2>
            </div>
            <a
              href="/insights/pint-index/data.csv"
              className="inline-flex w-full sm:w-auto items-center justify-center font-mono text-[0.72rem] font-bold uppercase tracking-[0.05em] text-ink bg-amber-pale border-3 border-ink rounded-pill px-5 py-2.5 shadow-hard-sm hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover transition-all no-underline"
            >
              Download CSV
            </a>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="border border-gray-light rounded-card bg-off-white p-4">
              <h3 className="font-mono text-[0.75rem] font-bold uppercase tracking-[0.06em] text-ink mb-2">
                What we count
              </h3>
              <p className="font-body text-[0.85rem] leading-relaxed text-gray-mid">
                The Index uses verified standard pint prices from Perth pubs in our database. A pint means 570ml; a schooner is 425ml and a middy is 285ml. If we cannot confirm a pint price, the venue stays TBC and out of the price average.
              </p>
            </div>
            <div className="border border-gray-light rounded-card bg-off-white p-4">
              <h3 className="font-mono text-[0.75rem] font-bold uppercase tracking-[0.06em] text-ink mb-2">
                How prices are checked
              </h3>
              <p className="font-body text-[0.85rem] leading-relaxed text-gray-mid">
                Prices come from community reports, menu checks, and direct calls. Each pub page shows its last verified date where we have one. Weekly snapshots store the city average, median, range, suburb count, and suburb leaders.
              </p>
            </div>
          </div>
          <p className="mt-4 font-body text-[0.78rem] leading-relaxed text-gray-mid">
            The CSV export is the public snapshot series behind this page. It is built for citation, media checks, and anyone who wants to argue about beer prices with numbers in front of them.
          </p>
        </section>
      </div>
      <Footer />
    </main>
  )
}
