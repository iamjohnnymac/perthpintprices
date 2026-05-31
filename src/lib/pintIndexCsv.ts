export interface PintIndexCsvRow {
  snapshotDate: string
  averagePrice: number
  medianPrice: number
  minPrice: number
  maxPrice: number
  totalPubs: number
  totalSuburbs: number
  cheapestSuburb: string | null
  cheapestSuburbAverage: number | null
  mostExpensiveSuburb: string | null
  mostExpensiveSuburbAverage: number | null
}

const HEADERS = [
  'snapshot_date',
  'average_pint_price_aud',
  'median_pint_price_aud',
  'minimum_pint_price_aud',
  'maximum_pint_price_aud',
  'tracked_pubs',
  'tracked_suburbs',
  'cheapest_suburb',
  'cheapest_suburb_average_aud',
  'most_expensive_suburb',
  'most_expensive_suburb_average_aud',
]

const MONEY_COLUMN_INDEXES = new Set([1, 2, 3, 4, 8, 10])

function csvValue(value: string | number | null, decimals = false): string {
  if (value === null) return ''
  const text = typeof value === 'number'
    ? decimals ? value.toFixed(2) : String(value)
    : value
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function buildPintIndexCsv(rows: PintIndexCsvRow[]): string {
  const lines = [
    HEADERS.join(','),
    ...rows.map(row => [
      row.snapshotDate,
      row.averagePrice,
      row.medianPrice,
      row.minPrice,
      row.maxPrice,
      row.totalPubs,
      row.totalSuburbs,
      row.cheapestSuburb,
      row.cheapestSuburbAverage,
      row.mostExpensiveSuburb,
      row.mostExpensiveSuburbAverage,
    ].map((value, index) => csvValue(value, MONEY_COLUMN_INDEXES.has(index))).join(',')),
  ]

  return `${lines.join('\n')}\n`
}
