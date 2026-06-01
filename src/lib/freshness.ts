export type FreshnessLevel = 'verified' | 'unknown'
export type PriceRecencyTier = 'fresh' | 'aging' | 'stale' | 'unknown'

export interface FreshnessInfo {
  level: FreshnessLevel
  label: string
  daysAgo: number | null
  color: string
  bgColor: string
  borderColor: string
}

export interface PriceRecencyInfo {
  tier: PriceRecencyTier
  daysAgo: number | null
  label: string
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

function checkedLabel(daysAgo: number): string {
  if (daysAgo === 0) return 'Checked today'
  if (daysAgo === 1) return 'Checked yesterday'
  return `Checked ${daysAgo}d ago`
}

export function getPriceRecency(lastVerified: string | null | undefined, now = new Date()): PriceRecencyInfo {
  if (!lastVerified) {
    return { tier: 'unknown', daysAgo: null, label: 'Not checked yet' }
  }

  const verified = new Date(lastVerified)
  const verifiedTime = verified.getTime()

  if (!Number.isFinite(verifiedTime)) {
    return { tier: 'unknown', daysAgo: null, label: 'Not checked yet' }
  }

  const daysAgo = Math.max(0, Math.floor((now.getTime() - verifiedTime) / MS_PER_DAY))
  const label = checkedLabel(daysAgo)

  if (daysAgo < 30) {
    return { tier: 'fresh', daysAgo, label }
  }

  if (daysAgo <= 90) {
    return { tier: 'aging', daysAgo, label }
  }

  return { tier: 'stale', daysAgo, label }
}

export function getFreshness(lastVerified: string | null): FreshnessInfo {
  if (!lastVerified) {
    return {
      level: 'unknown',
      label: 'Unverified',
      daysAgo: null,
      color: 'text-gray-mid',
      bgColor: 'bg-off-white',
      borderColor: 'border-gray-light',
    }
  }

  const now = new Date()
  const verified = new Date(lastVerified)
  const diffMs = now.getTime() - verified.getTime()
  const daysAgo = Math.floor(diffMs / MS_PER_DAY)

  return {
    level: 'verified',
    label: 'Verified',
    daysAgo,
    color: 'text-green',
    bgColor: 'bg-green-pale',
    borderColor: 'border-green',
  }
}

export function formatVerifiedDate(lastVerified: string | null): string {
  if (!lastVerified) return 'Never verified'
  const date = new Date(lastVerified)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const daysAgo = Math.floor(diffMs / MS_PER_DAY)

  if (daysAgo === 0) return 'Verified today'
  if (daysAgo === 1) return 'Verified yesterday'
  if (daysAgo < 7) return `Verified ${daysAgo}d ago`
  if (daysAgo < 30) return `Verified ${Math.floor(daysAgo / 7)}w ago`
  return `Verified ${date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}`
}
