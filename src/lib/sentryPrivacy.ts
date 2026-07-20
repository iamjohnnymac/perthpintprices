import type { ErrorEvent } from '@sentry/nextjs'

export function scrubSentryEvent(event: ErrorEvent): ErrorEvent {
  if (event.request?.headers) {
    delete event.request.headers.authorization
    delete event.request.headers.Authorization
    delete event.request.headers.cookie
    delete event.request.headers.Cookie
  }
  if (event.request) delete event.request.data
  if (event.user) {
    delete event.user.email
    delete event.user.ip_address
  }
  if (event.extra) {
    delete event.extra.transcript
    delete event.extra.rawBody
    delete event.extra.webhookBody
  }
  return event
}
