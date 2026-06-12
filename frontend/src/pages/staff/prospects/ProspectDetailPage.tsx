import { useState } from 'react'
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
import type { Client, DocumentRequest, Event, LeadStage, StaffMember, Dac } from '@/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, ChevronRight, FileText } from 'lucide-react'

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
  const { user, staffMember } = useAuth()
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const isAdmin = staffMember?.role === 'admin'

  const next = nextLeadStage(client.lead_stage)

  // Admin can pick any forward stage
  const [targetStage, setTargetStage] = useState<LeadStage>(next ?? client.lead_stage)
  const currentIdx = STAGE_ORDER.indexOf(client.lead_stage)
  const forwardStages = STAGE_ORDER.slice(currentIdx + 1)

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
        <DialogHeader><DialogTitle>Advance stage</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{LEAD_STAGE_LABELS[client.lead_stage]}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            {isAdmin ? (
              <Select value={targetStage} onValueChange={v => setTargetStage(v as LeadStage)}>
                <SelectTrigger className="h-8 w-48 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {forwardStages.map(s => (
                    <SelectItem key={s} value={s}>{LEAD_STAGE_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge>{next ? LEAD_STAGE_LABELS[next] : '—'}</Badge>
            )}
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
          <Button onClick={handleAdvance} disabled={loading || (!next && !isAdmin)}>
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
            <section className="rounded-xl border bg-card p-5 space-y-3">
              <h2 className="font-semibold">Stage management</h2>
              <div className="flex flex-wrap gap-2">
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
                      Mark not eligible
                    </Button>
                  </>
                )}
                {inPhase1Terminal && staffMember?.role === 'admin' && (
                  <Button variant="outline" size="sm" onClick={() => setAdvanceOpen(true)}>Override stage (admin)</Button>
                )}
              </div>
              {inPhase1Terminal && staffMember?.role !== 'admin' && (
                <p className="text-sm text-muted-foreground">This prospect is in a terminal stage.</p>
              )}
            </section>
          )}

          {/* Document exceptions */}
          {docs && docs.length > 0 && (
            <section className="rounded-xl border bg-card p-5 space-y-3">
              <h2 className="font-semibold">Documents</h2>
              <div className="space-y-2">
                {docs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      {DOC_TYPE_LABELS[doc.doc_type]}
                    </span>
                    <Badge variant={doc.status === 'approved' ? 'default' : doc.status === 'rejected' ? 'destructive' : 'secondary'}>
                      {DOC_STATUS_LABELS[doc.status]}
                    </Badge>
                  </div>
                ))}
              </div>
            </section>
          )}

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
                ['Phone', client.phone ?? '—'],
                ['Target price', client.target_price ? `€${client.target_price.toLocaleString()}` : '—'],
                ['Target areas', client.target_areas ?? '—'],
                ['Household size', client.household_size ?? '—'],
                ['Deferred until', client.deferred_until ? fmtDate(client.deferred_until) : '—'],
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
