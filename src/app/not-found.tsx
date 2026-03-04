import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="font-serif text-6xl sm:text-7xl text-charcoal mb-2">404</h1>
        <p className="text-lg text-stone-warm mb-6">
          This page has done a runner.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-amber text-white font-semibold rounded-full hover:opacity-90 transition-opacity"
        >
          Back to all pubs
        </Link>
      </div>
    </div>
  )
}
