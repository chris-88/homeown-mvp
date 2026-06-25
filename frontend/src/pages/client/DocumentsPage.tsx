import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DOC_TYPE_LABELS } from '@/types'
import { getTemplate, getDisplayName } from '@/lib/documents/registry'
import type { DocumentRequest, DocType, DocumentDelivery } from '@/types'
import { Upload, CheckCircle2, AlertTriangle, FileText, Eye, Download, X } from 'lucide-react'
import { renderToStaticMarkup } from 'react-dom/server'

// ── Document metadata ─────────────────────────────────────────────────────────

const DOC_META: Record<DocType, { description: string; accepted: string }> = {
  photo_id: {
    description: 'Required to verify your identity as part of our onboarding process.',
    accepted: 'Passport, Irish driving licence, or national identity card. Must be valid and clearly legible.',
  },
  proof_of_address: {
    description: 'Confirms your current residential address.',
    accepted: 'Utility bill, bank statement, or letter from a government body dated within the last 3 months.',
  },
  payslip: {
    description: 'Verifies your current income and employment status.',
    accepted: 'Your two most recent payslips, showing your name, employer, and gross/net pay.',
  },
  bank_statement: {
    description: 'Helps us assess your financial position and spending patterns.',
    accepted: '6 months of statements from your primary current account. Online or printed statements accepted.',
  },
  employer_letter: {
    description: 'Confirms your employment type, role, and salary.',
    accepted: 'A letter on company letterhead from your employer or HR, confirming your role, salary, and contract type.',
  },
  tax_document: {
    description: 'Confirms your tax residency and income as reported to Revenue.',
    accepted: 'Most recent P60 or equivalent, Notice of Assessment from Revenue, or tax clearance certificate.',
  },
  self_employed_accounts: {
    description: 'Verifies your income and business financial health if you are self-employed.',
    accepted: 'Certified accounts from the last two years prepared by a qualified accountant, including a profit and loss statement.',
  },
  accountant_letter: {
    description: 'A professional confirmation of your income, typically required for self-employed applicants.',
    accepted: 'Letter on headed paper from your accountant confirming your average annual income over the last two years.',
  },
  maintenance_order: {
    description: 'Documents any court-ordered maintenance payments, which are considered in your income assessment.',
    accepted: 'A copy of the relevant court order or separation agreement detailing payment amounts and frequency.',
  },
  other: {
    description: 'An additional document requested by your Homeown advisor.',
    accepted: 'As specified by your advisor.',
  },
}

function docStatusVariant(status: string) {
  if (status === 'approved') return 'default'
  if (status === 'rejected') return 'destructive'
  if (status === 'needs_review') return 'secondary'
  return 'outline'
}

function docStatusLabel(status: string) {
  return { requested: 'Requested', needs_review: 'Under Review', approved: 'Approved', rejected: 'Rejected' }[status] ?? status
}

// ── Doc upload row ────────────────────────────────────────────────────────────

function DocRow({ doc, clientId }: { doc: DocumentRequest; clientId: string }) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const meta = DOC_META[doc.doc_type as DocType]

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
    const path = `clients/${clientId}/${doc.id}/${file.name}`
    const { error: storageError } = await supabase.storage.from('documents').upload(path, file, { upsert: true })
    if (storageError) {
      setUploadError('Upload failed — please try again.')
      setUploading(false)
      return
    }
    const { error: dbError } = await supabase
      .from('document_requests')
      .update({ file_path: path, file_name: file.name, status: 'needs_review', updated_at: new Date().toISOString() })
      .eq('id', doc.id)
    if (dbError) {
      setUploadError('File saved but status could not be updated — please contact support.')
      setUploading(false)
      return
    }
    await supabase.from('events').insert({ event_type: 'document_uploaded', client_id: clientId, visibility: 'client' })
    qc.invalidateQueries({ queryKey: ['documents', clientId] })
    setUploading(false)
  }

  return (
    <div className="flex items-start justify-between gap-6 py-5">
      <div className="min-w-0 space-y-1">
        <p className="font-medium">{DOC_TYPE_LABELS[doc.doc_type as keyof typeof DOC_TYPE_LABELS] ?? doc.doc_type}</p>
        {meta && (
          <>
            <p className="text-sm text-muted-foreground">{meta.description}</p>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground/70">Accepted: </span>{meta.accepted}
            </p>
          </>
        )}
        {doc.status === 'rejected' && doc.rejection_reason && (
          <p className="text-sm text-destructive pt-0.5">{doc.rejection_reason}</p>
        )}
        {doc.status === 'approved' && (
          <p className="flex items-center gap-1 text-xs text-primary pt-0.5">
            <CheckCircle2 className="h-3.5 w-3.5" />Approved
          </p>
        )}
        {doc.file_name && doc.status !== 'requested' && (
          <p className="text-xs text-muted-foreground pt-0.5">Uploaded: {doc.file_name}</p>
        )}
        {uploadError && <p className="text-xs text-destructive pt-0.5">{uploadError}</p>}
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0 pt-0.5">
        <Badge variant={docStatusVariant(doc.status) as Parameters<typeof Badge>[0]['variant']}>{docStatusLabel(doc.status)}</Badge>
        {(doc.status === 'requested' || doc.status === 'rejected') && (
          <>
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Upload className="h-3.5 w-3.5 mr-1" /> {uploading ? 'Uploading…' : 'Upload'}
            </Button>
            <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
          </>
        )}
      </div>
    </div>
  )
}

