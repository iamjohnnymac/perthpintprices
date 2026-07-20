'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body className="bg-[#FDF8F0] font-body text-ink">
        <main className="min-h-screen px-6 py-20">
          <section className="mx-auto max-w-container rounded-card border-3 border-ink bg-off-white p-8 shadow-hard-sm">
            <p className="font-mono text-sm uppercase tracking-wide text-amber">Site error</p>
            <h1 className="mt-3 font-display text-4xl">Something went wrong</h1>
            <p className="mt-4 text-gray-mid">Try loading this page again.</p>
            <button
              className="mt-8 rounded-pill border-3 border-ink bg-amber px-6 py-3 font-mono font-bold text-ink shadow-hard-sm"
              onClick={reset}
              type="button"
            >
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  )
}
