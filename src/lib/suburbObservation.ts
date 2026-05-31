// Picks the single strongest *real* signal for a suburb lead line, by priority:
// happy-hour density → price spread → thin-data fallback. Renders only from real
// stats, never a stock phrase — so the line is always backed by data (anti-corny,
// anti-sameness). Returns null when there's nothing true and specific to say.

export interface SuburbStats {
  /** Pubs in the suburb with a happy hour running right now. */
  happyHourNowCount: number
  /** Verified pint prices in the suburb (one per priced pub). */
  verifiedPrices: number[]
  /** Total pubs tracked in the suburb. */
  pubCount: number
}

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']

function spell(n: number, capitalised = false): string {
  if (n < 0 || n > 9) return String(n)
  const word = NUMBER_WORDS[n]
  return capitalised ? word[0].toUpperCase() + word.slice(1) : word
}

export function suburbObservation(stats: SuburbStats): string | null {
  const { happyHourNowCount, verifiedPrices, pubCount } = stats

  // 1. Happy-hour density — the strongest, most time-sensitive signal.
  if (happyHourNowCount >= 2) {
    return `${spell(happyHourNowCount, true)} have a happy hour on right now.`
  }

  // 2. Price spread — needs enough verified prices to be meaningful.
  if (verifiedPrices.length >= 4) {
    const sorted = [...verifiedPrices].sort((a, b) => a - b)
    const p25 = sorted[Math.floor((sorted.length - 1) * 0.25)]
    const p75 = sorted[Math.floor((sorted.length - 1) * 0.75)]
    if (p75 - p25 <= 2) {
      return `Prices run tight here — most sit between $${p25.toFixed(2)} and $${p75.toFixed(2)}.`
    }
    return `Prices range from $${sorted[0].toFixed(2)} to $${sorted[sorted.length - 1].toFixed(2)} across the suburb.`
  }

  // 3. Thin data — honest about coverage, feeds the report-a-price loop.
  if (verifiedPrices.length > 0 && verifiedPrices.length < pubCount) {
    const n = verifiedPrices.length
    return `Only ${spell(n)} ${n === 1 ? 'has' : 'have'} a verified price so far, so this list will grow.`
  }

  return null
}