// ── Delivery helpers ──────────────────────────────────────────────────────────

function deliveryStatusLabel(d: DocumentDelivery): string {
  if (d.requires_ack && !d.acknowledged_at) return 'Action required'
  if (d.acknowledged_at) return 'Acknowledged'
  if (d.read_at) return 'Read'
  return 'Unread'
}

function deliveryStatusClass(d: DocumentDelivery): string {
  if (d.requires_ack && !d.acknowledged_at) return 'bg-brand-burgundy-muted text-brand-burgundy border-brand-burgundy/20'
  if (d.acknowledged_at) return 'bg-brand-green-muted text-brand-green border-brand-green/20'
  if (d.read_at) return 'bg-blue-100 text-blue-800 border-blue-200'
  return 'bg-muted text-muted-foreground border-border'
}

// ── Document viewer ───────────────────────────────────────────────────────────

function DocumentViewer({ delivery, clientId, onClose }: { delivery: DocumentDelivery; clientId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const template = getTemplate(delivery.document_type)
  const [acking, setAcking] = useState(false)

  async function markRead() {
    if (delivery.read_at) return
    await supabase.from('document_deliveries').update({ read_at: new Date().toISOString() }).eq('id', delivery.id)
    qc.invalidateQueries({ queryKey: ['deliveries', clientId] })
  }

  async function acknowledge() {
    setAcking(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('document_deliveries').update({
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: user?.id,
    }).eq('id', delivery.id)
    qc.invalidateQueries({ queryKey: ['deliveries', clientId] })
    setAcking(false)
    onClose()
  }

  async function downloadPdf() {
    if (!delivery.storage_path) return
    const { data } = await supabase.storage.from('documents').createSignedUrl(delivery.storage_path, 3600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  const readFired = useRef(false)
  if (!readFired.current) { readFired.current = true; markRead() }

  let htmlContent: string | null = null
  try {
    if (template && delivery.variables) {
      htmlContent = renderToStaticMarkup(template.renderHtml(delivery.variables))
    }
  } catch {
    htmlContent = null
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-2xl bg-background shadow-xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div>
            <p className="font-semibold text-sm">{getDisplayName(delivery.document_type)}</p>
            <p className="text-xs text-muted-foreground">
              v{delivery.document_version} &nbsp;·&nbsp;
              {new Date(delivery.created_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {delivery.storage_path && (
              <Button size="sm" variant="outline" onClick={downloadPdf}>
                <Download className="h-3.5 w-3.5 mr-1" /> PDF
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {htmlContent
            ? <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-8 text-center">
                <div>
                  <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p>Document preview not available.</p>
                  {delivery.storage_path && <p className="mt-1">Use the PDF download button above.</p>}
                </div>
              </div>
            )
          }
        </div>

        {delivery.requires_ack && !delivery.acknowledged_at && (
          <div className="shrink-0 border-t p-4 bg-brand-burgundy-muted">
            <p className="text-sm font-medium text-brand-burgundy mb-3">This document requires your acknowledgement</p>
            <Button onClick={acknowledge} disabled={acking} className="w-full bg-brand-green text-brand-cream hover:bg-brand-green-light">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {acking ? 'Saving…' : 'Acknowledge receipt'}
            </Button>
          </div>
        )}
        {delivery.acknowledged_at && (
          <div className="shrink-0 border-t p-4 bg-brand-green-muted">
            <p className="flex items-center gap-2 text-sm text-brand-green">
              <CheckCircle2 className="h-4 w-4" />
              Acknowledged on {new Date(delivery.acknowledged_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Delivery row ──────────────────────────────────────────────────────────────

function DeliveryRow({ delivery, onView }: { delivery: DocumentDelivery; onView: (d: DocumentDelivery) => void }) {
  async function downloadPdf() {
    if (!delivery.storage_path) return
    const { data } = await supabase.storage.from('documents').createSignedUrl(delivery.storage_path, 3600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  return (
    <div className="py-4 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="min-w-0 space-y-1">
          <p className="font-medium text-sm">{getDisplayName(delivery.document_type)}</p>
          <p className="text-xs text-muted-foreground">
            Sent {new Date(delivery.created_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${deliveryStatusClass(delivery)}`}>
            {deliveryStatusLabel(delivery)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
        <Button size="sm" variant="outline" onClick={() => onView(delivery)}>
          <Eye className="h-3.5 w-3.5 mr-1" /> View
        </Button>
        {delivery.storage_path && (
          <Button size="sm" variant="outline" onClick={downloadPdf}>
            <Download className="h-3.5 w-3.5 mr-1" /> PDF
          </Button>
        )}
        {delivery.requires_ack && !delivery.acknowledged_at && (
          <Button size="sm" variant="outline" onClick={() => onView(delivery)} className="border-brand-burgundy/30 text-brand-burgundy hover:bg-brand-burgundy-muted">
            Acknowledge
          </Button>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const { client } = useAuth()
  const [viewingDelivery, setViewingDelivery] = useState<DocumentDelivery | null>(null)

  const { data: docs, isLoading: docsLoading } = useQuery({
    queryKey: ['documents', client?.id],
    queryFn: async () => {
      if (!client) return []
      const { data } = await supabase.from('document_requests').select('*').eq('client_id', client.id).order('created_at')
      return (data ?? []) as DocumentRequest[]
    },
    enabled: !!client,
  })

  const { data: deliveries, isLoading: deliveriesLoading } = useQuery({
    queryKey: ['deliveries', client?.id],
    queryFn: async () => {
      if (!client) return []
      const { data } = await supabase
        .from('document_deliveries')
        .select('*')
        .eq('client_id', client.id)
        .eq('visible_in_portal', true)
        .order('created_at', { ascending: false })
      return (data ?? []) as DocumentDelivery[]
    },
    enabled: !!client,
  })

  if (!client) return null

  const pendingAck = (deliveries ?? []).filter(d => d.requires_ack && !d.acknowledged_at)
  const hasDeliveries = !deliveriesLoading && (deliveries ?? []).length > 0

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="mt-1 text-muted-foreground">View and manage your Homeown documents.</p>
      </div>

      {pendingAck.length > 0 && (
        <Alert className="border-brand-burgundy/30 bg-brand-burgundy-muted">
          <AlertTriangle className="h-4 w-4 text-brand-burgundy" />
          <AlertDescription className="text-brand-burgundy">
            {pendingAck.length === 1
              ? '1 document requires your acknowledgement.'
              : `${pendingAck.length} documents require your acknowledgement.`}
          </AlertDescription>
        </Alert>
      )}

      {/* Documents from Homeown — always shown when any exist */}
      {hasDeliveries && (
        <Card>
          <CardHeader><CardTitle className="text-base">From Homeown</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y">
              {deliveries!.map(d => (
                <DeliveryRow key={d.id} delivery={d} onView={setViewingDelivery} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents we need from the client */}
      <Card>
        <CardHeader><CardTitle className="text-base">Required documents</CardTitle></CardHeader>
        <CardContent>
          {docsLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!docsLoading && (!docs || docs.length === 0) && (
            <p className="text-sm text-muted-foreground">No documents have been requested yet. Our team will be in touch shortly.</p>
          )}
          {docs && docs.length > 0 && (
            <div className="divide-y">
              {docs.map(doc => <DocRow key={doc.id} doc={doc} clientId={client.id} />)}
            </div>
          )}
        </CardContent>
      </Card>

      {viewingDelivery && (
        <DocumentViewer
          delivery={viewingDelivery}
          clientId={client.id}
          onClose={() => setViewingDelivery(null)}
        />
      )}
    </div>
  )
}
