import Link from 'next/link'

const NAV_LINKS = [
  { href: '/discover', label: 'Discover' },
  { href: '/happy-hour', label: 'Happy Hours' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/suburbs', label: 'Suburbs' },
  { href: '/pint-crawl', label: 'Pint Crawl' },
  { href: '/weekly-report', label: 'Pint Report' },
  { href: '/pub-golf', label: 'Pub Golf' },
]

const GLASS_SIZES = [
  { name: 'Middy', ml: '285ml' },
  { name: 'Schooner', ml: '425ml' },
  { name: 'Pint', ml: '570ml' },
]

export default function Footer() {
  return (
    <footer className="bg-ink text-white">
      <div className="max-w-container mx-auto px-6 py-10 pb-14">
        {/* Logo + tagline */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-7 h-7 bg-amber border-2 border-white/30 rounded-md flex items-center justify-center shadow-[2px_2px_0_rgba(255,255,255,0.15)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
          </div>
          <span className="font-mono text-[1.4rem] font-extrabold tracking-[-0.04em]">arvo</span>
        </div>

        {/* Nav links — single clean row that wraps */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.06em] text-white/50 hover:text-amber-light transition-colors no-underline"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Beer sizes — compact inline reference */}
        <div className="flex items-center gap-4 mb-8">
          <span className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.12em] text-white/30">Glass sizes</span>
          {GLASS_SIZES.map((size) => (
            <span key={size.name} className="font-mono text-[0.65rem] text-white/50">
              <span className="font-bold text-white/70">{size.name}</span> {size.ml}
            </span>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-[0.75rem] text-white/40 leading-relaxed max-w-[400px]">
            Prices are community-submitted and may vary. Drink responsibly.
          </p>
          <p className="font-display text-[1rem] italic text-white/60">
            Made in Perth
          </p>
        </div>
      </div>
    </footer>
  )
}
