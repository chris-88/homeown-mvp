import { adminClient } from '../_shared/supabase.ts'
import { sendEmail } from '../_shared/email.ts'
import { createNotification } from '../_shared/notifications.ts'
import { getDocumentTitle, getDocumentVersion } from '../_shared/documents/templates.ts'

const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://homeown.ie'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: CORS })
}

interface DeliverDocumentPayload {
  client_id: string
  document_type: string
  variables: Record<string, unknown>
  channels: 'email_pdf' | 'in_app' | 'both'
  delivered_by?: string
  idempotency_key: string
  notes?: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS })
  }

  try {
    const payload = await req.json() as DeliverDocumentPayload
    const { client_id, document_type, variables, channels, delivered_by, idempotency_key, notes } = payload

    if (!client_id || !document_type || !channels || !idempotency_key) {
      return json({ error: 'client_id, document_type, channels, idempotency_key are required' }, 400)
    }

    const db = adminClient()

    // 1. Idempotency check
    const { data: existing } = await db
      .from('document_deliveries')
      .select('id')
      .eq('idempotency_key', idempotency_key)
      .maybeSingle()

    if (existing) {
      return json({ id: existing.id, skipped: true })
    }

    // 2. Get client info
    const { data: client, error: clientErr } = await db
      .from('clients')
      .select('id, user_id, first_name, last_name, email, lead_stage, programme_stage')
      .eq('id', client_id)
      .single()

    if (clientErr || !client) {
      return json({ error: 'Client not found' }, 404)
    }

    let clientEmail = (client.email as string) ?? ''
    let clientFirstName = (client.first_name as string) ?? ''
    let clientLastName = (client.last_name as string) ?? ''

    if (client.user_id) {
      const { data: profile } = await db
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', client.user_id)
        .maybeSingle()
      if (profile) {
        clientFirstName = (profile.first_name as string) ?? clientFirstName
        clientLastName = (profile.last_name as string) ?? clientLastName
        clientEmail = (profile.email as string) ?? clientEmail
      }
    }
    const version = getDocumentVersion(document_type)
    const documentTitle = getDocumentTitle(document_type)
    const requiresAck = await getRequiresAck(document_type, db)
    const programme_stage = (client.programme_stage as string | null) ?? (client.lead_stage as string | null) ?? null

    // 3. Generate PDF if needed
    let storage_path: string | null = null
    if (channels === 'email_pdf' || channels === 'both') {
      const pdfRes = await fetch(`${SUPABASE_URL}/functions/v1/generate-document-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ document_type, variables, client_id }),
      })
      if (!pdfRes.ok) {
        const errBody = await pdfRes.text()
        console.error('generate-document-pdf failed:', errBody)
        return json({ error: 'PDF generation failed', detail: errBody }, 500)
      }
      const pdfData = await pdfRes.json() as { storage_path: string }
      storage_path = pdfData.storage_path
    }

    // 4. Send email if needed
    let email_log_id: string | null = null
    if (channels === 'email_pdf' || channels === 'both') {
      let attachments: { filename: string; content: string }[] | undefined
      if (storage_path) {
        try {
          const { data: fileData, error: dlErr } = await db.storage
            .from('documents')
            .download(storage_path)
          if (!dlErr && fileData) {
            const buf = await fileData.arrayBuffer()
            const bytes = new Uint8Array(buf)
            const binary = bytes.reduce((acc, b) => acc + String.fromCharCode(b), '')
            attachments = [{
              filename: `${documentTitle}.pdf`,
              content: btoa(binary),
            }]
          }
        } catch (dlErr) {
          console.error('PDF download for attachment failed:', dlErr)
        }
      }

      const emailResult = await sendEmail({
        to_email: clientEmail,
        to_user_id: client.user_id as string ?? undefined,
        template: 'document-delivery',
        template_model: {
          client_name: clientFirstName,
          document_name: documentTitle,
          document_type,
          portal_url: client.user_id
            ? `${SITE_URL}/#/app/client/documents`
            : `${SITE_URL}/#/auth/signup?email=${encodeURIComponent(clientEmail)}&first=${encodeURIComponent(clientFirstName)}&last=${encodeURIComponent(clientLastName)}`,
        },
        related_table: 'clients',
        related_id: client_id,
        idempotency_key: `email-${idempotency_key}`,
        attachments,
      })
      email_log_id = emailResult.logId ?? null
    }

    // 5. Write delivery record
    const { data: delivery, error: insertErr } = await db
      .from('document_deliveries')
      .insert({
        client_id,
        document_type,
        document_version: version,
        delivery_channel: channels,
        variables,
        visible_in_portal: true,
        requires_ack: requiresAck,
        email_log_id,
        recipient_email: clientEmail,
        storage_path,
        storage_bucket: storage_path ? 'documents' : null,
        programme_stage,
        delivered_by: delivered_by ?? null,
        notes: notes ?? null,
        idempotency_key,
      })
      .select('id')
      .single()

    if (insertErr) {
      console.error('document_deliveries insert error:', insertErr)
      return json({ error: 'Failed to create delivery record', detail: insertErr.message }, 500)
    }

    // 6. In-app notification
    if ((channels === 'in_app' || channels === 'both') && client.user_id) {
      await createNotification({
        user_id: client.user_id as string,
        type: 'document_available',
        title: `New document: ${documentTitle}`,
        body: requiresAck ? 'This document requires your acknowledgement.' : undefined,
        action_url: `/#/app/client/documents`,
        idempotency_key: `notif-${idempotency_key}`,
      })
    }

    return json({ id: delivery.id })
  } catch (err) {
    console.error('deliver-document error:', err)
    return json({ error: 'Internal error', detail: String(err) }, 500)
  }
})

async function getRequiresAck(documentType: string, db: ReturnType<typeof adminClient>): Promise<boolean> {
  const { data } = await db
    .from('document_templates')
    .select('requires_ack')
    .eq('document_type', documentType)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data?.requires_ack ?? false
}
