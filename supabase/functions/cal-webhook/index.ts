import { adminClient } from '../_shared/supabase.ts'

// Optional: set CAL_WEBHOOK_SECRET in Supabase Edge Function secrets to verify signatures.
// If not set, signature check is skipped (still fine for internal use).

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type' }

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: CORS })
}

function extractPhone(payload: Record<string, unknown>): string | null {
  // Cal.com built-in phone field on attendee
  const attendees = payload.attendees as Array<Record<string, unknown>> | undefined
  const attendeePhone = attendees?.[0]?.phoneNumber as string | undefined
  if (attendeePhone) return attendeePhone

  // Cal.com custom form responses — tries common field slugs
  const responses = payload.responses as Record<string, { value: unknown }> | undefined
  if (responses) {
    for (const key of ['phone', 'phoneNumber', 'phone_number', 'mobile', 'contactNumber']) {
      const val = responses[key]?.value
      if (typeof val === 'string' && val.trim()) return val.trim()
    }
  }

  return null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const rawBody = await req.text()

  // Signature verification (optional — only if secret is configured)
  const secret = Deno.env.get('CAL_WEBHOOK_SECRET')
  if (secret) {
    const sig = req.headers.get('X-Cal-Signature-256') ?? ''
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    )
    const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
    const expected = 'sha256=' + Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, '0')).join('')
    if (sig !== expected) {
      console.warn('cal-webhook: invalid signature')
      return json({ error: 'Invalid signature' }, 401)
    }
  }

  let event: Record<string, unknown>
  try {
    event = JSON.parse(rawBody)
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const trigger = event.triggerEvent as string
  const payload = (event.payload ?? {}) as Record<string, unknown>

  // Only handle booking lifecycle events
  if (!['BOOKING_CREATED', 'BOOKING_RESCHEDULED', 'BOOKING_CANCELLED'].includes(trigger)) {
    return json({ skipped: true, trigger })
  }

  const attendees = payload.attendees as Array<Record<string, unknown>> | undefined
  const attendeeEmail = attendees?.[0]?.email as string | undefined

  if (!attendeeEmail) {
    return json({ error: 'No attendee email in payload' }, 400)
  }

  const db = adminClient()

  // Match client by email
  const { data: client } = await db
    .from('clients')
    .select('id')
    .eq('email', attendeeEmail)
    .maybeSingle()

  if (!client) {
    console.warn(`cal-webhook: no client found for email ${attendeeEmail}`)
    return json({ skipped: true, reason: 'no_client_match' })
  }

  const clientId = client.id as string
  const startTime = payload.startTime as string | null
  const phone = extractPhone(payload)

  if (trigger === 'BOOKING_CANCELLED') {
    await db.from('clients').update({ appointment_at: null }).eq('id', clientId)
    await db.from('events').insert({
      client_id: clientId,
      event_type: 'call_cancelled',
      visibility: 'client',
      payload: { booking_uid: payload.uid, cancelled_at: new Date().toISOString() },
    })
    return json({ ok: true, action: 'cancelled' })
  }

  // BOOKING_CREATED or BOOKING_RESCHEDULED
  const updates: Record<string, unknown> = {}
  if (startTime) updates.appointment_at = startTime
  if (phone) updates.phone = phone

  if (Object.keys(updates).length > 0) {
    await db.from('clients').update(updates).eq('id', clientId)
  }

  const eventType = trigger === 'BOOKING_RESCHEDULED' ? 'call_rescheduled' : 'call_booked'
  await db.from('events').insert({
    client_id: clientId,
    event_type: eventType,
    visibility: 'client',
    payload: {
      appointment_at: startTime,
      phone: phone ?? null,
      booking_uid: payload.uid ?? null,
      attendee_name: attendees?.[0]?.name ?? null,
    },
  })

  return json({ ok: true, action: eventType, client_id: clientId })
})
