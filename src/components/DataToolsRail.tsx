import Link from 'next/link'
import { BarChart3, Building2, CalendarDays, Map, Moon } from 'lucide-react'
import { DISCOVER_DATA_TOOL_LINKS } from '@/lib/internalLinks'

const ICONS = {
  chart: BarChart3,
  calendar: CalendarDays,
  moon: Moon,
  map: Map,
  venue: Building2,
} as const

export default function DataToolsRail() {
  return (
    <section id="data-tools" aria-labelledby="data-tools-title" className="mb-10 sm:mb-14 scroll-mt-6">
      <h2 id="data-tools-title" className="type-section">Data &amp; Tools</h2>
      <p className="mt-1 mb-6 text-sm text-gray-mid">Start with the numbers, then drill down.</p>

      <div className="grid gap-3 sm:grid-cols-2">
        {DISCOVER_DATA_TOOL_LINKS.map((item, index) => {
          const Icon = ICONS[item.icon]
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex min-h-[92px] items-center gap-4 rounded-card border-3 border-ink p-4 no-underline shadow-hard-sm transition-all hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-hard-hover ${
                index === DISCOVER_DATA_TOOL_LINKS.length - 1
                  ? 'bg-amber-pale sm:col-span-2'
                  : 'bg-white'
              }`}
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-pill border-2 border-ink bg-off-white">
                <Icon className="h-5 w-5 text-amber" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block font-mono text-[0.82rem] font-extrabold text-ink transition-colors group-hover:text-amber">
                  {item.title}
                </span>
                <span className="mt-1 block text-[0.72rem] leading-snug text-gray-mid">
                  {item.description}
                </span>
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
