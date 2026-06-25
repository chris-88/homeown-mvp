import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { canAdvancePhase2, canAdvancePhase3 } from '@/lib/rbac'
import { PROGRAMME_STAGE_LABELS, PROPERTY_CASE_STATUS_LABELS, GONOGO_CHECK_LABELS } from '@/types'
import { nextProgrammeStage } from '@/types'
import type { Client, DocumentRequest, PropertyCase, GoNoGoChecks, GoNoGoResult, Event, StaffMember, ProgrammeStage, DocumentDelivery } from '@/types'
import { PROGRAMME_STAGE_META } from '@/lib/stageMeta'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Home, Download, Send, ExternalLink, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { DetailHeader } from '@/components/shared/DetailHeader'
import { StageTimeline } from '@/components/shared/StageTimeline'
import { StaffDocumentsSection } from '@/components/shared/StaffDocumentsSection'
import { NotesTab } from '@/components/shared/NotesTab'
import { EventTimelineTab } from '@/components/shared/EventTimelineTab'
import { AssignedToCard } from '@/components/shared/AssignedToCard'
import { StageManagementCard } from '@/components/shared/StageManagementCard'
import { TicketPanel } from '@/components/shared/TicketPanel'
import { ClientDetailsSection } from '@/components/shared/ClientDetailsSection'
import { SendDocumentDrawer } from '@/components/shared/SendDocumentDrawer'
import { getDisplayName } from '@/lib/documents/registry'

const PHASE2: ProgrammeStage[] = ['dac_assigned', 'searching', 'sale_agreed', 'conveyancing', 'contracts_signed']
const PHASE3: ProgrammeStage[] = ['in_home', 'servicing', 'exit_prep', 'option_window', 'pathway_complete', 'exited']
const ALL_PROGRAMME_STAGES: ProgrammeStage[] = [...PHASE2, ...PHASE3]
// in_home is the boundary stage: shown as the final preview step of the Property
// timeline, and as the first (active) step once the client is actually on Pathway.
const PHASE2_TIMELINE: ProgrammeStage[] = [...PHASE2, 'in_home']

function phaseBadge(stage: ProgrammeStage) {
  if (PHASE3.includes(stage)) return 'default' as const
  return 'secondary' as const
}

