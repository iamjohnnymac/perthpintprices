import { teamColours } from '@/lib/worldCup'

/**
 * Flag-colour stripe band for a fixture card: home team's colours on the
 * left half, away team's on the right, split by an ink divider. Colours are
 * data, not theme, so they're inline styles rather than Tailwind tokens.
 */
export default function TeamStripes({ home, away }: { home: string; away: string }) {
  return (
    <div aria-hidden="true" className="flex h-2.5 border-b-2 border-ink">
      <div className="flex flex-1">
        {teamColours(home).map((colour, index) => (
          <div key={`${colour}-${index}`} className="flex-1" style={{ backgroundColor: colour }} />
        ))}
      </div>
      <div className="w-[3px] bg-ink" />
      <div className="flex flex-1">
        {teamColours(away).map((colour, index) => (
          <div key={`${colour}-${index}`} className="flex-1" style={{ backgroundColor: colour }} />
        ))}
      </div>
    </div>
  )
}
