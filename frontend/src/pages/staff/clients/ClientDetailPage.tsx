import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { canAdvancePhase2, canAdvancePhase3 } from '@/lib/rbac'
import {
  PROGRAMME_STAGE_LABELS, DOC_TYPE_LABELS, DOC_STATUS_LABELS, EVENT_TYPE_LABELS,
} from '@/types'
import { nextProgrammeStage } from '@/types'
import type { Client, DocumentRequest, PropertyCase, Event, StaffMember, ProgrammeStage } from '@/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, ChevronRight, FileText, Home } from 'lucide-react'
function fmtDateTime(s: string) {
  return new Date(s).toLocaleString('en-IE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const PHASE2: ProgrammeStage[] = ['dac_assigned', 'searching', 'sale_agreed', 'conveyancing', 'contracts_signed']
const PHASE3: ProgrammeStage[] = ['in_home', 'servicing', 'exit_prep', 'option_window', 'pathway_complete', 'exited']

function phaseBadge(stage: ProgrammeStage) {
  if (PHASE3.includes(stage)) return 'default' as const
  return 'secondary' as const
}

// ─── Stage advance modal ───────────────────────────────────────────────────────
function AdvanceModal({ open, onClose, client, onAdvanced }: {
  open: boolean; onClose: () => void; client: Client; onAdvanced: () => void
}) {
  const { user, staffMember } = useAuth()
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const isAdmin = staffMember?.role === 'admin'

  const stage = client.programme_stage!
  const allStages = [...PHASE2, ...PHASE3]
  const currentIdx = allStages.indexOf(stage)
  const forwardStages = allStages.slice(currentIdx + 1)
  const next = nextProgrammeStage(stage)
  const [targetStage, setTargetStage] = useState<ProgrammeStage>(next ?? stage)

  async function handleAdvance() {
    setLoading(true); setError('')
    const { error: updateErr } = await supabase
      .from('clients').update({ programme_stage: targetStage }).eq('id', client.id)
    if (updateErr) { setError(updateErr.message); setLoading(false); return }
    await supabase.from('events').insert({
      client_id: client.id, event_type: 'stage_changed', actor_id: user?.id ?? null,
      payload: { from: stage, to: targetStage, note: note || null }, visibility: 'internal',
    })
    onAdvanced(); onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Advance stage</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{PROGRAMME_STAGE_LABELS[stage]}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            {isAdmin ? (
              <Select value={targetStage} onValueChange={v => setTargetStage(v as ProgrammeStage)}>
                <SelectTrigger className="h-8 w-52 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {forwardStages.map(s => (
                    <SelectItem key={s} value={s}>{PROGRAMME_STAGE_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge>{next ? PROGRAMME_STAGE_LABELS[next] : '-'}</Badge>
            )}
          </div>
          <Textarea placeholder="Optional note…" value={note} onChange={e => setNote(e.target.value)} rows={3} />
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

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function StaffClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, staffMember } = useAuth()
  const qc = useQueryClient()
  const [advanceOpen, setAdvanceOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteLoading, setNoteLoading] = useState(false)

  const { data: client, isLoading } = useQuery<Client & { dacs?: { name: string; cohort_label: string | null } | null }>({
    queryKey: ['staff-client', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients').select('*, dacs(name, cohort_label)').eq('id', id!).single()
      if (error) throw error
      return data as Client & { dacs?: { name: string; cohort_label: string | null } | null }
    },
    enabled: !!id,
  })

  const { data: docs } = useQuery<DocumentRequest[]>({
    queryKey: ['staff-client-docs', id],
    queryFn: async () => {
      const { data } = await supabase.from('document_requests').select('*').eq('client_id', id!)
      return (data ?? []) as DocumentRequest[]
    },
    enabled: !!id,
  })

  const { data: propertyCases } = useQuery<PropertyCase[]>({
    queryKey: ['staff-client-properties', id],
    queryFn: async () => {
      const { data } = await supabase.from('property_cases').select('*').eq('client_id', id!).order('created_at', { ascending: false })
      return (data ?? []) as PropertyCase[]
    },
    enabled: !!id,
  })

  const { data: events } = useQuery<Event[]>({
    queryKey: ['staff-client-events', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('events').select('*').eq('client_id', id!).order('created_at', { ascending: false })
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

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['staff-client', id] })
    qc.invalidateQueries({ queryKey: ['staff-client-events', id] })
  }

  async function handleAddNote() {
    if (!noteText.trim()) return
    setNoteLoading(true)
    await supabase.from('events').insert({
      client_id: id, event_type: 'staff_note', actor_id: user?.id ?? null,
      payload: { text: noteText.trim() }, visibility: 'internal',
    })
    setNoteText('')
    setNoteLoading(false)
    qc.invalidateQueries({ queryKey: ['staff-client-events', id] })
  }

  async function handleAssignTo(staffId: string) {
    await supabase.from('clients').update({ assigned_to: staffId || null }).eq('id', id!)
    refresh()
  }

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>
  if (!client) return <div className="p-8 text-muted-foreground">Client not found.</div>

  const stage = client.programme_stage!
  const isPhase2 = PHASE2.includes(stage)
  const isPhase3 = PHASE3.includes(stage)
  const canAdvanceP2 = canAdvancePhase2(staffMember?.role)
  const canAdvanceP3 = canAdvancePhase3(staffMember?.role)
  const canAdvance = (isPhase2 && canAdvanceP2) || (isPhase3 && canAdvanceP3)
  const isTerminal = stage === 'pathway_complete' || stage === 'exited'
  const next = nextProgrammeStage(stage)

  return (
    <div className="mx-auto max-w-6xl p-8 space-y-6">
      <Link to="/app/staff/clients" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />Clients
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{client.first_name} {client.last_name}</h1>
          <p className="mt-1 text-muted-foreground">{client.email}</p>
        </div>
        <Badge variant={phaseBadge(stage)} className="text-sm px-3 py-1">
          {PROGRAMME_STAGE_LABELS[stage]}
        </Badge>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left — tabbed content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="property">Property</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="mt-4 space-y-6">
              {/* Stage management */}
              {canAdvance && !isTerminal && (
                <section className="rounded-xl border bg-card p-5 space-y-3">
                  <h2 className="font-semibold">Stage management</h2>
                  <div className="flex gap-2">
                    {next && (
                      <Button size="sm" onClick={() => setAdvanceOpen(true)}>
                        Advance to {PROGRAMME_STAGE_LABELS[next]}
                      </Button>
                    )}
                    {staffMember?.role === 'admin' && (
                      <Button variant="outline" size="sm" onClick={() => setAdvanceOpen(true)}>
                        Override stage
                      </Button>
                    )}
                  </div>
                </section>
              )}

              {/* Documents */}
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
            </TabsContent>

            {/* Property */}
            <TabsContent value="property" className="mt-4">
              {propertyCases?.length === 0 ? (
                <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
                  <Home className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  <p>No property cases yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {propertyCases?.map(p => (
                    <div key={p.id} className="rounded-xl border bg-card p-5 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{p.address_line_1}{p.address_line_2 ? `, ${p.address_line_2}` : ''}</p>
                          <p className="text-sm text-muted-foreground">{p.city}, {p.county}{p.eircode ? ` ${p.eircode}` : ''}</p>
                        </div>
                        <Badge variant="secondary">{p.status}</Badge>
                      </div>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <div><dt className="text-muted-foreground">Asking</dt><dd className="font-medium">€{p.asking_price.toLocaleString()}</dd></div>
                        {p.agreed_price && <div><dt className="text-muted-foreground">Agreed</dt><dd className="font-medium">€{p.agreed_price.toLocaleString()}</dd></div>}
                        {p.valuation_amount && <div><dt className="text-muted-foreground">Valuation</dt><dd className="font-medium">€{p.valuation_amount.toLocaleString()}</dd></div>}
                      </dl>
                      {p.notes && <p className="text-sm text-muted-foreground">{p.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Timeline */}
            <TabsContent value="timeline" className="mt-4">
              <div className="rounded-xl border bg-card p-5 space-y-3">
                {events?.length === 0 && <p className="text-sm text-muted-foreground">No events yet.</p>}
                {events?.map(ev => (
                  <div key={ev.id} className="flex gap-3 text-sm">
                    <span className="mt-1.5 flex h-2 w-2 shrink-0 rounded-full bg-muted-foreground/40" />
                    <div>
                      <p className="font-medium">
                        {ev.event_type === 'staff_note'
                          ? (ev.payload as { text: string })?.text
                          : ev.event_type === 'stage_changed'
                            ? `Stage: ${(PROGRAMME_STAGE_LABELS as Record<string, string>)[(ev.payload as Record<string, string>)?.from] ?? '?'} → ${(PROGRAMME_STAGE_LABELS as Record<string, string>)[(ev.payload as Record<string, string>)?.to] ?? '?'}`
                            : EVENT_TYPE_LABELS[ev.event_type] ?? ev.event_type}
                      </p>
                      <p className="text-xs text-muted-foreground">{fmtDateTime(ev.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right — sidebar */}
        <aside className="space-y-6">
          {/* Details */}
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <h2 className="font-semibold text-sm">Details</h2>
            <dl className="space-y-2 text-sm">
              {[
                ['Phone', client.phone ?? '-'],
                ['Target price', client.target_price ? `€${client.target_price.toLocaleString()}` : '-'],
                ['Target areas', client.target_areas ?? '-'],
                ['Joined', fmtDateTime(client.created_at)],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between gap-2">
                  <dt className="text-muted-foreground shrink-0">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* DAC */}
          <div className="rounded-xl border bg-card p-5 space-y-2">
            <h2 className="font-semibold text-sm">DAC</h2>
            {(client as any).dacs ? (
              <div>
                <p className="text-sm font-medium">{(client as any).dacs.name}</p>
                {(client as any).dacs.cohort_label && (
                  <p className="text-xs text-muted-foreground">{(client as any).dacs.cohort_label}</p>
                )}
                <Link to={`/app/staff/dacs/${client.dac_id}`} className="text-xs text-primary underline-offset-2 hover:underline">
                  View DAC
                </Link>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No DAC assigned.</p>
            )}
          </div>

          {/* Assigned to */}
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <h2 className="font-semibold text-sm">Assigned to</h2>
            {staffMember?.role === 'admin' ? (
              <Select value={client.assigned_to ?? 'none'} onValueChange={v => handleAssignTo(v === 'none' ? '' : v)}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {staffMembers?.filter(s =>
                    (isPhase2 && (s.role === 'purchasing_agent' || s.role === 'admin')) ||
                    (isPhase3 && (s.role === 'client_success' || s.role === 'admin'))
                  ).map(s => (
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
        </aside>
      </div>

      {client.programme_stage && (
        <AdvanceModal open={advanceOpen} onClose={() => setAdvanceOpen(false)} client={client} onAdvanced={refresh} />
      )}
    </div>
  )
}
