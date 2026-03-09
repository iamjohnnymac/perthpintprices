export type PriceLabelType = 'bargain' | 'fair' | 'pricey' | null

export function getPriceLabel(price: number | null, avgPrice: number = 9.20): { label: string; type: PriceLabelType } {
  if (price === null) return { label: '', type: null }

  if (price < avgPrice * 0.85) return { label: 'BARGAIN', type: 'bargain' }
  if (price <= avgPrice * 1.15) return { label: 'FAIR', type: 'fair' }
  return { label: 'PRICEY', type: 'pricey' }
}

export function getPriceDiff(price: number | null, avgPrice: number = 9.20): string {
  if (price === null) return ''
  const diff = price - avgPrice
  if (Math.abs(diff) < 0.05) return 'At avg'
  return diff < 0 ? `$${Math.abs(diff).toFixed(2)} below avg` : `$${diff.toFixed(2)} above avg`
}

export function getPriceLabelColors(type: PriceLabelType): { bg: string; text: string; border: string } {
  switch (type) {
    case 'bargain': return { bg: 'bg-amber-pale', text: 'text-ink', border: 'border-amber/30' }
    case 'fair': return { bg: 'bg-amber-pale', text: 'text-amber', border: 'border-amber/30' }
    case 'pricey': return { bg: 'bg-red-pale', text: 'text-red', border: 'border-red/30' }
    default: return { bg: 'bg-off-white', text: 'text-gray-mid', border: 'border-gray' }
  }
}
