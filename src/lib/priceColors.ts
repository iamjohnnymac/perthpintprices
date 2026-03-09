export function getPriceColor(price: number | null): string {
  if (price === null) return 'from-gray-mid to-gray-mid'
  if (price <= 7) return 'from-amber to-amber'
  if (price <= 8) return 'from-amber to-amber'
  if (price <= 9) return 'from-amber to-amber'
  return 'from-ink-light to-ink'
}

export function getPriceBgColor(price: number | null): string {
  if (price === null) return 'bg-gray-mid'
  if (price <= 7) return 'bg-amber'
  if (price <= 8) return 'bg-amber'
  if (price <= 9) return 'bg-amber'
  return 'bg-ink-light'
}

export function getPriceTextColor(price: number | null): string {
  if (price === null) return 'text-gray-mid'
  return 'text-ink'
}

export function getDirectionsUrl(pub: { name: string; address: string }): string {
  const query = encodeURIComponent(`${pub.name}, ${pub.address}`)
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`
}

export function formatLastUpdated(dateStr: string | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })
}
