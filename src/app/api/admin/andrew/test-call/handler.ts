import { createHmac, randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { authenticateAdminRequest, type AdminAuthResult } from '@/lib/adminAuth'
import { AI_DEMO_RESERVED_SLUG } from '@/app/api/agents/record-price/[slug]/handler'

const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1/convai'
const ACTIVE_LOCK_ID = '__ai-demo-active-call__'
const CALL_KIND = 'ai_demo_test_call'
const COOLDOWN_MS = 15 * 60 * 1000
const ACTIVE_TTL_MS = 20 * 60 * 1000
const CONVERSATION_ID_PATTERN = /^[A-Za-z0-9_-]{8,160}$/
const ACTIVE_STATUSES = new Set([
  'ai_demo_reserving',
  'ai_demo_initiated',
  'ai_demo_in_progress',
  'ai_demo_processing',
])

interface DemoConfig {
  apiKey: string
  agentId: string
  phoneNumberId: string
  destination: string
  destinationMask: string
}

interface DemoMetadata {
  kind: typeof CALL_KIND
  agent_id: string
  destination_mask: string
  destination_hash: string
  conversation_id?: string
  status: string
}

interface DemoLogRow {
  call_sid: string | null
  parsed_confidence: string | null
  parsed_notes: string | null
  created_at: string | null
}

interface AndrewTestCallDeps {
  authenticate?: (request: NextRequest) => Promise<AdminAuthResult>
  getServiceClient?: () => SupabaseClient
  fetchFn?: typeof fetch
  now?: Date
  reservationId?: string
}

type Availability =
  | { state: 'ready'; retryAfterSeconds: 0 }
  | { state: 'active'; retryAfterSeconds: number; conversationId: string | null }
  | { state: 'cooldown'; retryAfterSeconds: number }

function json(body: unknown, init?: { status?: number; headers?: HeadersInit }) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      'Cache-Control': 'no-store',
      ...(init?.headers || {}),
    },
  })
}

function demoConfig(): DemoConfig | null {
  const apiKey = process.env.ELEVENLABS_API_KEY
  const agentId = process.env.ELEVENLABS_DEMO_AGENT_ID
  const productionAgentId = process.env.ELEVENLABS_AGENT_ID
  const phoneNumberId = process.env.ELEVENLABS_PHONE_NUMBER_ID
  const destination = process.env.AI_DEMO_TEST_PHONE_E164

  if (!apiKey || !agentId || !phoneNumberId || !destination) return null
  if (productionAgentId && productionAgentId === agentId) return null
  if (!/^\+[1-9]\d{7,14}$/.test(destination)) return null

  return {
    apiKey,
    agentId,
    phoneNumberId,
    destination,
    destinationMask: maskPhone(destination),
  }
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  const country = phone.startsWith('+61') ? '+61' : '+••'
  return `${country} ••• ••• ${digits.slice(-3)}`
}

function destinationHash(phone: string, key: string): string {
  return createHmac('sha256', key).update(phone).digest('hex')
}

function metadataFor(config: DemoConfig, status: string, conversationId?: string): DemoMetadata {
  return {
    kind: CALL_KIND,
    agent_id: config.agentId,
    destination_mask: config.destinationMask,
    destination_hash: destinationHash(config.destination, config.apiKey),
    ...(conversationId ? { conversation_id: conversationId } : {}),
    status,
  }
}

function parseDemoMetadata(value: string | null): DemoMetadata | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as Partial<DemoMetadata>
    if (
      parsed.kind !== CALL_KIND
      || typeof parsed.agent_id !== 'string'
      || typeof parsed.destination_mask !== 'string'
      || typeof parsed.destination_hash !== 'string'
      || typeof parsed.status !== 'string'
    ) return null
    return parsed as DemoMetadata
  } catch {
    return null
  }
}

async function authenticate(request: NextRequest, deps: AndrewTestCallDeps) {
  if (deps.authenticate) return deps.authenticate(request)
  return authenticateAdminRequest(request, { getServiceClient: deps.getServiceClient })
}

async function recentDemoRows(supabase: SupabaseClient, now: Date) {
  const cutoff = new Date(now.getTime() - ACTIVE_TTL_MS).toISOString()
  const { data, error } = await supabase
    .from('phone_call_log')
    .select('call_sid, parsed_confidence, parsed_notes, created_at')
    .is('pub_id', null)
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false })
    .limit(50)

  return { rows: (data || []) as DemoLogRow[], error }
}

