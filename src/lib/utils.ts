import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import type { Pub } from "@/types/pub"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function groupPubsBySuburb(pubs: Pub[]): Record<string, Pub[]> {
  // Object.groupBy only creates keys for present pubs, so each key maps to a non-empty Pub[] despite its Partial typing.
  return Object.assign({}, Object.groupBy(pubs, (pub) => pub.suburb)) as Record<string, Pub[]>
}
