import { useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DOC_TYPE_LABELS } from '@/types'
import type { DocumentRequest } from '@/types'
import { Upload } from 'lucide-react'

function docStatusVariant(status: string) {
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'destructive'
  if (status === 'received') return 'default'
  return 'secondary'
}

function docStatusLabel(status: string) {
  return { requested: 'Requested', received: 'Received', approved: 'Approved', rejected: 'Rejected' }[status] ?? status
}

function DocRow({ doc, clientId }: { doc: DocumentRequest; clientId: string }) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const path = `${clientId}/${doc.id}/${file.name}`
    await supabase.storage.from('documents').upload(path, file, { upsert: true })
    await supabase.from('document_requests').update({ file_path: path, file_name: file.name, status: 'received', updated_at: new Date().toISOString() }).eq('id', doc.id)
    await supabase.from('events').insert({ event_type: 'document_uploaded', client_id: clientId, visibility: 'internal' })
    qc.invalidateQueries({ queryKey: ['documents', clientId] })
  }

  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="font-medium">{DOC_TYPE_LABELS[doc.doc_type as keyof typeof DOC_TYPE_LABELS] ?? doc.doc_type}</p>
        {doc.status === 'rejected' && doc.rejection_reason && (
          <p className="mt-0.5 text-sm text-destructive">{doc.rejection_reason}</p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Badge variant={docStatusVariant(doc.status) as Parameters<typeof Badge>[0]['variant']}>{docStatusLabel(doc.status)}</Badge>
        {doc.status === 'requested' && (
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
