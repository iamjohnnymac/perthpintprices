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

        {/* Beer glass illustration - fresh pour animation */}
        <div className="w-[160px] h-[185px] mx-auto mb-8 relative animate-scale-in">
          <div className="w-[100px] h-[138px] mx-auto relative border-3 border-ink rounded-[5px_5px_12px_12px] shadow-hard overflow-hidden bg-white">
            {/* Beer liquid - fills from bottom */}
            <div className="absolute inset-0 animate-beer-fill"
                 style={{ background: 'linear-gradient(180deg, #F5D98A 0%, #E8B84D 30%, #D4A030 55%, #C4880A 100%)' }}>
              {/* Beer bubbles texture */}
              <div className="absolute inset-0 animate-bubble-rise" style={{
                backgroundImage: `
                  radial-gradient(circle 2px at 25% 80%, rgba(255,255,255,0.35) 0%, transparent 100%),
                  radial-gradient(circle 1.5px at 55% 70%, rgba(255,255,255,0.3) 0%, transparent 100%),
                  radial-gradient(circle 1px at 40% 55%, rgba(255,255,255,0.25) 0%, transparent 100%),
                  radial-gradient(circle 2px at 70% 85%, rgba(255,255,255,0.3) 0%, transparent 100%),
                  radial-gradient(circle 1px at 30% 40%, rgba(255,255,255,0.2) 0%, transparent 100%),
                  radial-gradient(circle 1.5px at 60% 30%, rgba(255,255,255,0.2) 0%, transparent 100%)
                `
              }} />
              {/* Glass highlight/shimmer */}
              <div className="absolute top-0 bottom-0 left-[12%] w-[12%] opacity-20"
                   style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.6) 100%)' }} />
            </div>
            {/* Foam - thick and bubbly, appears after pour */}
            <div className="absolute -top-[12px] -left-[3px] -right-[3px] h-[46px] rounded-[24px_24px_40%_40%] border-3 border-ink border-b-0 animate-foam-appear overflow-hidden"
                 style={{ background: 'linear-gradient(180deg, #FFFFF5 0%, #FFF8E1 40%, #F5ECCE 100%)' }}>
              {/* Foam bubble texture */}
              <div className="absolute inset-0" style={{
                backgroundImage: `
                  radial-gradient(circle 4px at 20% 55%, rgba(255,255,255,0.7) 0%, transparent 100%),
                  radial-gradient(circle 5px at 50% 50%, rgba(255,255,255,0.6) 0%, transparent 100%),
                  radial-gradient(circle 3px at 75% 60%, rgba(255,255,255,0.7) 0%, transparent 100%),
                  radial-gradient(circle 3.5px at 35% 40%, rgba(255,255,255,0.5) 0%, transparent 100%),
                  radial-gradient(circle 4px at 65% 35%, rgba(255,255,255,0.6) 0%, transparent 100%),
                  radial-gradient(circle 2.5px at 85% 45%, rgba(255,255,255,0.5) 0%, transparent 100%)
                `
              }} />
            </div>
            {/* Foam drip left */}
            <div className="absolute -left-[3px] top-[28px] w-[8px] h-[14px] bg-[#FFF8E1] border-2 border-ink border-t-0 border-l-3 rounded-b-full animate-foam-appear" />
            {/* Foam drip right */}
            <div className="absolute -right-[3px] top-[24px] w-[6px] h-[10px] bg-[#FFF8E1] border-2 border-ink border-t-0 border-r-3 rounded-b-full animate-foam-appear" />
            {/* Handle - thick with rounded shape */}
            <div className="absolute -right-[30px] top-[22px] w-[26px] h-[62px] border-3 border-ink border-l-0 rounded-[0_14px_14px_0] bg-[#FFF8E1] shadow-[2px_2px_0_#171717]">
              <div className="absolute inset-[4px] left-0 border-2 border-ink/10 rounded-[0_8px_8px_0]" />
            </div>
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
