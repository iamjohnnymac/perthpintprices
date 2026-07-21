/**
 * The one indexing decision for suburb directory pages.
 *
 * A page is useful when it lists at least one legitimate venue. Price state is
 * deliberately not an input: an honest TBC directory still helps a visitor
 * find that venue and report a price. `legitimatePubCount` must therefore be
 * calculated only after independently confirmed closures and invalid rows have
 * been excluded.
 */
export interface SuburbIndexabilityInput {
  legitimatePubCount: number
}

export interface SuburbIndexability {
  isIndexable: boolean
}

export function getSuburbIndexability({ legitimatePubCount }: SuburbIndexabilityInput): SuburbIndexability {
  return { isIndexable: legitimatePubCount > 0 }
}
