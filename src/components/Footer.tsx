import Link from 'next/link'

const NAV_LINKS = [
  { href: '/discover', label: 'Discover' },
  { href: '/happy-hour', label: 'Happy Hours' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/suburbs', label: 'Suburbs' },
  { href: '/weekly-report', label: 'Pint Report' },
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

        {/* Social links */}
        <div className="flex items-center gap-5 mb-8">
          {[
            { href: 'https://instagram.com/arvopints', label: 'Instagram', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg> },
            { href: 'https://x.com/arvopints', label: 'X', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
            { href: 'https://tiktok.com/@arvopints', label: 'TikTok', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.98a8.18 8.18 0 004.77 1.52V7.05a4.84 4.84 0 01-1-.36z"/></svg> },
            { href: 'https://facebook.com/arvopints', label: 'Facebook', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
          ].map(({ href, label, icon }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="text-white/40 hover:text-amber-light transition-colors">
              {icon}
            </a>
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
