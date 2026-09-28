import type { DataCollection } from '@sentry/core'
import type { ErrorEvent } from '@sentry/nextjs'

export const sentryDataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: {
    request: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
    response: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
  },
  httpBodies: [],
  urlQueryParams: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  queues: false,
  graphQL: { document: false, variables: false },
  stackFrameVariables: false,
} satisfies DataCollection

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
