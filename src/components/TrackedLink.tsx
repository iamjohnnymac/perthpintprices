'use client'

import Link from 'next/link'
import type { ComponentProps, MouseEventHandler } from 'react'
import { trackSiteEvent, type AnalyticsProperties } from '@/lib/analytics'

type TrackedLinkProps = Omit<ComponentProps<typeof Link>, 'onClick'> & {
  eventName: string
  eventProperties?: AnalyticsProperties
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

export default function TrackedLink({
  eventName,
  eventProperties,
  onClick,
  ...props
}: TrackedLinkProps) {
  const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
    trackSiteEvent(eventName, eventProperties)
    onClick?.(event)
  }

  return <Link {...props} onClick={handleClick} />
}
