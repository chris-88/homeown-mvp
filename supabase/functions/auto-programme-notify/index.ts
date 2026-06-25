import { adminClient } from '../_shared/supabase.ts'
import { sendEmail } from '../_shared/email.ts'

const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://homeown.ie'

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const { client_id, new_stage } = await req.json() as {
    client_id: string
    old_stage: string | null
    new_stage: string | null
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

  if (!client) return Response.json({ error: 'Client not found' }, { status: 404 })

  const dateKey = new Date().toISOString().split('T')[0]
  const sent: string[] = []

  // ── DAC assigned: send welcome notification ───────────────────────────────────
  if (new_stage === 'dac_assigned') {
    await sendEmail({
      to_email:        client.email as string,
      to_user_id:      client.user_id as string | undefined ?? undefined,
      template:        'dac-assigned-welcome',
      template_model:  {
        first_name: client.first_name,
        portal_url: `${SITE_URL}/#/app/client/property`,
      },
      related_table:   'clients',
      related_id:      client_id,
      idempotency_key: `auto-dac-assigned-${client_id}-${dateKey}`,
    })
    sent.push('dac-assigned-welcome')
  }

  return Response.json({ ok: true, client_id, new_stage, sent })
})
