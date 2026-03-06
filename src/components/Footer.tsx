import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t-3 border-ink max-w-container mx-auto px-6 py-8 pb-12 text-center">
      <div className="flex justify-center gap-6 mb-5 flex-wrap">
        {[
          { href: '/happy-hour', label: 'Happy Hours' },
          { href: '/pub-golf', label: 'Pub Golf' },
          { href: '/pint-crawl', label: 'Pint Crawl' },
          { href: '/leaderboard', label: 'Leaderboard' },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.06em] text-gray-mid hover:text-amber transition-colors no-underline"
          >
            {link.label}
          </Link>
        ))}
      </div>
      <p className="text-[0.75rem] text-gray-mid leading-relaxed max-w-[400px] mx-auto mb-4">
        Prices are community-submitted and may vary. Drink responsibly.
      </p>
      <p className="font-display text-[0.9rem] italic text-gray-mid">
        Made in Perth
      </p>
    </footer>
  )
}