// ─── Delete client modal ────────────────────────────────────────────────────────
function DeleteClientModal({
  open, onClose, client, onDeleted,
}: { open: boolean; onClose: () => void; client: Client; onDeleted: () => void }) {
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const expected = `${client.first_name} ${client.last_name}`

  async function handleDelete() {
    setLoading(true); setError('')
    const { error: deleteErr } = await supabase.from('clients').delete().eq('id', client.id)
    if (deleteErr) { setError(deleteErr.message); setLoading(false); return }
    onDeleted()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Delete client</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            This permanently deletes <span className="font-medium text-foreground">{expected}</span> and all
            associated documents, property cases, and events. This cannot be undone.
          </p>
          <div>
            <label className="text-sm font-medium">Type <span className="font-mono">{expected}</span> to confirm</label>
            <Input className="mt-1" value={confirmText} onChange={e => setConfirmText(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading || confirmText !== expected}>
            {loading ? 'Deleting…' : 'Delete permanently'}
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
  const navigate = useNavigate()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [disableLoading, setDisableLoading] = useState(false)
  const [stageLoading, setStageLoading] = useState(false)
  const [sendDocOpen, setSendDocOpen] = useState(false)

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

  const { data: deliveries } = useQuery<DocumentDelivery[]>({
    queryKey: ['staff-client-deliveries', id],
    queryFn: async () => {
      const { data } = await supabase.from('document_deliveries').select('*').eq('client_id', id!).order('created_at', { ascending: false })
      return (data ?? []) as DocumentDelivery[]
    },
    enabled: !!id,
  })

  const { data: calcSnapshot } = useQuery<{ ghi: number | null } | null>({
    queryKey: ['staff-client-snapshot', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('calculator_snapshots')
        .select('ghi')
        .eq('client_id', id!)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return data as { ghi: number | null } | null
    },
    enabled: !!id,
  })

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['staff-client', id] })
    qc.invalidateQueries({ queryKey: ['staff-client-events', id] })
  }

  async function handleAssignTo(staffId: string) {
    await supabase.from('clients').update({ assigned_to: staffId || null }).eq('id', id!)
    refresh()
  }

  async function handleToggleActive() {
    if (!client) return
    setDisableLoading(true)
    await supabase.from('clients').update({ active: !client.active }).eq('id', client.id)
    await supabase.from('events').insert({
      client_id: client.id, event_type: 'staff_note', actor_id: user?.id ?? null,
      payload: { text: client.active ? 'Account disabled' : 'Account re-enabled' }, visibility: 'internal',
    })
    setDisableLoading(false)
    refresh()
  }

  async function handleStageChange(target: ProgrammeStage, note: string) {
    if (!client) return
    const fromStage = client.programme_stage!
    setStageLoading(true)
    await supabase.from('clients').update({ programme_stage: target }).eq('id', client.id)
    await supabase.from('events').insert({
      client_id: client.id, event_type: 'stage_changed', actor_id: user?.id ?? null,
      payload: { from: fromStage, to: target, note: note || null }, visibility: 'internal',
    })
    setStageLoading(false)
    const newSectionPath = PHASE2.includes(target) ? '/app/staff/property' : '/app/staff/pathway'
    const currentSectionPath = PHASE2.includes(fromStage) ? '/app/staff/property' : '/app/staff/pathway'
    if (newSectionPath !== currentSectionPath) {
      navigate(`${newSectionPath}/${client.id}`, { replace: true })
    }
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
  const isAdmin = staffMember?.role === 'admin'
  const sectionPath = isPhase2 ? '/app/staff/property' : '/app/staff/pathway'
  const sectionLabel = isPhase2 ? 'Property' : 'Pathway'

  const stageOptions = isAdmin ? ALL_PROGRAMME_STAGES : (next ? [stage, next] : [stage])

  return (
    <div className="mx-auto max-w-6xl p-8 space-y-6">
      <DetailHeader
        backTo={sectionPath}
        backLabel={sectionLabel}
        name={`${client.first_name} ${client.last_name}`}
        subtitle={client.email}
        active={client.active}
        isAdmin={isAdmin}
        disableLoading={disableLoading}
        onToggleActive={handleToggleActive}
        onDelete={() => setDeleteOpen(true)}
        statusBadge={
          <Badge variant={phaseBadge(stage)} className="text-sm px-3 py-1">
            {PROGRAMME_STAGE_LABELS[stage]}
          </Badge>
        }
      />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left — tabbed content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="property">Property</TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="mt-4 space-y-6">
              <ClientDetailsSection client={client} />

              <section className="rounded-md border bg-card p-5 space-y-5">
                <h2 className="font-semibold">Stage</h2>
                <StageTimeline
                  stages={isPhase2 ? PHASE2_TIMELINE : PHASE3}
                  labels={PROGRAMME_STAGE_LABELS}
                  current={stage}
                  terminal={isTerminal}
                />
                <div className="space-y-1 pt-1">
                  <p className="text-sm font-medium">{PROGRAMME_STAGE_LABELS[stage]}</p>
                  <p className="text-sm text-muted-foreground">{PROGRAMME_STAGE_META[stage].current}</p>
                  {!isTerminal && PROGRAMME_STAGE_META[stage].toProgress && (
                    <p className="text-sm text-muted-foreground pt-0.5">
                      <span className="font-medium text-foreground">To progress: </span>
                      {PROGRAMME_STAGE_META[stage].toProgress}
                    </p>
                  )}
                </div>
              </section>
            </TabsContent>

            {/* Documents */}
            <TabsContent value="documents" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Documents</h2>
                <Button size="sm" variant="outline" onClick={() => setSendDocOpen(true)}>
                  <Send className="h-3.5 w-3.5 mr-1.5" /> Send document
                </Button>
              </div>

              <Tabs defaultValue="client-files">
                <TabsList className="mb-3">
                  <TabsTrigger value="client-files">Client files</TabsTrigger>
                  <TabsTrigger value="sent-docs">
                    Sent documents
                    {(deliveries?.length ?? 0) > 0 && (
                      <span className="ml-1.5 text-xs text-muted-foreground">({deliveries!.length})</span>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="client-files">
                  <StaffDocumentsSection
                    clientId={client.id}
                    docs={docs ?? []}
                    onRefresh={() => qc.invalidateQueries({ queryKey: ['staff-client-docs', id] })}
                  />
                </TabsContent>

                <TabsContent value="sent-docs">
                  <DeliveryLog
                    deliveries={deliveries ?? []}
                    clientId={client.id}
                    onSend={() => setSendDocOpen(true)}
                  />
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Notes */}
            <TabsContent value="notes" className="mt-4">
              <NotesTab
                clientId={client.id}
                events={events ?? []}
                onAdded={() => qc.invalidateQueries({ queryKey: ['staff-client-events', id] })}
              />
            </TabsContent>

            {/* Timeline */}
            <TabsContent value="timeline" className="mt-4">
              <EventTimelineTab events={events ?? []} />
            </TabsContent>

            {/* Property */}
            <TabsContent value="property" className="mt-4">
              {!propertyCases?.length ? (
                <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
                  <Home className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  <p>No properties submitted yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {propertyCases.map(p => (
                    <PropertyReviewCard
                      key={p.id}
                      property={p}
                      staffMemberId={staffMember?.id ?? null}
                      onRefresh={() => qc.invalidateQueries({ queryKey: ['staff-client-properties', id] })}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right — sidebar */}
        <aside className="space-y-6">
          {/* Stage management */}
          <StageManagementCard
            current={stage}
            labels={PROGRAMME_STAGE_LABELS}
            options={stageOptions}
            canChange={canAdvance || isAdmin}
            loading={stageLoading}
            onConfirm={handleStageChange}
          />

          {/* Assigned to */}
          <AssignedToCard
            assignedTo={client.assigned_to}
            staffMembers={staffMembers ?? []}
            canAssign={isAdmin}
            eligibleRoles={isPhase2 ? ['purchasing_agent'] : ['client_success']}
            onAssign={handleAssignTo}
          />

          {/* Signing pack — shown when eligible and no KFS sent yet */}
          <SigningPackCard
            clientId={client.id}
            leadStage={client.lead_stage}
            deliveries={deliveries ?? []}
            staffUserId={user?.id ?? ''}
            onSent={() => qc.invalidateQueries({ queryKey: ['staff-client-deliveries', id] })}
          />

          {/* Ticket */}
          {client.target_price && calcSnapshot?.ghi ? (
            <TicketPanel propertyPrice={client.target_price} ghi={calcSnapshot.ghi} />
          ) : null}

          {/* DAC */}
          <div className="rounded-md border bg-card p-5 space-y-2">
            <h2 className="font-semibold text-sm">DAC</h2>
            {client.dacs ? (
              <div>
                <p className="text-sm font-medium">{client.dacs.name}</p>
                {client.dacs.cohort_label && (
                  <p className="text-xs text-muted-foreground">{client.dacs.cohort_label}</p>
                )}
                <Link to={`/app/staff/dacs/${client.dac_id}`} className="text-xs text-primary underline-offset-2 hover:underline">
                  View DAC
                </Link>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No DAC assigned.</p>
            )}
          </div>
        </aside>
      </div>

      <DeleteClientModal open={deleteOpen} onClose={() => setDeleteOpen(false)} client={client}
        onDeleted={() => navigate(sectionPath, { replace: true })} />

      {sendDocOpen && client && (
        <SendDocumentDrawer
          client={client}
          onClose={() => setSendDocOpen(false)}
          onSent={() => {
            setSendDocOpen(false)
            qc.invalidateQueries({ queryKey: ['staff-client-deliveries', id] })
          }}
        />
      )}
    </div>
  )
}

// ── Signing pack card ─────────────────────────────────────────────────────────

// ── Property review card ──────────────────────────────────────────────────────

const GONOGO_KEYS = Object.keys(GONOGO_CHECK_LABELS) as (keyof GoNoGoChecks)[]

function ResultPill({ result, onChange }: { result: GoNoGoResult | null; onChange: (r: GoNoGoResult) => void }) {
  const opts: { value: GoNoGoResult; label: string; cls: string }[] = [
    { value: 'pass', label: 'Pass', cls: 'border-brand-green text-brand-green bg-brand-green/10' },
    { value: 'flag', label: 'Flag', cls: 'border-amber-500 text-amber-600 bg-amber-50' },
    { value: 'fail', label: 'Fail', cls: 'border-destructive text-destructive bg-destructive/10' },
  ]
  return (
    <div className="flex gap-1">
      {opts.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded border px-2 py-0.5 text-xs font-medium transition-opacity ${result === o.value ? o.cls : 'border-border text-muted-foreground opacity-50 hover:opacity-80'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function statusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'go' || status === 'accepted') return 'default'
  if (status === 'no_go' || status === 'fallthrough') return 'destructive'
  if (status === 'conditional_go' || status === 'offer_submitted') return 'outline'
  return 'secondary'
}

function PropertyReviewCard({
  property, staffMemberId, onRefresh,
}: { property: PropertyCase; staffMemberId: string | null; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [checks, setChecks] = useState<Partial<GoNoGoChecks>>(() => (property.gonogo_checks as Partial<GoNoGoChecks>) ?? {})
  const [overallDecision, setOverallDecision] = useState<string>(property.gonogo_decision ?? '')
  const [gonogo_notes, setGonogoNotes] = useState(property.gonogo_notes ?? '')
  const [offerPrice, setOfferPrice] = useState(property.offer_price?.toString() ?? '')
  const [bidStatus, setBidStatus] = useState(property.bid_status ?? '')
  const [bidNotes, setBidNotes] = useState(property.bid_notes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const label = PROPERTY_CASE_STATUS_LABELS[property.status as keyof typeof PROPERTY_CASE_STATUS_LABELS] ?? property.status

  function setCheck(key: keyof GoNoGoChecks, field: 'result' | 'notes', value: string) {
    setChecks(prev => ({
      ...prev,
      [key]: { ...(prev[key] ?? { result: null, notes: '' }), [field]: value },
    }))
  }

  async function saveGoNoGo() {
    if (!overallDecision) return
    setSaving(true)
    const newStatus = overallDecision === 'no_go' ? 'no_go'
      : overallDecision === 'conditional_go' ? 'conditional_go'
      : 'go'
    await supabase.from('property_cases').update({
      gonogo_decision:     overallDecision,
      gonogo_checks:       checks,
      gonogo_notes:        gonogo_notes || null,
      gonogo_reviewed_by:  staffMemberId,
      gonogo_reviewed_at:  new Date().toISOString(),
      status:              newStatus,
      updated_at:          new Date().toISOString(),
    }).eq('id', property.id)
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
    onRefresh()
  }

  async function saveBid() {
    setSaving(true)
    const newStatus = bidStatus === 'accepted' ? 'accepted'
      : bidStatus === 'outbid' ? 'outbid'
      : bidStatus === 'vendor_withdrawn' ? 'vendor_withdrawn'
      : 'offer_submitted'
    await supabase.from('property_cases').update({
      offer_price:        offerPrice ? parseInt(offerPrice) : null,
      offer_submitted_at: bidStatus === 'offer_submitted' ? new Date().toISOString() : property.offer_submitted_at,
      bid_status:         bidStatus || null,
      bid_notes:          bidNotes || null,
      status:             newStatus,
      updated_at:         new Date().toISOString(),
    }).eq('id', property.id)
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
    onRefresh()
  }

  const canReview = ['submitted', 'under_review', 'go', 'conditional_go', 'no_go'].includes(property.status)
  const canBid    = ['go', 'conditional_go', 'offer_submitted', 'outbid'].includes(property.status)

  return (
    <div className="rounded-md border bg-card">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="font-semibold">{property.address_line_1}{property.address_line_2 ? `, ${property.address_line_2}` : ''}</p>
          <p className="text-sm text-muted-foreground">{property.city}, {property.county}{property.eircode ? ` · ${property.eircode}` : ''}</p>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
            <span>Asking {formatCurrency(property.asking_price)}</span>
            {property.property_type && <span className="capitalize">{property.property_type}</span>}
            {property.bedrooms && <span>{property.bedrooms} bed</span>}
            {property.ber_rating && <span>BER {property.ber_rating}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {property.listing_url && (
            <a href={property.listing_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ExternalLink className="h-3 w-3" />Listing
            </a>
          )}
          <Badge variant={statusBadgeVariant(property.status)}>{label}</Badge>
          <button onClick={() => setExpanded(e => !e)} className="text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {property.client_notes && (
        <div className="border-t px-4 py-2 text-sm text-muted-foreground bg-muted/30">
          <span className="font-medium text-foreground">Client note: </span>{property.client_notes}
        </div>
      )}

      {expanded && (
        <div className="border-t divide-y">
          {/* Go/No-Go Review */}
          {(canReview || property.gonogo_decision) && (
            <div className="p-4 space-y-4">
              <p className="text-sm font-semibold">Go / No-Go Review</p>
              <div className="space-y-3">
                {GONOGO_KEYS.map(key => (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm">{GONOGO_CHECK_LABELS[key]}</span>
                      <ResultPill
                        result={checks[key]?.result ?? null}
                        onChange={r => setCheck(key, 'result', r)}
                      />
                    </div>
                    <Input
                      className="h-7 text-xs"
                      placeholder="Notes (optional)"
                      value={checks[key]?.notes ?? ''}
                      onChange={e => setCheck(key, 'notes', e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Overall decision</p>
                <div className="flex gap-2">
                  {(['go', 'conditional_go', 'no_go'] as const).map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setOverallDecision(d)}
                      className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                        overallDecision === d
                          ? d === 'go' ? 'bg-brand-green text-brand-cream border-brand-green'
                            : d === 'conditional_go' ? 'bg-amber-100 text-amber-800 border-amber-400'
                            : 'bg-destructive/10 text-destructive border-destructive'
                          : 'border-border text-muted-foreground hover:border-foreground/40'
                      }`}
                    >
                      {d === 'go' ? 'Go' : d === 'conditional_go' ? 'Conditional Go' : 'No-Go'}
                    </button>
                  ))}
                </div>
                <Textarea
                  rows={2}
                  placeholder="Notes sent to client with D-06 (optional)"
                  value={gonogo_notes}
                  onChange={e => setGonogoNotes(e.target.value)}
                />
                <Button size="sm" onClick={saveGoNoGo} disabled={saving || !overallDecision}>
                  {saved ? <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Saved</> : saving ? 'Saving…' : 'Save go/no-go'}
                </Button>
              </div>
            </div>
          )}

          {/* Bid tracking */}
          {(canBid || property.bid_status) && (
            <div className="p-4 space-y-3">
              <p className="text-sm font-semibold">Bid tracking</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Offer price (€)</label>
                  <Input className="mt-1 h-8 text-sm" type="number" value={offerPrice} onChange={e => setOfferPrice(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <Select value={bidStatus} onValueChange={setBidStatus}>
                    <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="offer_submitted">Offer submitted</SelectItem>
                      <SelectItem value="outbid">Outbid</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="vendor_withdrawn">Vendor withdrawn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Input className="h-8 text-sm" placeholder="Notes (optional)" value={bidNotes} onChange={e => setBidNotes(e.target.value)} />
              <Button size="sm" onClick={saveBid} disabled={saving || !bidStatus}>
                {saved ? <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Saved</> : saving ? 'Saving…' : 'Save bid'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Signing pack card ─────────────────────────────────────────────────────────

const SIGNING_PACK_TYPES = ['kfs', 'privacy-notice', 'complaints-policy', 'hpa-guidance']
const ELIGIBLE_STAGES = new Set(['eligible', 'sale_agreed', 'in_review', 'contracts_signed', 'in_home', 'exit_prep', 'option_window', 'pathway_complete', 'exited'])

function SigningPackCard({ clientId, leadStage, deliveries, staffUserId, onSent }: {
  clientId: string
  leadStage: string | null
  deliveries: DocumentDelivery[]
  staffUserId: string
  onSent: () => void
}) {
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')

  if (!leadStage || !ELIGIBLE_STAGES.has(leadStage)) return null
  const kfsSent = deliveries.some(d => d.document_type === 'kfs')
  if (kfsSent) return null

  async function issueSigningPack() {
    setSending(true); setErr('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
      const issuedDate = new Date().toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })

      const { data: clientRow } = await supabase.from('clients').select('first_name, last_name').eq('id', clientId).single()
      const clientName = clientRow ? `${clientRow.first_name} ${clientRow.last_name}` : 'Client'

      for (const docType of SIGNING_PACK_TYPES) {
        await fetch(`${supabaseUrl}/functions/v1/deliver-document`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
          body: JSON.stringify({
            client_id: clientId,
            document_type: docType,
            variables: { clientName, issuedDate, version: docType === 'kfs' ? '0.2.2' : '0.1.0' },
            channels: 'both',
            delivered_by: staffUserId,
            idempotency_key: `signing-pack-${docType}-${clientId}-${staffUserId}`,
          }),
        })
      }
      onSent()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="rounded-md border border-brand-green/30 bg-[#ECF2EE] p-4 space-y-2">
      <p className="text-sm font-semibold text-brand-green">Signing pack</p>
      <p className="text-xs text-muted-foreground">No signing pack delivered yet. Issue KFS, Privacy Notice, Complaints Policy, and HPA Guidance.</p>
      {err && <p className="text-xs text-destructive">{err}</p>}
      <Button size="sm" onClick={issueSigningPack} disabled={sending} className="w-full bg-brand-green text-brand-cream hover:bg-brand-green-light">
        {sending ? 'Sending…' : 'Issue signing pack'}
      </Button>
    </div>
  )
}

// ── Delivery log ──────────────────────────────────────────────────────────────

function DeliveryLog({ deliveries, onSend }: { deliveries: DocumentDelivery[]; clientId: string; onSend: () => void }) {
  async function downloadPdf(storagePath: string) {
    const { data } = await supabase.storage.from('documents').createSignedUrl(storagePath, 3600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  if (deliveries.length === 0) {
    return (
      <div className="rounded-md border bg-card p-8 text-center text-muted-foreground">
        <p className="text-sm">No documents sent to this client yet.</p>
        <Button size="sm" variant="outline" className="mt-3" onClick={onSend}>
          <Send className="h-3.5 w-3.5 mr-1.5" /> Send first document
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-md border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Document</th>
            <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Sent</th>
            <th className="text-center px-3 py-2.5 font-medium text-xs text-muted-foreground">Email</th>
            <th className="text-center px-3 py-2.5 font-medium text-xs text-muted-foreground">PDF</th>
            <th className="text-center px-3 py-2.5 font-medium text-xs text-muted-foreground">Read</th>
            <th className="text-center px-3 py-2.5 font-medium text-xs text-muted-foreground">Ack</th>
            <th className="px-3 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {deliveries.map(d => (
            <tr key={d.id} className="hover:bg-muted/20">
              <td className="px-4 py-3">
                <p className="font-medium">{getDisplayName(d.document_type)}</p>
                <p className="text-xs text-muted-foreground">v{d.document_version}</p>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                {new Date(d.created_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}
              </td>
              <td className="px-3 py-3 text-center">
                {d.email_log_id ? <span className="text-primary">✓</span> : <span className="text-muted-foreground/40">—</span>}
              </td>
              <td className="px-3 py-3 text-center">
                {d.storage_path ? <span className="text-primary">✓</span> : <span className="text-muted-foreground/40">—</span>}
              </td>
              <td className="px-3 py-3 text-center">
                {d.read_at ? <span className="text-primary">✓</span> : <span className="text-muted-foreground/40">—</span>}
              </td>
              <td className="px-3 py-3 text-center">
                {!d.requires_ack
                  ? <span className="text-muted-foreground/40">n/a</span>
                  : d.acknowledged_at
                  ? <span className="text-primary">✓</span>
                  : <span className="text-brand-burgundy">!</span>
                }
              </td>
              <td className="px-3 py-3">
                {d.storage_path && (
                  <Button size="sm" variant="ghost" onClick={() => downloadPdf(d.storage_path!)} className="h-7 px-2">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
