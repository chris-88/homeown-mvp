import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { DOC_TYPE_LABELS, DOC_STATUS_LABELS } from '@/types'
import type { DocumentRequest, DocType, DocStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Upload, Download, CheckCircle2, Trash2, Eye, X, FileText } from 'lucide-react'

const ALL_DOC_TYPES: DocType[] = [
  'photo_id', 'proof_of_address', 'payslip', 'bank_statement',
  'employer_letter', 'tax_document', 'self_employed_accounts',
  'accountant_letter', 'maintenance_order', 'other',
]

function docStatusVariant(status: DocStatus) {
  if (status === 'approved') return 'default' as const
  if (status === 'rejected') return 'destructive' as const
  return 'secondary' as const
}

export function StaffDocumentsSection({
  clientId, docs, onRefresh,
}: { clientId: string; docs: DocumentRequest[]; onRefresh: () => void }) {
  const { user } = useAuth()
  const [showRequest, setShowRequest] = useState(false)
  const [selected, setSelected] = useState<Set<DocType>>(new Set())
  const [requestLoading, setRequestLoading] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [viewingDoc, setViewingDoc] = useState<{ url: string; fileName: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const requestedTypes = new Set(docs.map(d => d.doc_type))
  const availableTypes = ALL_DOC_TYPES.filter(t => !requestedTypes.has(t))

  function toggleType(t: DocType) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t); else next.add(t)
      return next
    })
  }

  async function handleRequest() {
    if (!selected.size) return
    setRequestLoading(true)
    await supabase.from('document_requests').insert(
      [...selected].map(doc_type => ({ client_id: clientId, doc_type, status: 'requested' }))
    )
    setSelected(new Set())
    setShowRequest(false)
    setRequestLoading(false)
    onRefresh()
  }

  function startUpload(docId: string) {
    setUploadingId(docId)
    setTimeout(() => fileRef.current?.click(), 0)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !uploadingId) return
    const path = `${clientId}/${uploadingId}/${file.name}`
    await supabase.storage.from('documents').upload(path, file, { upsert: true })
    await supabase.from('document_requests').update({
      file_path: path, file_name: file.name, status: 'needs_review', updated_at: new Date().toISOString(),
    }).eq('id', uploadingId)
    e.target.value = ''
    setUploadingId(null)
    onRefresh()
  }

  async function handleView(filePath: string, fileName: string) {
    const { data } = await supabase.storage.from('documents').createSignedUrl(filePath, 300)
    if (data?.signedUrl) setViewingDoc({ url: data.signedUrl, fileName })
  }

  function handleModalDownload() {
    if (!viewingDoc) return
    const a = document.createElement('a')
    a.href = viewingDoc.url; a.download = viewingDoc.fileName; a.click()
  }

  function isImage(name: string) { return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name) }
  function isPdf(name: string) { return /\.pdf$/i.test(name) }

  async function handleApprove(docId: string) {
    await supabase.from('document_requests').update({
      status: 'approved',
      reviewed_by: user?.id ?? null,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', docId)
    onRefresh()
  }

  async function handleReject(docId: string) {
    await supabase.from('document_requests').update({
      status: 'rejected',
      reviewed_by: user?.id ?? null,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', docId)
    onRefresh()
  }

  return (
    <section className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Documents</h2>
        {availableTypes.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setShowRequest(!showRequest)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />Request docs
          </Button>
        )}
      </div>

      {showRequest && (
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-medium">Select documents to request</p>
          <div className="grid grid-cols-2 gap-2">
            {availableTypes.map(t => (
              <label key={t} className="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox checked={selected.has(t)} onCheckedChange={() => toggleType(t)} />
                {DOC_TYPE_LABELS[t]}
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleRequest} disabled={requestLoading || !selected.size}>
              {requestLoading ? 'Sending…' : `Send request${selected.size ? ` (${selected.size})` : ''}`}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowRequest(false); setSelected(new Set()) }}>Cancel</Button>
          </div>
        </div>
      )}

      {docs.length === 0 && !showRequest && (
        <p className="text-sm text-muted-foreground">No documents requested yet.</p>
      )}

      {docs.length > 0 && (
        <div className="divide-y">
          {docs.map(doc => (
            <div key={doc.id} className="flex items-center justify-between gap-3 py-3">
              <span className="flex items-center gap-2 min-w-0 text-sm">
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{DOC_TYPE_LABELS[doc.doc_type]}</span>
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={docStatusVariant(doc.status)}>{DOC_STATUS_LABELS[doc.status]}</Badge>
                {doc.file_path && doc.file_name && (
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs"
                    onClick={() => handleView(doc.file_path!, doc.file_name!)}>
                    <Eye className="h-3 w-3 mr-1" />View
                  </Button>
                )}
                <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => startUpload(doc.id)}>
                  <Upload className="h-3 w-3 mr-1" />Upload
                </Button>
                {doc.file_path && doc.status !== 'approved' && (
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => handleApprove(doc.id)} title="Approve">
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                )}
                {doc.file_path && doc.status !== 'rejected' && (
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleReject(doc.id)} title="Reject">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />

      {/* Document viewer modal */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setViewingDoc(null)}>
          <div className="flex flex-col w-full max-w-4xl h-[90vh] rounded-xl bg-card shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3 shrink-0">
              <p className="text-sm font-medium truncate">{viewingDoc.fileName}</p>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={handleModalDownload}>
                  <Download className="h-3.5 w-3.5 mr-1.5" />Download
                </Button>
                <button onClick={() => setViewingDoc(null)} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-auto bg-muted/40 flex items-center justify-center">
              {isImage(viewingDoc.fileName) ? (
                <img src={viewingDoc.url} alt={viewingDoc.fileName} className="max-w-full max-h-full object-contain p-4" />
              ) : isPdf(viewingDoc.fileName) ? (
                <iframe src={viewingDoc.url} title={viewingDoc.fileName} className="w-full h-full border-0" />
              ) : (
                <div className="text-center space-y-3 p-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Preview not available for this file type.</p>
                  <Button variant="outline" size="sm" onClick={handleModalDownload}>
                    <Download className="h-3.5 w-3.5 mr-1.5" />Download to view
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
