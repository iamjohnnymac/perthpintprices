import { createHmac } from 'node:crypto'

export const ANDREW_DEMO_RESERVED_SLUG = '__ai-demo-no-write__'
export const ANDREW_DEMO_ACTIVE_LOCK_ID = '__ai-demo-active-call__'
export const ANDREW_DEMO_CALL_KIND = 'ai_demo_test_call'

export const ANDREW_DEMO_ACTIVE_STATUSES = new Set([
  'ai_demo_reserving',
  'ai_demo_initiated',
  'ai_demo_in_progress',
  'ai_demo_processing',
])

export interface AndrewDemoMetadata {
  kind: typeof ANDREW_DEMO_CALL_KIND
  agent_id: string
  destination_mask: string
  destination_hash: string
  conversation_id?: string
  status: string
}

export function hashAndrewDemoDestination(phone: string, key: string): string {
  return createHmac('sha256', key).update(phone).digest('hex')
}

export function createAndrewDemoMetadata(
  identity: Pick<AndrewDemoMetadata, 'agent_id' | 'destination_mask' | 'destination_hash'>,
  status: string,
  conversationId?: string,
): AndrewDemoMetadata {
  return {
    kind: ANDREW_DEMO_CALL_KIND,
    ...identity,
    ...(conversationId ? { conversation_id: conversationId } : {}),
    status,
  }
}

export function parseAndrewDemoMetadata(value: string | null): AndrewDemoMetadata | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as Partial<AndrewDemoMetadata>
    if (
      parsed.kind !== ANDREW_DEMO_CALL_KIND
      || typeof parsed.agent_id !== 'string'
      || typeof parsed.destination_mask !== 'string'
      || typeof parsed.destination_hash !== 'string'
      || typeof parsed.status !== 'string'
    ) return null
    return parsed as AndrewDemoMetadata
  } catch {
    return null
  }
}

export function isAndrewDemoCall(pubSlug: string | null, agentId: string, demoAgentId?: string) {
  return pubSlug === ANDREW_DEMO_RESERVED_SLUG || (!!demoAgentId && agentId === demoAgentId)
}

export function andrewDemoArchiveId(conversationId: string, status: string) {
  const terminalStatus = status === 'done' ? 'done' : 'failed'
  return `ai-demo-${terminalStatus}-${conversationId}`
}
