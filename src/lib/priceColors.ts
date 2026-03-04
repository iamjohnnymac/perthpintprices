export function getPriceColor(price: number | null): string {
  if (price === null) return 'from-stone-400 to-stone-500'
  if (price <= 7) return 'from-amber-600 to-amber-700'
  if (price <= 8) return 'from-amber-500 to-amber-600'
  if (price <= 9) return 'from-amber to-amber-dark'
  return 'from-stone-600 to-stone-700'
}

export function getPriceBgColor(price: number | null): string {
  if (price === null) return 'bg-stone-400'
  if (price <= 7) return 'bg-amber-700'
  if (price <= 8) return 'bg-amber-600'
  if (price <= 9) return 'bg-amber-dark'
  return 'bg-stone-600'
}

export function getPriceTextColor(price: number | null): string {
  if (price === null) return 'text-stone-400'
  return 'text-charcoal'
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