function availabilityFor(rows: DemoLogRow[], config: DemoConfig, now: Date): Availability {
  const owned = rows
    .map(row => ({ row, metadata: parseDemoMetadata(row.parsed_notes) }))
    .filter((entry): entry is { row: DemoLogRow; metadata: DemoMetadata } => (
      entry.metadata?.agent_id === config.agentId
      && entry.metadata.destination_hash === destinationHash(config.destination, config.apiKey)
    ))
    .map(entry => ({ ...entry, createdAt: Date.parse(entry.row.created_at || '') }))
    .filter(entry => Number.isFinite(entry.createdAt))
    .sort((a, b) => b.createdAt - a.createdAt)

  const active = owned.find(entry => (
    ACTIVE_STATUSES.has(entry.row.parsed_confidence || '')
    && now.getTime() - entry.createdAt < ACTIVE_TTL_MS
  ))
  if (active) {
    return {
      state: 'active',
      retryAfterSeconds: Math.max(1, Math.ceil((ACTIVE_TTL_MS - (now.getTime() - active.createdAt)) / 1000)),
      conversationId: active.row.call_sid === ACTIVE_LOCK_ID ? null : active.row.call_sid,
    }
  }

  const latest = owned[0]
  if (latest && now.getTime() - latest.createdAt < COOLDOWN_MS) {
    return {
      state: 'cooldown',
      retryAfterSeconds: Math.max(1, Math.ceil((COOLDOWN_MS - (now.getTime() - latest.createdAt)) / 1000)),
    }
  }

  return { state: 'ready', retryAfterSeconds: 0 }
}

