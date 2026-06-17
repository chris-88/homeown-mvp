import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { getTemplate, getDisplayName, PHASE_A_MANUAL_TYPES } from '@/lib/documents/registry'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Client } from '@/types'
import { X, Send, Eye } from 'lucide-react'

interface Props {
  client: Client
  onClose: () => void
  onSent: () => void
}

function buildVariables(documentType: string, client: Client): Record<string, unknown> {
  const base = {
    clientName: `${client.first_name} ${client.last_name}`,
    issuedDate: new Date().toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' }),
    staffName: 'Homeown team',
  }

  if (documentType === 'kfs') return { ...base, version: '0.2.2' }
  if (documentType === 'privacy-notice') return { ...base, version: '0.1.0' }
  if (documentType === 'complaints-policy') return { ...base, version: '0.1.0' }
  if (documentType === 'hpa-guidance') return base
  if (documentType === 'd05-eligible-confirm') return { ...base, decisionDate: base.issuedDate, kfsUrl: `${window.location.origin}/#/kfs` }
  if (documentType === 'd04-prequal-outcome') return { ...base, outcome: 'eligible', decisionDate: base.issuedDate, nextSteps: [] }
  if (documentType === 'd02-discovery-summary') return {
    ...base,
    discoveryDate: base.issuedDate,
    targetPriceBand: client.target_price ? `€${(client.target_price * 0.9).toLocaleString()} – €${(client.target_price * 1.1).toLocaleString()}` : 'TBC',
    domiterExample: client.target_price ? `€${Math.round((client.target_price * 0.082) / 12).toLocaleString()}` : 'TBC',
    entryStakeExample: client.target_price ? `€${Math.round(client.target_price * 0.01).toLocaleString()}` : 'TBC',
    strikePriceExample: client.target_price ? `€${Math.round(client.target_price * 0.9).toLocaleString()}` : 'TBC',
    nextStep: 'book-follow-up',
  }
  if (documentType === 'd08-entry-stake-receipt') return {
    ...base,
    propertyAddress: 'TBC',
    amount: 'TBC',
    paymentDate: base.issuedDate,
    paymentReference: 'TBC',
    dacName: 'Homeown DAC',
  }
  return base
}

export function SendDocumentDrawer({ client, onClose, onSent }: Props) {
  const { user } = useAuth()
  const [docType, setDocType] = useState<string>('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(false)

  const template = docType ? getTemplate(docType) : null
  const variables = docType ? buildVariables(docType, client) : {}

  let previewHtml = ''
  try {
    if (template && variables && preview) {
      previewHtml = renderToStaticMarkup(template.renderHtml(variables))
    }
  } catch {
    previewHtml = ''
  }

  async function send() {
    if (!docType || !user) return
    setSending(true)
    setError('')
    try {
      const idempotencyKey = `staff-${user.id}-${docType}-${client.id}-${Date.now()}`
      const { data: { session } } = await supabase.auth.getSession()
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string

      const res = await fetch(`${supabaseUrl}/functions/v1/deliver-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          client_id: client.id,
          document_type: docType,
          variables,
          channels: 'both',
          delivered_by: user.id,
          idempotency_key: idempotencyKey,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? 'Delivery failed')
      }

      onSent()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send document')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-xl bg-background shadow-xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div>
            <p className="font-semibold">Send document</p>
            <p className="text-xs text-muted-foreground">{client.first_name} {client.last_name}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">Document</label>
            <Select value={docType} onValueChange={(v) => { setDocType(v); setPreview(false) }}>
              <SelectTrigger>
                <SelectValue placeholder="Select a document to send…" />
              </SelectTrigger>
              <SelectContent>
                {PHASE_A_MANUAL_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{getDisplayName(t)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {docType && (
            <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-1">
              <p><span className="text-muted-foreground">Client:</span> {client.first_name} {client.last_name}</p>
              <p><span className="text-muted-foreground">Document:</span> {getDisplayName(docType)}</p>
              <p><span className="text-muted-foreground">Channel:</span> In-app + PDF email</p>
              {template?.requiresAck && (
                <p className="text-brand-burgundy text-xs mt-1">Requires client acknowledgement</p>
              )}
            </div>
          )}

          {docType && (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => setPreview(p => !p)}
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              {preview ? 'Hide preview' : 'Preview document'}
            </Button>
          )}

          {preview && previewHtml && (
            <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} className="text-sm" />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="shrink-0 border-t p-4">
          <Button
            onClick={send}
            disabled={!docType || sending}
            className="w-full bg-brand-green text-brand-cream hover:bg-brand-green-light"
          >
            <Send className="h-4 w-4 mr-2" />
            {sending ? 'Sending…' : 'Send document'}
          </Button>
        </div>
      </div>
    </div>
  )
}
