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
      <section className="text-center px-6 pt-8 pb-10 max-w-container mx-auto">
        {/* Beer glass illustration */}
        <div className="w-[100px] h-[120px] mx-auto mb-7 relative">
          <div className="w-[70px] h-[95px] mx-auto relative border-3 border-ink rounded-[4px_4px_8px_8px] shadow-hard overflow-hidden"
               style={{ background: 'linear-gradient(180deg, #F5D98A 0%, #D4A030 45%, #C4880A 100%)' }}>
            {/* Foam */}
            <div className="absolute -top-[8px] -left-[3px] -right-[3px] h-[28px] bg-[#FFFEF0] rounded-[18px_18px_40%_40%] border-3 border-ink border-b-0" />
            {/* Handle */}
            <div className="absolute -right-[20px] top-[18px] w-[18px] h-[42px] border-3 border-ink border-l-0 rounded-[0_10px_10px_0] bg-white" />
          </div>
        </div>

        <h1 className="font-mono text-[clamp(2.4rem,7vw,3.2rem)] font-extrabold leading-[1.05] tracking-[-0.04em] text-ink mb-3">
          Perth&apos;s pints,<br />
          <span className="text-amber">sorted.</span>
        </h1>
        <p className="font-body text-[0.95rem] text-gray-mid font-medium">
          Every pub. Every price. Updated weekly.
        </p>
      </section>

      {/* Stat strip */}
      <div className="max-w-container mx-auto px-6 pb-8 flex gap-2.5 justify-center flex-wrap">
        <div className="border-3 border-ink rounded-card px-5 py-3.5 text-center min-w-[100px] bg-white shadow-hard-sm">
          <span className="font-mono text-[1.6rem] font-extrabold tracking-[-0.02em] block leading-[1.1]">{venueCount}</span>
          <span className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.08em] text-gray-mid block mt-0.5">Venues</span>
        </div>
        <div className="border-3 border-ink rounded-card px-5 py-3.5 text-center min-w-[100px] bg-white shadow-hard-sm">
          <span className="font-mono text-[1.6rem] font-extrabold tracking-[-0.02em] block leading-[1.1]">{suburbCount}</span>
          <span className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.08em] text-gray-mid block mt-0.5">Suburbs</span>
        </div>
        <div className="border-3 border-ink rounded-card px-5 py-3.5 text-center min-w-[100px] bg-amber shadow-hard-sm">
          <span className="font-mono text-[1.6rem] font-extrabold tracking-[-0.02em] block leading-[1.1] text-white">${cheapest}</span>
          <span className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.08em] text-white/80 block mt-0.5">Cheapest</span>
        </div>
      </div>
    </>
  )
}
