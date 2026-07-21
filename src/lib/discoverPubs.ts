import type { Pub } from '@/types/pub'
import { isCanonicalPubLinkEligible } from '@/lib/internalLinks'
import { slimPubForFeature, type FeatureSlimPub } from '@/lib/pubPhoto'

export function prepareDiscoverPubs(pubs: Pub[]): FeatureSlimPub[] {
  return pubs
    .filter(isCanonicalPubLinkEligible)
    .map(slimPubForFeature)
}
