interface HeroSectionProps {
  pubs: { price: number | null; suburb: string }[]
}

export default function HeroSection({ pubs }: HeroSectionProps) {
  const priced = pubs.filter(p => p.price !== null)
  const venueCount = pubs.length
  const suburbCount = new Set(pubs.map(p => p.suburb)).size
  const cheapest = priced.length > 0 ? Math.min(...priced.map(p => p.price!)) : 0

  return (
    <>
      {/* Hero */}
      <section className="text-center px-6 pt-10 pb-12 max-w-container mx-auto relative">
        {/* Dot grid background texture */}
        <div className="absolute inset-0 bg-dot-grid opacity-[0.035] pointer-events-none" />

        {/* Beer glass illustration — fresh pour animation */}
        <div className="w-[140px] h-[170px] mx-auto mb-8 relative animate-scale-in">
          <div className="w-[96px] h-[130px] mx-auto relative border-3 border-ink rounded-[5px_5px_10px_10px] shadow-hard overflow-hidden bg-white">
            {/* Beer liquid — fills from bottom */}
            <div className="absolute inset-0 animate-beer-fill"
                 style={{ background: 'linear-gradient(180deg, #F5D98A 0%, #D4A030 45%, #C4880A 100%)' }} />
            {/* Foam — appears after pour completes */}
            <div className="absolute -top-[10px] -left-[3px] -right-[3px] h-[36px] bg-[#FFFEF0] rounded-[22px_22px_40%_40%] border-3 border-ink border-b-0 animate-foam-appear" />
            {/* Handle */}
            <div className="absolute -right-[26px] top-[24px] w-[22px] h-[56px] border-3 border-ink border-l-0 rounded-[0_12px_12px_0] bg-white" />
          </div>
        </div>

        <h1 className="font-display text-[clamp(2.6rem,8vw,3.6rem)] font-bold leading-[1.05] tracking-[-0.03em] text-ink mb-3 animate-fade-up stagger-2">
          Perth&apos;s pints,<br />
          <span className="text-amber italic">sorted.</span>
        </h1>
        <p className="font-body text-[1rem] text-gray-mid font-medium animate-fade-up stagger-3">
          Every pub. Every price. Updated weekly.
        </p>
        <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] text-gray-mid/60 mt-2 animate-fade-up stagger-4">
          Community-powered · Est. 2024
        </p>
      </section>

      {/* Stat strip */}
      <div className="max-w-container mx-auto px-6 pb-8 flex gap-2.5 justify-center flex-wrap">
        <div className="border-3 border-ink rounded-card px-5 py-3.5 text-center min-w-[100px] bg-white shadow-hard-sm animate-fade-up stagger-5">
          <span className="font-mono text-[1.6rem] font-extrabold tracking-[-0.02em] block leading-[1.1]">{venueCount}</span>
          <span className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.08em] text-gray-mid block mt-0.5">Venues</span>
        </div>
        <div className="border-3 border-ink rounded-card px-5 py-3.5 text-center min-w-[100px] bg-white shadow-hard-sm animate-fade-up stagger-6">
          <span className="font-mono text-[1.6rem] font-extrabold tracking-[-0.02em] block leading-[1.1]">{suburbCount}</span>
          <span className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.08em] text-gray-mid block mt-0.5">Suburbs</span>
        </div>
        <div className="border-3 border-ink rounded-card px-5 py-3.5 text-center min-w-[100px] bg-amber shadow-hard-sm animate-fade-up stagger-7">
          <span className="font-mono text-[1.6rem] font-extrabold tracking-[-0.02em] block leading-[1.1] text-white">${cheapest}</span>
          <span className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.08em] text-white/80 block mt-0.5">Cheapest</span>
        </div>
      </div>
    </>
  )
}
