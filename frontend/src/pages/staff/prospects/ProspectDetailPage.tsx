import { useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { canAdvancePhase1, canAssignDAC } from '@/lib/rbac'
import {
  LEAD_STAGE_LABELS, DOC_TYPE_LABELS, DOC_STATUS_LABELS,
  EVENT_TYPE_LABELS, LEAD_STAGE_ORDER as STAGE_ORDER,
} from '@/types'
import { nextLeadStage } from '@/types'
import type { Client, DocumentRequest, Event, LeadStage, StaffMember, Dac, DocType, DocStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, ChevronRight, FileText, Check, Copy, UserCheck, Plus, Upload, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

// Stage meta — what's true now and what needs to happen to progress
const STAGE_META: Record<LeadStage, { current: string; toProgress: string; nextPreview: string }> = {
  new_lead: {
    current: 'This prospect has submitted the calculator. No discovery call has been scheduled yet.',
    toProgress: 'Contact the prospect and schedule a discovery call.',
    nextPreview: 'The prospect moves into active discovery. A confirmation is sent and the call is logged.',
  },
  in_discovery: {
    current: 'A discovery call has been booked or is in progress with this prospect.',
    toProgress: 'Hold the discovery call and confirm the prospect wants to proceed to pre-qualification.',
    nextPreview: 'Documents are requested from the prospect and their application enters pre-qualification.',
  },
  pre_qual: {
    current: 'Document collection is underway. The prospect has been asked to upload their required files.',
    toProgress: 'Receive all required documents from the prospect.',
    nextPreview: 'The full application enters internal review by the team.',
  },
  in_review: {
    current: 'All documents have been received and the application is under internal review.',
    toProgress: 'Complete the internal review and confirm the prospect meets all eligibility criteria.',
    nextPreview: 'The prospect is confirmed as eligible. They can then be matched with a DAC to begin Phase 2.',
  },
  eligible: {
    current: 'This prospect has been confirmed as eligible for the Homeown pathway.',
    toProgress: 'Assign the prospect to an available DAC to move them into Phase 2.',
    nextPreview: 'The prospect enters Phase 2 and begins their property search.',
  },
  not_eligible: {
    current: 'This prospect has been marked as not eligible and is outside the active funnel.',
    toProgress: '',
    nextPreview: '',
  },
  deferred: {
    current: 'This prospect has been deferred and will be revisited at a later date.',
    toProgress: '',
    nextPreview: '',
  },
}

const MAIN_STAGES: LeadStage[] = ['new_lead', 'in_discovery', 'pre_qual', 'in_review', 'eligible']

function StageTimeline({ current }: { current: LeadStage }) {
  const currentIdx = MAIN_STAGES.indexOf(current)
  const isTerminal = current === 'not_eligible' || current === 'deferred'

  return (
    <div className="flex items-center gap-0">
      {MAIN_STAGES.map((stage, i) => {
        const done = !isTerminal && currentIdx > i
        const active = !isTerminal && currentIdx === i
        return (
          <div key={stage} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                done ? 'bg-brand-green border-brand-green text-white'
                  : active ? 'bg-white border-brand-green text-brand-green'
                    : isTerminal ? 'bg-white border-muted-foreground/20 text-muted-foreground/40'
                      : 'bg-white border-muted-foreground/30 text-muted-foreground/40',
              )}>
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={cn(
                'text-[10px] font-medium text-center leading-tight whitespace-nowrap',
                active ? 'text-brand-green' : done ? 'text-foreground' : 'text-muted-foreground/50',
              )}>
                {LEAD_STAGE_LABELS[stage]}
              </span>
            </div>
            {i < MAIN_STAGES.length - 1 && (
              <div className={cn(
                'h-0.5 flex-1 mx-1 mb-4',
                done ? 'bg-brand-green' : 'bg-muted-foreground/15',
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function fmtDateTime(s: string) {
  return new Date(s).toLocaleString('en-IE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })
}

function stageBadgeVariant(stage: LeadStage) {
  if (stage === 'eligible') return 'default' as const
  if (stage === 'not_eligible') return 'destructive' as const
  if (stage === 'deferred') return 'outline' as const
  return 'secondary' as const
}

// ─── Stage advance modal ───────────────────────────────────────────────────────
function AdvanceModal({
  open, onClose, client, onAdvanced,
}: { open: boolean; onClose: () => void; client: Client; onAdvanced: () => void }) {
  const { user } = useAuth()
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const next = nextLeadStage(client.lead_stage)
  const otherStages = STAGE_ORDER.filter(s => s !== client.lead_stage)
  const [targetStage, setTargetStage] = useState<LeadStage>(next ?? otherStages[0] ?? client.lead_stage)

  async function handleAdvance() {
    setLoading(true); setError('')
    const { error: updateErr } = await supabase
      .from('clients').update({ lead_stage: targetStage }).eq('id', client.id)
    if (updateErr) { setError(updateErr.message); setLoading(false); return }
    await supabase.from('events').insert({
      client_id: client.id,
      event_type: 'stage_changed',
      actor_id: user?.id ?? null,
      payload: { from: client.lead_stage, to: targetStage, note: note || null },
      visibility: 'internal',
    })
    onAdvanced(); onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Change stage</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{LEAD_STAGE_LABELS[client.lead_stage]}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Select value={targetStage} onValueChange={v => setTargetStage(v as LeadStage)}>
              <SelectTrigger className="h-8 w-48 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {otherStages.map(s => (
                  <SelectItem key={s} value={s}>{LEAD_STAGE_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            placeholder="Optional note (recorded internally)…"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAdvance} disabled={loading}>
            {loading ? 'Saving…' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Not eligible modal ────────────────────────────────────────────────────────
function NotEligibleModal({
  open, onClose, client, onDone,
}: { open: boolean; onClose: () => void; client: Client; onDone: () => void }) {
  const { user } = useAuth()
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    await supabase.from('clients').update({ lead_stage: 'not_eligible' }).eq('id', client.id)
    await supabase.from('events').insert({
      client_id: client.id, event_type: 'stage_changed', actor_id: user?.id ?? null,
      payload: { from: client.lead_stage, to: 'not_eligible', reason: reason || null },
      visibility: 'internal',
    })
    onDone(); onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Mark as not eligible</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">This will move the prospect out of the active funnel.</p>
          <Textarea placeholder="Reason (optional, recorded internally)…" value={reason} onChange={e => setReason(e.target.value)} rows={3} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>{loading ? 'Saving…' : 'Mark not eligible'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Defer modal ───────────────────────────────────────────────────────────────
function DeferModal({
  open, onClose, client, onDone,
}: { open: boolean; onClose: () => void; client: Client; onDone: () => void }) {
  const { user } = useAuth()
  const [until, setUntil] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    await supabase.from('clients').update({ lead_stage: 'deferred', deferred_until: until || null }).eq('id', client.id)
    await supabase.from('events').insert({
      client_id: client.id, event_type: 'stage_changed', actor_id: user?.id ?? null,
      payload: { from: client.lead_stage, to: 'deferred', until: until || null, reason: reason || null },
      visibility: 'internal',
    })
    onDone(); onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Defer prospect</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Review date <span className="text-muted-foreground">(optional)</span></label>
            <Input type="date" value={until} onChange={e => setUntil(e.target.value)} className="mt-1" />
          </div>
          <Textarea placeholder="Reason (recorded internally)…" value={reason} onChange={e => setReason(e.target.value)} rows={3} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={loading}>{loading ? 'Saving…' : 'Defer'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Staff documents section ───────────────────────────────────────────────────
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

function StaffDocumentsSection({
  clientId, docs, onRefresh,
}: { clientId: string; docs: DocumentRequest[]; onRefresh: () => void }) {
  const [showRequest, setShowRequest] = useState(false)
  const [selected, setSelected] = useState<Set<DocType>>(new Set())
  const [requestLoading, setRequestLoading] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
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

  async function handleDownload(filePath: string, fileName: string) {
    const { data } = await supabase.storage.from('documents').createSignedUrl(filePath, 300)
    if (data?.signedUrl) {
      const a = document.createElement('a')
      a.href = data.signedUrl; a.download = fileName; a.click()
    }
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
                    onClick={() => handleDownload(doc.file_path!, doc.file_name!)}>
                    <Download className="h-3 w-3 mr-1" />{doc.file_name}
                  </Button>
                )}
                <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => startUpload(doc.id)}>
                  <Upload className="h-3 w-3 mr-1" />Upload
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
    </section>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function ProspectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, staffMember } = useAuth()
  const qc = useQueryClient()
  const [advanceOpen, setAdvanceOpen] = useState(false)
  const [notEligOpen, setNotEligOpen] = useState(false)
  const [deferOpen, setDeferOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteLoading, setNoteLoading] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  function copyPortalLink() {
    if (!client) return
    const url = `${window.location.origin}/#/auth/signup?email=${encodeURIComponent(client.email)}`
    navigator.clipboard.writeText(url)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const { data: client, isLoading } = useQuery<Client>({
    queryKey: ['prospect', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('*').eq('id', id!).single()
      if (error) throw error
      return data as Client
    },
    enabled: !!id,
  })

  const { data: docs } = useQuery<DocumentRequest[]>({
    queryKey: ['prospect-docs', id],
    queryFn: async () => {
      const { data } = await supabase.from('document_requests').select('*').eq('client_id', id!)
      return (data ?? []) as DocumentRequest[]
    },
    enabled: !!id,
  })

  const { data: events } = useQuery<Event[]>({
    queryKey: ['prospect-events', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('events').select('*').eq('client_id', id!)
        .order('created_at', { ascending: false })
      return (data ?? []) as Event[]
    },
    enabled: !!id,
  })

  const { data: staffMembers } = useQuery<StaffMember[]>({
    queryKey: ['staff-members'],
    queryFn: async () => {
      const { data } = await supabase.from('staff_members').select('*').eq('active', true).order('first_name')
      return (data ?? []) as StaffMember[]
    },
  })

  const { data: allDacs } = useQuery<Dac[]>({
    queryKey: ['all-dacs'],
    queryFn: async () => {
      const { data } = await supabase.from('dacs').select('id, name, cohort_label, status').order('name')
      return (data ?? []) as Dac[]
    },
  })

  const refresh = () => qc.invalidateQueries({ queryKey: ['prospect', id] })
    .then(() => qc.invalidateQueries({ queryKey: ['prospect-events', id] }))

  async function handleAddNote() {
    if (!noteText.trim()) return
    setNoteLoading(true)
    await supabase.from('events').insert({
      client_id: id, event_type: 'staff_note', actor_id: user?.id ?? null,
      payload: { text: noteText.trim() }, visibility: 'internal',
    })
    setNoteText('')
    setNoteLoading(false)
    qc.invalidateQueries({ queryKey: ['prospect-events', id] })
  }

  async function handleAssignTo(staffId: string) {
    await supabase.from('clients').update({ assigned_to: staffId || null }).eq('id', id!)
    refresh()
  }

  const canAdvance = canAdvancePhase1(staffMember?.role)
  const canAssign = canAssignDAC(staffMember?.role)
  const inPhase1Terminal = client?.lead_stage === 'not_eligible' || client?.lead_stage === 'deferred'
  const nextStage = client ? nextLeadStage(client.lead_stage) : null

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>
  if (!client) return <div className="p-8 text-muted-foreground">Prospect not found.</div>

  return (
    <div className="mx-auto max-w-6xl p-8 space-y-6">
      <Link to="/app/staff/prospects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />Prospects
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{client.first_name} {client.last_name}</h1>
          <p className="mt-1 text-muted-foreground">{client.email}</p>
        </div>
        <Badge variant={stageBadgeVariant(client.lead_stage)} className="text-sm px-3 py-1">
          {LEAD_STAGE_LABELS[client.lead_stage]}
        </Badge>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left — main content */}
        <div className="lg:col-span-2 space-y-8">

          {/* Stage management */}
          {canAdvance && (
            <section className="rounded-xl border bg-card p-5 space-y-5">
              <h2 className="font-semibold">Stage</h2>

              {/* Timeline */}
              <StageTimeline current={client.lead_stage} />

              {/* Current stage description */}
              <div className="space-y-1 pt-1">
                <p className="text-sm font-medium">{LEAD_STAGE_LABELS[client.lead_stage]}</p>
                <p className="text-sm text-muted-foreground">{STAGE_META[client.lead_stage].current}</p>
                {!inPhase1Terminal && STAGE_META[client.lead_stage].toProgress && (
                  <p className="text-sm text-muted-foreground pt-0.5">
                    <span className="font-medium text-foreground">To progress: </span>
                    {STAGE_META[client.lead_stage].toProgress}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                {!inPhase1Terminal && nextStage && (
                  <Button onClick={() => setAdvanceOpen(true)} size="sm">
                    Advance to {LEAD_STAGE_LABELS[nextStage]}
                  </Button>
                )}
                {!inPhase1Terminal && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setDeferOpen(true)}>Defer</Button>
                    <Button variant="outline" size="sm" onClick={() => setNotEligOpen(true)}
                      className="text-destructive border-destructive/40 hover:bg-destructive/5">
                      Not eligible
                    </Button>
                  </>
                )}
                {client.user_id ? (
                  <Button variant="outline" size="sm" disabled className="text-green-700 border-green-200 bg-green-50 opacity-100">
                    <UserCheck className="h-3.5 w-3.5 mr-1.5" />Portal active
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={copyPortalLink}>
                    {linkCopied ? <Check className="h-3.5 w-3.5 mr-1.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                    {linkCopied ? 'Copied!' : 'Copy portal link'}
                  </Button>
                )}
                {inPhase1Terminal && (
                  <Button variant="outline" size="sm" onClick={() => setAdvanceOpen(true)}>Change stage</Button>
                )}
              </div>

              {/* Next stage preview */}
              {!inPhase1Terminal && nextStage && STAGE_META[client.lead_stage].nextPreview && (
                <div className="rounded-lg bg-muted/50 px-4 py-3 space-y-0.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Next: {LEAD_STAGE_LABELS[nextStage]}
                  </p>
                  <p className="text-sm text-muted-foreground">{STAGE_META[client.lead_stage].nextPreview}</p>
                </div>
              )}

              {inPhase1Terminal && staffMember?.role !== 'admin' && (
                <p className="text-sm text-muted-foreground">This prospect is in a terminal stage.</p>
              )}
            </section>
          )}

          {/* Documents */}
          <StaffDocumentsSection
            clientId={client.id}
            docs={docs ?? []}
            onRefresh={() => qc.invalidateQueries({ queryKey: ['prospect-docs', id] })}
          />

          {/* Notes */}
          <section className="rounded-xl border bg-card p-5 space-y-4">
            <h2 className="font-semibold">Notes</h2>
            <div className="space-y-2">
              <Textarea
                placeholder="Add an internal note…"
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                rows={3}
              />
              <Button size="sm" onClick={handleAddNote} disabled={noteLoading || !noteText.trim()}>
                {noteLoading ? 'Saving…' : 'Add note'}
              </Button>
            </div>
          </section>

          {/* Timeline */}
          <section className="rounded-xl border bg-card p-5 space-y-3">
            <h2 className="font-semibold">Timeline</h2>
            {events?.length === 0 && <p className="text-sm text-muted-foreground">No events yet.</p>}
            <div className="space-y-3">
              {events?.map(ev => (
                <div key={ev.id} className="flex gap-3 text-sm">
                  <span className="mt-0.5 flex h-2 w-2 shrink-0 rounded-full bg-muted-foreground/40 mt-1.5" />
                  <div>
                    <p className="font-medium">
                      {ev.event_type === 'staff_note'
                        ? (ev.payload as { text: string })?.text
                        : ev.event_type === 'stage_changed'
                          ? `Stage: ${LEAD_STAGE_LABELS[(ev.payload as { from: LeadStage })?.from] ?? '?'} → ${LEAD_STAGE_LABELS[(ev.payload as { to: LeadStage })?.to] ?? '?'}`
                          : EVENT_TYPE_LABELS[ev.event_type] ?? ev.event_type}
                    </p>
                    <p className="text-xs text-muted-foreground">{fmtDateTime(ev.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right — sidebar */}
        <aside className="space-y-6">
          {/* Client details */}
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <h2 className="font-semibold text-sm">Details</h2>
            <dl className="space-y-2 text-sm">
              {[
                ['Phone', client.phone ?? '-'],
                ['Target price', client.target_price ? `€${client.target_price.toLocaleString()}` : '-'],
                ['Target areas', client.target_areas ?? '-'],
                ['Household size', client.household_size ?? '-'],
                ['Deferred until', client.deferred_until ? fmtDate(client.deferred_until) : '-'],
                ['Joined', fmtDate(client.created_at)],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between gap-2">
                  <dt className="text-muted-foreground shrink-0">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Assigned to */}
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <h2 className="font-semibold text-sm">Assigned to</h2>
            {staffMember?.role === 'admin' || staffMember?.role === 'onboarding' ? (
              <Select value={client.assigned_to ?? 'none'} onValueChange={v => handleAssignTo(v === 'none' ? '' : v)}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {staffMembers?.filter(s => s.role === 'onboarding' || s.role === 'admin').map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">
                {staffMembers?.find(s => s.id === client.assigned_to)?.first_name ?? 'Unassigned'}
              </p>
            )}
          </div>

          {/* Assign to DAC (finance + admin when eligible) */}
          {canAssign && client.lead_stage === 'eligible' && (
            <div className="rounded-xl border bg-card p-5 space-y-3">
              <h2 className="font-semibold text-sm">Assign to DAC</h2>
              <Select
                value={client.dac_id ?? 'none'}
                onValueChange={async v => {
                  await supabase.from('clients').update({ dac_id: v === 'none' ? null : v, programme_stage: v === 'none' ? null : 'dac_assigned' }).eq('id', client.id!)
                  refresh()
                }}
              >
                <SelectTrigger className="text-sm"><SelectValue placeholder="No DAC assigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No DAC</SelectItem>
                  {allDacs?.filter(d => d.status === 'open' || d.status === 'closed').map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}{d.cohort_label ? ` (${d.cohort_label})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Assigning a DAC moves this prospect to Phase 2.</p>
            </div>
          )}
        </aside>
      </div>

      {/* Modals */}
      {client && (
        <>
          <AdvanceModal open={advanceOpen} onClose={() => setAdvanceOpen(false)} client={client} onAdvanced={refresh} />
          <NotEligibleModal open={notEligOpen} onClose={() => setNotEligOpen(false)} client={client} onDone={refresh} />
          <DeferModal open={deferOpen} onClose={() => setDeferOpen(false)} client={client} onDone={refresh} />
        </>
      )}
    </div>
  )
}
