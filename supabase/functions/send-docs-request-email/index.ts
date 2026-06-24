import { adminClient } from '../_shared/supabase.ts'
import { sendEmail } from '../_shared/email.ts'

const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://homeown.ie'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

const DOC_LABELS: Record<string, string> = {
  photo_id: 'Photo ID',
  proof_of_address: 'Proof of Address',
  payslip: 'Payslip',
  bank_statement: 'Bank Statement',
  employer_letter: 'Employer Letter',
  tax_document: 'Tax Document',
  self_employed_accounts: 'Self-Employed Accounts',
  accountant_letter: 'Accountant Letter',
  maintenance_order: 'Maintenance Order',
  other: 'Other',
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: CORS })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS })
  }

  try {
    const { client_id, doc_types } = await req.json() as { client_id: string; doc_types: string[] }

    if (!client_id || !Array.isArray(doc_types) || doc_types.length === 0) {
      return json({ error: 'client_id and doc_types are required' }, 400)
    }

    const db = adminClient()

    const { data: client, error: clientErr } = await db
      .from('clients')
      .select('id, user_id, first_name, last_name, email')
      .eq('id', client_id)
      .single()

    if (clientErr || !client) {
      return json({ error: 'Client not found' }, 404)
    }

    let firstName = (client.first_name as string) ?? 'there'
    let lastName = (client.last_name as string) ?? ''
    let email = (client.email as string) ?? ''

    if (client.user_id) {
      const { data: profile } = await db
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', client.user_id)
        .maybeSingle()
      if (profile) {
        firstName = (profile.first_name as string) ?? firstName
        lastName = (profile.last_name as string) ?? lastName
        email = (profile.email as string) ?? email
      }
    }

    if (!email) {
      return json({ error: 'Client has no email address' }, 400)
    }

    const isNewAccount = !client.user_id
    const portalUrl = isNewAccount
      ? `${SITE_URL}/#/auth/signup?email=${encodeURIComponent(email)}&first=${encodeURIComponent(firstName)}&last=${encodeURIComponent(lastName)}`
      : `${SITE_URL}/#/app/client/documents`

    const docLabels = doc_types.map(t => DOC_LABELS[t] ?? t)

    // Idempotency: one email per unique set of doc types requested for this client
    const idempotencyKey = `docs-requested-${client_id}-${[...doc_types].sort().join(':')}`

    const result = await sendEmail({
      to_email: email,
      to_user_id: client.user_id ?? undefined,
      template: 'docs-requested',
      template_model: {
        first_name: firstName,
        doc_labels: docLabels,
        is_new_account: isNewAccount,
        portal_url: portalUrl,
      },
      related_table: 'clients',
      related_id: client_id,
      idempotency_key: idempotencyKey,
    })

    return json({ status: result.status, duplicate: result.duplicate ?? false })
  } catch (err) {
    console.error('send-docs-request-email error:', err)
    return json({ error: 'Internal error', detail: String(err) }, 500)
  }
})
