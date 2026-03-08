export type FreshnessLevel = 'fresh' | 'aging' | 'stale' | 'unknown'

export interface FreshnessInfo {
  level: FreshnessLevel
  label: string
  daysAgo: number | null
  color: string
  bgColor: string
  borderColor: string
  icon: string
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
      icon: '-',
    }
  }

  const now = new Date()
  const verified = new Date(lastVerified)
  const diffMs = now.getTime() - verified.getTime()
  const daysAgo = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (daysAgo <= 14) {
    return {
      level: 'fresh',
      label: 'Fresh',
      daysAgo,
      color: 'text-green',
      bgColor: 'bg-green-pale',
      borderColor: 'border-green',
      icon: '●',
    }
  }

  if (daysAgo <= 21) {
    return {
      level: 'aging',
      label: 'Aging',
      daysAgo,
      color: 'text-amber',
      bgColor: 'bg-amber-pale',
      borderColor: 'border-amber',
      icon: '◐',
    }
  }

  return {
    level: 'stale',
    label: 'Stale',
    daysAgo,
    color: 'text-red',
    bgColor: 'bg-red-pale',
    borderColor: 'border-red',
    icon: '○',
  }
}

export function formatVerifiedDate(lastVerified: string | null): string {
  if (!lastVerified) return 'Never verified'
  const date = new Date(lastVerified)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const daysAgo = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (daysAgo === 0) return 'Verified today'
  if (daysAgo === 1) return 'Verified yesterday'
  if (daysAgo < 7) return `Verified ${daysAgo}d ago`
  if (daysAgo < 30) return `Verified ${Math.floor(daysAgo / 7)}w ago`
  return `Verified ${date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}`
}
