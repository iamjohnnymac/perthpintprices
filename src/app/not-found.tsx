import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="font-mono text-[6rem] sm:text-[8rem] font-extrabold text-ink leading-none tracking-[-0.04em]">404</div>
        <p className="font-body text-lg text-gray-mid mb-8">
          This page has done a runner.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-[0.85rem] font-bold uppercase tracking-[0.05em] text-ink bg-amber-light border-3 border-ink rounded-pill px-9 py-4 shadow-hard hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-hard-hover transition-all no-underline"
        >
          Back to all pubs
        </Link>
      </div>
    </div>
  )
}
