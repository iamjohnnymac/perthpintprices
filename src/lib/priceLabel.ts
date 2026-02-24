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
    case 'bargain': return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' }
    case 'fair': return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' }
    case 'pricey': return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' }
    default: return { bg: 'bg-stone-50', text: 'text-stone-500', border: 'border-stone-200' }
  }
}
