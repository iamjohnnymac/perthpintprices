import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { authenticateAdminRequest, type AdminAuthResult } from '@/lib/adminAuth'
import {
  ANDREW_DEMO_ACTIVE_LOCK_ID,
  ANDREW_DEMO_ACTIVE_STATUSES,
  ANDREW_DEMO_RESERVED_SLUG,
  andrewDemoArchiveId,
  createAndrewDemoMetadata,
  hashAndrewDemoDestination,
  parseAndrewDemoMetadata,
  type AndrewDemoMetadata,
} from '@/lib/andrewDemo'
import { normalizeVoicePintPrice, normalizeVoiceUnit } from '@/lib/voicePrice'
import { sanitizeVendorText } from '@/lib/vendorText'

const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1/convai'
const COOLDOWN_MS = 15 * 60 * 1000
const ACTIVE_TTL_MS = 20 * 60 * 1000
const CONVERSATION_ID_PATTERN = /^[A-Za-z0-9_-]{8,160}$/

interface DemoConfig {
  apiKey: string
  agentId: string
  phoneNumberId: string
  destination: string
  destinationMask: string
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

  if (!apiKey || !agentId || !productionAgentId || !phoneNumberId || !destination) return null
  if (productionAgentId === agentId) return null
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

function metadataFor(config: DemoConfig, status: string, conversationId?: string): AndrewDemoMetadata {
  return createAndrewDemoMetadata({
    agent_id: config.agentId,
    destination_mask: config.destinationMask,
    destination_hash: hashAndrewDemoDestination(config.destination, config.apiKey),
  }, status, conversationId)
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
    .map(row => ({ row, metadata: parseAndrewDemoMetadata(row.parsed_notes) }))
    .filter((entry): entry is { row: DemoLogRow; metadata: AndrewDemoMetadata } => (
      entry.metadata?.agent_id === config.agentId
      && entry.metadata.destination_hash === hashAndrewDemoDestination(config.destination, config.apiKey)
    ))
    .map(entry => ({ ...entry, createdAt: Date.parse(entry.row.created_at || '') }))
    .filter(entry => Number.isFinite(entry.createdAt))
    .sort((a, b) => b.createdAt - a.createdAt)

  const active = owned.find(entry => (
    ANDREW_DEMO_ACTIVE_STATUSES.has(entry.row.parsed_confidence || '')
    && now.getTime() - entry.createdAt < ACTIVE_TTL_MS
  ))
  if (active) {
    return {
      state: 'active',
      retryAfterSeconds: Math.max(1, Math.ceil((ACTIVE_TTL_MS - (now.getTime() - active.createdAt)) / 1000)),
      conversationId: active.metadata.conversation_id || null,
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
    .eq('slug', ANDREW_DEMO_RESERVED_SLUG)
    .maybeSingle()
  return { absent: !data, error }
}

async function releaseStaleReservation(
  supabase: SupabaseClient,
  config: DemoConfig,
  now: Date,
  reservationId: string,
) {
  const { data, error } = await supabase
    .from('phone_call_log')
    .select('call_sid, parsed_confidence, parsed_notes, created_at')
    .eq('call_sid', ANDREW_DEMO_ACTIVE_LOCK_ID)
    .is('pub_id', null)
    .maybeSingle()
  if (error) return { error, blocked: true }
  if (!data) return { error: null, blocked: false }

  const row = data as DemoLogRow
  const metadata = parseAndrewDemoMetadata(row.parsed_notes)
  const createdAt = Date.parse(row.created_at || '')
  const owned = metadata?.agent_id === config.agentId
    && metadata.destination_hash === hashAndrewDemoDestination(config.destination, config.apiKey)
  if (!owned || !Number.isFinite(createdAt) || now.getTime() - createdAt < ACTIVE_TTL_MS) {
    return { error: null, blocked: true }
  }

  const staleId = `ai-demo-stale-${reservationId}`
  const released = await supabase
    .from('phone_call_log')
    .update({
      call_sid: staleId,
      parsed_confidence: 'ai_demo_failed',
      parsed_notes: JSON.stringify(metadataFor(config, 'stale', metadata.conversation_id)),
    })
    .eq('call_sid', ANDREW_DEMO_ACTIVE_LOCK_ID)
    .eq('created_at', row.created_at)
  return { error: released.error, blocked: false }
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
    .eq('call_sid', ANDREW_DEMO_ACTIVE_LOCK_ID)
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
  const staleReservation = await releaseStaleReservation(auth.supabase, config, now, reservationId)
  if (staleReservation.error) {
    return json({ ok: false, error: 'Could not check the test-call lock.' }, { status: 503 })
  }
  if (staleReservation.blocked) {
    return json({ ok: false, error: 'An owner test call is already active.' }, { status: 409 })
  }

  const { error: reservationError } = await auth.supabase.from('phone_call_log').insert({
    pub_id: null,
    // The existing unique call_sid index makes this insert an atomic lock across
    // serverless instances. Keep the sentinel until the call reaches a terminal state.
    call_sid: ANDREW_DEMO_ACTIVE_LOCK_ID,
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
        pub_slug: ANDREW_DEMO_RESERVED_SLUG,
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
      parsed_confidence: 'ai_demo_initiated',
      parsed_notes: JSON.stringify(metadataFor(config, 'initiated', conversationId)),
    })
    .eq('call_sid', ANDREW_DEMO_ACTIVE_LOCK_ID)
  if (trackingError) {
    return json({ ok: false, error: 'The call started, but its status could not be tracked.' }, { status: 503 })
  }

  return json({
    ok: true,
    destination: { masked: config.destinationMask },
    conversation: { id: conversationId, status: 'initiated', terminal: false },
  })
}

function confidenceValue(value: unknown, destination: string) {
  const candidate = sanitizeVendorText(value, { destination, maxLength: 20 })?.toLowerCase()
  return candidate === 'high' || candidate === 'medium' || candidate === 'low' ? candidate : null
}

function structuredCapture(vendorBody: Record<string, unknown>, destination: string) {
  const analysis = isRecord(vendorBody.analysis) ? vendorBody.analysis : {}
  const collection = isRecord(analysis.data_collection_results) ? analysis.data_collection_results : {}
  const unit = normalizeVoiceUnit(collection.unit)

  return {
    price: normalizeVoicePintPrice(collection.price, collection.unit),
    beerType: sanitizeVendorText(collection.beer_type, { destination, maxLength: 100 }),
    unit,
    happyHour: sanitizeVendorText(collection.happy_hour, { destination, maxLength: 160 }),
    confidence: confidenceValue(collection.confidence, destination),
  }
}

function sanitizedTranscript(vendorBody: Record<string, unknown>, destination: string) {
  const transcript = Array.isArray(vendorBody.transcript) ? vendorBody.transcript : []
  return transcript.slice(0, 40).flatMap((entry) => {
    if (!isRecord(entry)) return []
    const role = entry.role === 'agent' ? 'Andrew' : entry.role === 'user' ? 'Owner' : null
    const message = sanitizeVendorText(entry.message, {
      destination,
      maxLength: 700,
      redactStandaloneName: true,
    })
    return role && message ? [{ role, message }] : []
  })
}

function sanitizedToolResult(vendorBody: Record<string, unknown>, destination: string) {
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
          price: normalizeVoicePintPrice(proposed.pint_price, 'pint'),
          beerType: sanitizeVendorText(proposed.beer_type, { destination, maxLength: 100 }),
          happyHour: sanitizeVendorText(proposed.happy_hour, { destination, maxLength: 160 }),
          confidence: confidenceValue(proposed.confidence, destination),
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

async function ownedConversationRow(supabase: SupabaseClient, conversationId: string, now: Date) {
  const recent = await recentDemoRows(supabase, now)
  if (recent.error) return { data: null, error: recent.error }
  const data = recent.rows.find(row => (
    parseAndrewDemoMetadata(row.parsed_notes)?.conversation_id === conversationId
  )) || null
  return { data, error: null }
}

export async function handleAndrewTestCallGet(request: NextRequest, deps: AndrewTestCallDeps = {}) {
  const auth = await authenticate(request, deps)
  if (!auth.authenticated) return auth.response

  const config = demoConfig()
  if (!config) {
    return json({ ok: false, error: 'Owner test calling is not configured.' }, { status: 503 })
  }

  const now = deps.now ?? new Date()
  const conversationId = request.nextUrl.searchParams.get('conversation_id')
  if (!conversationId) {
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

  const { data: row, error: ownershipError } = await ownedConversationRow(auth.supabase, conversationId, now)
  const metadata = parseAndrewDemoMetadata(row?.parsed_notes || null)
  if (
    ownershipError
    || !row
    || metadata?.agent_id !== config.agentId
    || metadata.destination_hash !== hashAndrewDemoDestination(config.destination, config.apiKey)
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
  const structured = structuredCapture(vendorBody, config.destination)
  const toolResult = sanitizedToolResult(vendorBody, config.destination)
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
      ...(terminal ? { call_sid: andrewDemoArchiveId(conversationId, status) } : {}),
      transcript: transcript.map(line => `${line.role}: ${line.message}`).join('\n') || null,
      parsed_price: proposedListing.price,
      parsed_beer_type: proposedListing.beerType,
      parsed_confidence: logStatus,
      parsed_notes: JSON.stringify(metadataFor(config, status, conversationId)),
    })
    .eq('call_sid', row.call_sid)
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
