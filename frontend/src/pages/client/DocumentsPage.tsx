import { useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DOC_TYPE_LABELS } from '@/types'
import type { DocumentRequest, DocType } from '@/types'
import { Upload, CheckCircle2 } from 'lucide-react'

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

function DocRow({ doc, clientId }: { doc: DocumentRequest; clientId: string }) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const meta = DOC_META[doc.doc_type as DocType]

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const path = `${clientId}/${doc.id}/${file.name}`
    await supabase.storage.from('documents').upload(path, file, { upsert: true })
    await supabase.from('document_requests').update({ file_path: path, file_name: file.name, status: 'needs_review', updated_at: new Date().toISOString() }).eq('id', doc.id)
    await supabase.from('events').insert({ event_type: 'document_uploaded', client_id: clientId, visibility: 'internal' })
    qc.invalidateQueries({ queryKey: ['documents', clientId] })
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
          <p className="flex items-center gap-1 text-xs text-green-700 pt-0.5">
            <CheckCircle2 className="h-3.5 w-3.5" />Approved
          </p>
        )}
        {doc.file_name && doc.status !== 'requested' && (
          <p className="text-xs text-muted-foreground pt-0.5">Uploaded: {doc.file_name}</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0 pt-0.5">
        <Badge variant={docStatusVariant(doc.status) as Parameters<typeof Badge>[0]['variant']}>{docStatusLabel(doc.status)}</Badge>
        {(doc.status === 'requested' || doc.status === 'rejected') && (
          <>
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="h-3.5 w-3.5 mr-1" /> Upload
            </Button>
            <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
          </>
        )}
      </div>
    </div>
  )
}

export default function DocumentsPage() {
  const { client } = useAuth()
  const { data: docs, isLoading } = useQuery({
    queryKey: ['documents', client?.id],
    queryFn: async () => {
      if (!client) return []
      const { data } = await supabase.from('document_requests').select('*').eq('client_id', client.id).order('created_at')
      return (data ?? []) as DocumentRequest[]
    },
    enabled: !!client,
  })

  if (!client) return null

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="mt-1 text-muted-foreground">Upload your required documents below.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Required documents</CardTitle></CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && (!docs || docs.length === 0) && (
            <p className="text-sm text-muted-foreground">No documents have been requested yet. Our team will be in touch shortly.</p>
          )}
          {docs && docs.length > 0 && (
            <div className="divide-y">
              {docs.map((doc) => <DocRow key={doc.id} doc={doc} clientId={client.id} />)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