async function reservedSlugIsAbsent(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('pubs')
    .select('id')
    .eq('slug', AI_DEMO_RESERVED_SLUG)
    .maybeSingle()
  return { absent: !data, error }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

async function parseResponse(response: Response): Promise<Record<string, unknown>> {
  try {
    const parsed = await response.json()
    return isRecord(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

async function releaseReservation(
  supabase: SupabaseClient,
  config: DemoConfig,
  failureId: string,
) {
  await supabase
    .from('phone_call_log')
    .update({
      call_sid: failureId,
      parsed_confidence: 'ai_demo_failed',
      parsed_notes: JSON.stringify(metadataFor(config, 'failed')),
    })
    .eq('call_sid', ACTIVE_LOCK_ID)
}

export async function handleAndrewTestCallPost(request: NextRequest, deps: AndrewTestCallDeps = {}) {
  const auth = await authenticate(request, deps)
  if (!auth.authenticated) return auth.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ ok: false, error: 'Invalid request.' }, { status: 400 })
  }

  if (!isRecord(body) || Object.keys(body).length !== 1 || body.consent !== true) {
    return json({ ok: false, error: 'Explicit consent is required. Only the consent field is accepted.' }, { status: 400 })
  }

  const config = demoConfig()
  if (!config) {
    return json({ ok: false, error: 'Owner test calling is not configured.' }, { status: 503 })
  }

  const reservedSlug = await reservedSlugIsAbsent(auth.supabase)
  if (reservedSlug.error) {
    return json({ ok: false, error: 'Could not confirm the no-write guard.' }, { status: 503 })
  }
  if (!reservedSlug.absent) {
    return json({ ok: false, error: 'The no-write guard conflicts with a live venue.' }, { status: 409 })
  }

  const now = deps.now ?? new Date()
  const recent = await recentDemoRows(auth.supabase, now)
  if (recent.error) {
    return json({ ok: false, error: 'Could not check call availability.' }, { status: 503 })
  }

  const availability = availabilityFor(recent.rows, config, now)
  if (availability.state === 'active') {
    return json(
      { ok: false, error: 'An owner test call is already active.', availability },
      { status: 409, headers: { 'Retry-After': String(availability.retryAfterSeconds) } },
    )
  }
  if (availability.state === 'cooldown') {
    return json(
      { ok: false, error: 'The owner test call is cooling down.', availability },
      { status: 429, headers: { 'Retry-After': String(availability.retryAfterSeconds) } },
    )
  }

  const reservationId = deps.reservationId ?? randomUUID()
  const { error: reservationError } = await auth.supabase.from('phone_call_log').insert({
    pub_id: null,
    call_sid: ACTIVE_LOCK_ID,
    transcript: null,
    recording_url: null,
    parsed_price: null,
    parsed_beer_type: null,
    parsed_confidence: 'ai_demo_reserving',
    parsed_notes: JSON.stringify(metadataFor(config, 'reserving')),
  })
  if (reservationError) {
    const status = reservationError.code === '23505' ? 409 : 503
    return json({ ok: false, error: status === 409 ? 'An owner test call is already active.' : 'Could not reserve the test call.' }, { status })
  }

  const outboundPayload = {
    agent_id: config.agentId,
    agent_phone_number_id: config.phoneNumberId,
    to_number: config.destination,
    conversation_initiation_client_data: {
      dynamic_variables: {
        pub_slug: AI_DEMO_RESERVED_SLUG,
        pub_name: 'Perth Pint Prices owner test',
        suburb: 'Perth',
        last_price: '',
        demo_mode: 'owner_sandbox',
      },
    },
    call_recording_enabled: false,
    telephony_call_config: { ring_timeout: 25 },
  }

  let vendorResponse: Response
  try {
    vendorResponse = await (deps.fetchFn ?? fetch)(`${ELEVENLABS_BASE_URL}/twilio/outbound-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'xi-api-key': config.apiKey },
      body: JSON.stringify(outboundPayload),
    })
  } catch {
    await releaseReservation(auth.supabase, config, `ai-demo-failed-${reservationId}`)
    return json({ ok: false, error: 'The call provider could not be reached.' }, { status: 502 })
  }

  const vendorBody = await parseResponse(vendorResponse)
  const conversationId = typeof vendorBody.conversation_id === 'string' ? vendorBody.conversation_id : null
  if (!vendorResponse.ok || vendorBody.success !== true || !conversationId || !CONVERSATION_ID_PATTERN.test(conversationId)) {
    await releaseReservation(auth.supabase, config, `ai-demo-failed-${reservationId}`)
    return json({ ok: false, error: 'The call could not be started.' }, { status: 502 })
  }

  const { error: trackingError } = await auth.supabase
    .from('phone_call_log')
    .update({
      call_sid: conversationId,
      parsed_confidence: 'ai_demo_initiated',
      parsed_notes: JSON.stringify(metadataFor(config, 'initiated', conversationId)),
    })
    .eq('call_sid', ACTIVE_LOCK_ID)
  if (trackingError) {
    await releaseReservation(auth.supabase, config, `ai-demo-untracked-${reservationId}`)
    return json({ ok: false, error: 'The call started, but its status could not be tracked.' }, { status: 503 })
  }

  return json({
    ok: true,
    destination: { masked: config.destinationMask },
    conversation: { id: conversationId, status: 'initiated', terminal: false },
  })
}

function stringValue(value: unknown, maxLength: number): string | null {
  if (isRecord(value) && 'value' in value) return stringValue(value.value, maxLength)
  if (value == null) return null
  const text = String(value).trim()
  if (!text || text.toLowerCase() === 'null' || text.toLowerCase() === 'none') return null
  return text.slice(0, maxLength)
}

function numberValue(value: unknown): number | null {
  if (isRecord(value) && 'value' in value) return numberValue(value.value)
  const number = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''))
  return Number.isFinite(number) ? number : null
}

function structuredCapture(vendorBody: Record<string, unknown>) {
  const analysis = isRecord(vendorBody.analysis) ? vendorBody.analysis : {}
  const collection = isRecord(analysis.data_collection_results) ? analysis.data_collection_results : {}
  const capturedPrice = numberValue(collection.price)
  const unitCandidate = stringValue(collection.unit, 20)?.toLowerCase() || 'pint'
  const unit = unitCandidate === 'schooner' || unitCandidate === 'pot' ? unitCandidate : 'pint'
  const multiplier = unit === 'schooner' ? 570 / 425 : unit === 'pot' ? 570 / 285 : 1
  const normalizedPrice = capturedPrice == null ? null : Number((capturedPrice * multiplier).toFixed(2))
  const confidenceCandidate = stringValue(collection.confidence, 20)?.toLowerCase()
  const confidence = confidenceCandidate === 'high' || confidenceCandidate === 'medium' || confidenceCandidate === 'low'
    ? confidenceCandidate
    : null

  return {
    price: normalizedPrice != null && normalizedPrice >= 5 && normalizedPrice <= 20 ? normalizedPrice : null,
    beerType: stringValue(collection.beer_type, 100),
    unit,
    happyHour: stringValue(collection.happy_hour, 160),
    confidence,
  }
}

function redactTranscriptText(value: unknown, destination: string): string | null {
  const text = stringValue(value, 700)
  if (!text) return null
  const destinationDigits = destination.replace(/\D/g, '')
  return text
    .replace(destination, '[phone redacted]')
    .replace(destinationDigits, '[phone redacted]')
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[email redacted]')
    .replace(/(?:\+?\d[\s().-]*){8,}/g, '[phone redacted]')
}

function sanitizedTranscript(vendorBody: Record<string, unknown>, destination: string) {
  const transcript = Array.isArray(vendorBody.transcript) ? vendorBody.transcript : []
  return transcript.slice(0, 40).flatMap((entry) => {
    if (!isRecord(entry)) return []
    const role = entry.role === 'agent' ? 'Andrew' : entry.role === 'user' ? 'Owner' : null
    const message = redactTranscriptText(entry.message, destination)
    return role && message ? [{ role, message }] : []
  })
}

function sanitizedToolResult(vendorBody: Record<string, unknown>) {
  const transcript = Array.isArray(vendorBody.transcript) ? vendorBody.transcript : []
  for (const entry of transcript) {
    if (!isRecord(entry) || !Array.isArray(entry.tool_results)) continue
    for (const result of entry.tool_results) {
      if (!isRecord(result)) continue
      let value: unknown = result.result_value
      if (typeof value === 'string') {
        try { value = JSON.parse(value) } catch { continue }
      }
      if (!isRecord(value) || value.sandbox !== true) continue
      const proposed = isRecord(value.proposed) ? value.proposed : {}
      return {
        sandbox: true,
        recorded: false,
        proposed: {
          price: numberValue(proposed.pint_price),
          beerType: stringValue(proposed.beer_type, 100),
          happyHour: stringValue(proposed.happy_hour, 160),
          confidence: stringValue(proposed.confidence, 20),
        },
      }
    }
  }
  return null
}

function normalizedStatus(value: unknown) {
  return value === 'in-progress' || value === 'processing' || value === 'done' || value === 'failed'
    ? value
    : 'initiated'
}

async function ownedConversationRow(supabase: SupabaseClient, conversationId: string) {
  return supabase
    .from('phone_call_log')
    .select('call_sid, parsed_confidence, parsed_notes, created_at')
    .eq('call_sid', conversationId)
    .is('pub_id', null)
    .maybeSingle()
}

export async function handleAndrewTestCallGet(request: NextRequest, deps: AndrewTestCallDeps = {}) {
  const auth = await authenticate(request, deps)
  if (!auth.authenticated) return auth.response

  const config = demoConfig()
  if (!config) {
    return json({ ok: false, error: 'Owner test calling is not configured.' }, { status: 503 })
  }

  const conversationId = request.nextUrl.searchParams.get('conversation_id')
  if (!conversationId) {
    const now = deps.now ?? new Date()
    const recent = await recentDemoRows(auth.supabase, now)
    if (recent.error) return json({ ok: false, error: 'Could not check call availability.' }, { status: 503 })
    return json({
      ok: true,
      destination: { masked: config.destinationMask },
      availability: availabilityFor(recent.rows, config, now),
    })
  }

  if (!CONVERSATION_ID_PATTERN.test(conversationId)) {
    return json({ ok: false, error: 'Invalid conversation.' }, { status: 400 })
  }

  const { data: row, error: ownershipError } = await ownedConversationRow(auth.supabase, conversationId)
  const metadata = parseDemoMetadata((row as DemoLogRow | null)?.parsed_notes || null)
  if (
    ownershipError
    || !row
    || metadata?.agent_id !== config.agentId
    || metadata.destination_hash !== destinationHash(config.destination, config.apiKey)
    || metadata.conversation_id !== conversationId
  ) {
    return json({ ok: false, error: 'Conversation not found.' }, { status: 404 })
  }

  let vendorResponse: Response
  try {
    vendorResponse = await (deps.fetchFn ?? fetch)(`${ELEVENLABS_BASE_URL}/conversations/${encodeURIComponent(conversationId)}`, {
      headers: { 'xi-api-key': config.apiKey },
      cache: 'no-store',
    })
  } catch {
    return json({ ok: false, error: 'The call provider could not be reached.' }, { status: 502 })
  }

  const vendorBody = await parseResponse(vendorResponse)
  if (
    !vendorResponse.ok
    || vendorBody.conversation_id !== conversationId
    || vendorBody.agent_id !== config.agentId
  ) {
    return json({ ok: false, error: 'Conversation status could not be confirmed.' }, { status: 502 })
  }

  const status = normalizedStatus(vendorBody.status)
  const transcript = sanitizedTranscript(vendorBody, config.destination)
  const structured = structuredCapture(vendorBody)
  const toolResult = sanitizedToolResult(vendorBody)
  const terminal = status === 'done' || status === 'failed'
  const proposedListing = {
    price: toolResult?.proposed.price ?? structured.price,
    beerType: toolResult?.proposed.beerType ?? structured.beerType,
    happyHour: toolResult?.proposed.happyHour ?? structured.happyHour,
    confidence: toolResult?.proposed.confidence ?? structured.confidence,
  }

  const logStatus = `ai_demo_${status.replace('-', '_')}`
  const { error: updateError } = await auth.supabase
    .from('phone_call_log')
    .update({
      transcript: transcript.map(line => `${line.role}: ${line.message}`).join('\n') || null,
      parsed_price: proposedListing.price,
      parsed_beer_type: proposedListing.beerType,
      parsed_confidence: logStatus,
      parsed_notes: JSON.stringify(metadataFor(config, status, conversationId)),
    })
    .eq('call_sid', conversationId)
  if (updateError) console.error('[andrew demo] sanitized call status could not be persisted')

  return json({
    ok: true,
    destination: { masked: config.destinationMask },
    conversation: { id: conversationId, status, terminal },
    transcript,
    structured,
    toolResult,
    proposedListing,
  })
}
