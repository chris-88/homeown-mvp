import { adminClient } from '../_shared/supabase.ts'
import { sendEmail } from '../_shared/email.ts'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const SITE_URL         = Deno.env.get('SITE_URL') ?? 'https://homeown.ie'

// ── Doc types by employment type ──────────────────────────────────────────────

const PAYE_TYPES         = ['photo_id', 'proof_of_address', 'payslip', 'employer_letter', 'bank_statement']
const SELF_EMPLOYED_TYPES = ['photo_id', 'proof_of_address', 'tax_document', 'self_employed_accounts', 'accountant_letter', 'bank_statement']

function docTypesFor(empType: string): string[] {
  if (empType === 'self_employed') return SELF_EMPLOYED_TYPES
  if (empType === 'mixed') return [...new Set([...PAYE_TYPES, ...SELF_EMPLOYED_TYPES])]
  return PAYE_TYPES
}

// ── Deliver a document via the deliver-document edge function ─────────────────

async function deliverDoc(
  clientId: string,
  documentType: string,
  variables: Record<string, unknown>,
  idempotencyKey: string,
) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/deliver-document`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      client_id:        clientId,
      document_type:    documentType,
      variables,
      channels:         'both',
      idempotency_key:  idempotencyKey,
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    console.error(`deliver-document failed [${documentType}]:`, body)
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const { client_id, old_stage, new_stage, employment_type } = await req.json() as {
    client_id: string
    old_stage:  string | null
    new_stage:  string
    employment_type: string
  }

  if (!client_id || !new_stage) {
    return Response.json({ error: 'client_id and new_stage required' }, { status: 400 })
  }

  const db = adminClient()

  const { data: client } = await db
    .from('clients')
    .select('id, first_name, last_name, email, user_id')
    .eq('id', client_id)
    .single()

  if (!client) {
    return Response.json({ error: 'Client not found' }, { status: 404 })
  }

  const clientName = `${client.first_name} ${client.last_name}`
  const today      = new Date().toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })
  const dateKey    = new Date().toISOString().split('T')[0]
  const sent: string[] = []

  // ── Pre-qual: auto-create document_requests + deliver D-03 ───────────────────
  if (new_stage === 'pre_qual') {
    const empType  = employment_type ?? 'paye'
    const required = docTypesFor(empType)

    // Only insert types not already requested
    const { data: existing } = await db
      .from('document_requests')
      .select('doc_type')
      .eq('client_id', client_id)

    const existingSet = new Set((existing ?? []).map((r: { doc_type: string }) => r.doc_type))
    const toCreate    = required.filter(t => !existingSet.has(t))

    if (toCreate.length > 0) {
      await db.from('document_requests').insert(
        toCreate.map(doc_type => ({ client_id, doc_type, status: 'requested' }))
      )
    }

    await deliverDoc(client_id, 'd03-document-request', {
      clientName: client.first_name,
      employmentType: empType,
      entryContributionRequired: true,
    }, `auto-d03-${client_id}-pre_qual-${dateKey}`)
    sent.push('d03-document-request')
  }

  // ── In review: notification email (not a formal document) ────────────────────
  if (new_stage === 'in_review') {
    await sendEmail({
      to_email:       client.email as string,
      to_user_id:     client.user_id as string | undefined ?? undefined,
      template:       'in-review-notification',
      template_model: { first_name: client.first_name },
      related_table:  'clients',
      related_id:     client_id,
      idempotency_key: `auto-in-review-notify-${client_id}-${dateKey}`,
    })
    sent.push('in-review-notification')
  }

  // ── Eligible: D-04 (positive) + D-05 + KFS ───────────────────────────────────
  if (new_stage === 'eligible') {
    await deliverDoc(client_id, 'd04-prequal-outcome', {
      clientName,
      decisionDate: today,
      outcome:      'eligible',
      staffName:    'The Homeown Team',
      reasons:      [],
      nextSteps:    ['We will be in touch to align on your property preferences and confirm next steps.'],
    }, `auto-d04-${client_id}-eligible-${dateKey}`)

    await deliverDoc(client_id, 'd05-eligible-confirm', {
      clientName:   client.first_name,
      decisionDate: today,
      staffName:    'The Homeown Team',
      kfsUrl:       `${SITE_URL}/#/kfs`,
      nextCallDate: null,
    }, `auto-d05-${client_id}-eligible-${dateKey}`)

    await deliverDoc(client_id, 'kfs', {
      clientName: client.first_name,
      issuedDate: today,
      version:    '0.2.2',
    }, `auto-kfs-${client_id}-eligible-${dateKey}`)

    sent.push('d04-eligible', 'd05', 'kfs')
  }

  // ── Not eligible: D-04 (negative) if post-review, else soft email ─────────────
  if (new_stage === 'not_eligible') {
    const postReview = old_stage === 'in_review'
    if (postReview) {
      await deliverDoc(client_id, 'd04-prequal-outcome', {
        clientName,
        decisionDate: today,
        outcome:      'not_eligible',
        staffName:    'The Homeown Team',
        reasons:      [],
        nextSteps:    [],
      }, `auto-d04-${client_id}-not_eligible-${dateKey}`)
      sent.push('d04-not_eligible')
    } else {
      await sendEmail({
        to_email:       client.email as string,
        to_user_id:     client.user_id as string | undefined ?? undefined,
        template:       'not-eligible-warm',
        template_model: { first_name: client.first_name },
        related_table:  'clients',
        related_id:     client_id,
        idempotency_key: `auto-not-eligible-email-${client_id}-${dateKey}`,
      })
      sent.push('not-eligible-email')
    }
  }

  // ── Deferred: D-04 (deferred) if from in_review, else soft email ─────────────
  if (new_stage === 'deferred') {
    const postReview = old_stage === 'in_review'
    if (postReview) {
      await deliverDoc(client_id, 'd04-prequal-outcome', {
        clientName,
        decisionDate: today,
        outcome:      'deferred',
        staffName:    'The Homeown Team',
        reasons:      [],
        nextSteps:    [],
      }, `auto-d04-${client_id}-deferred-${dateKey}`)
      sent.push('d04-deferred')
    } else {
      await sendEmail({
        to_email:       client.email as string,
        to_user_id:     client.user_id as string | undefined ?? undefined,
        template:       'deferred-stay-in-touch',
        template_model: { first_name: client.first_name },
        related_table:  'clients',
        related_id:     client_id,
        idempotency_key: `auto-deferred-email-${client_id}-${dateKey}`,
      })
      sent.push('deferred-email')
    }
  }

  return Response.json({ ok: true, client_id, new_stage, sent })
})
