import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DOC_TYPE_LABELS } from '@/types'
import type { DocumentRequest } from '@/types'
import { formatDate } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'

interface DocWithClient extends DocumentRequest {
  clients: { id: string; first_name: string; last_name: string }
}

export default function DocReviewPage() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const [rejectDoc, setRejectDoc] = useState<DocWithClient | null>(null)
  const [reason, setReason] = useState('')
  const [loadingApproveId, setLoadingApproveId] = useState<string | null>(null)
  const [loadingReject, setLoadingReject] = useState(false)

  const { data: docs } = useQuery({
    queryKey: ['staff-doc-review'],
    queryFn: async () => {
      const { data } = await supabase
        .from('document_requests')
        .select('*, clients(id, first_name, last_name)')
        .eq('status', 'received')
        .order('created_at')
      return (data ?? []) as DocWithClient[]
    },
  })

  async function approve(doc: DocWithClient) {
    setLoadingApproveId(doc.id)
    await supabase.from('document_requests').update({ status: 'approved', reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq('id', doc.id)
    await supabase.from('events').insert({ client_id: doc.client_id, event_type: 'document_approved', visibility: 'client' })
    qc.invalidateQueries({ queryKey: ['staff-doc-review'] })
    setLoadingApproveId(null)
  }

  async function reject() {
    if (!rejectDoc) return
    setLoadingReject(true)
    await supabase.from('document_requests').update({ status: 'rejected', rejection_reason: reason, reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq('id', rejectDoc.id)
    await supabase.from('events').insert({ client_id: rejectDoc.client_id, event_type: 'document_rejected', visibility: 'client' })
    qc.invalidateQueries({ queryKey: ['staff-doc-review'] })
    setLoadingReject(false)
    setRejectDoc(null)
    setReason('')
  }

  async function openSignedUrl(filePath: string) {
    const { data } = await supabase.storage.from('documents').createSignedUrl(filePath, 300)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">Document review queue</h1>
        <p className="mt-1 text-muted-foreground">{docs?.length ?? 0} documents awaiting review.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Received documents</CardTitle></CardHeader>
        <CardContent>
          {!docs || docs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Queue is empty.</p>
          ) : (
            <div className="divide-y">
              {docs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <Link to={`/app/staff/clients/${doc.clients?.id}`} className="text-sm font-medium hover:underline">
                      {doc.clients?.first_name} {doc.clients?.last_name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {DOC_TYPE_LABELS[doc.doc_type as keyof typeof DOC_TYPE_LABELS] ?? doc.doc_type} · uploaded {formatDate(doc.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge>Received</Badge>
                    {doc.file_path && (
                      <Button size="sm" variant="ghost" onClick={() => openSignedUrl(doc.file_path!)}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => approve(doc)} disabled={loadingApproveId === doc.id}>
                      {loadingApproveId === doc.id ? 'Saving…' : 'Approve'}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => { setRejectDoc(doc); setReason('') }} disabled={!!loadingApproveId}>Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!rejectDoc} onOpenChange={(o) => !o && setRejectDoc(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject document</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Rejection reason</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain what needs to be corrected…" rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDoc(null)}>Cancel</Button>
            <Button variant="destructive" onClick={reject} disabled={!reason.trim() || loadingReject}>
              {loadingReject ? 'Saving…' : 'Confirm rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
