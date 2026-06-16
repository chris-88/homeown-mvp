import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { canAdvancePhase1, canAssignDAC } from '@/lib/rbac'
import { LEAD_STAGE_LABELS, LEAD_STAGE_ORDER } from '@/types'
import type { Client, DocumentRequest, Event, LeadStage, StaffMember, Dac } from '@/types'
import { LEAD_STAGE_META } from '@/lib/stageMeta'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Home, Check, Copy, UserCheck, Download, Send } from 'lucide-react'
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
import type { DocumentDelivery } from '@/types'

function stageBadgeVariant(stage: LeadStage) {
  if (stage === 'eligible') return 'default' as const
  if (stage === 'not_eligible') return 'destructive' as const
  if (stage === 'deferred') return 'outline' as const
  return 'secondary' as const
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
        <DialogHeader><DialogTitle>Delete prospect</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            This permanently deletes <span className="font-medium text-foreground">{expected}</span> and all
            associated documents, events, and calculator data. This cannot be undone.
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
export default function ProspectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, staffMember } = useAuth()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [notEligOpen, setNotEligOpen] = useState(false)
  const [deferOpen, setDeferOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [disableLoading, setDisableLoading] = useState(false)
  const [stageLoading, setStageLoading] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [sendDocOpen, setSendDocOpen] = useState(false)

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

  const { data: deliveries } = useQuery<DocumentDelivery[]>({
    queryKey: ['prospect-deliveries', id],
    queryFn: async () => {
      const { data } = await supabase.from('document_deliveries').select('*').eq('client_id', id!).order('created_at', { ascending: false })
      return (data ?? []) as DocumentDelivery[]
    },
    enabled: !!id,
  })

  const { data: calcSnapshot } = useQuery<{ ghi: number | null } | null>({
    queryKey: ['prospect-snapshot', id],
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

  const refresh = () => qc.invalidateQueries({ queryKey: ['prospect', id] })
    .then(() => qc.invalidateQueries({ queryKey: ['prospect-events', id] }))

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

  async function handleStageChange(target: LeadStage, note: string) {
    if (!client) return
    setStageLoading(true)
    await supabase.from('clients').update({ lead_stage: target }).eq('id', client.id)
    await supabase.from('events').insert({
      client_id: client.id, event_type: 'stage_changed', actor_id: user?.id ?? null,
      payload: { from: client.lead_stage, to: target, note: note || null }, visibility: 'internal',
    })
    setStageLoading(false)
    refresh()
  }

  const canAdvance = canAdvancePhase1(staffMember?.role)
  const canAssign = canAssignDAC(staffMember?.role)
  const isAdmin = staffMember?.role === 'admin'
  const inPhase1Terminal = client?.lead_stage === 'not_eligible' || client?.lead_stage === 'deferred'

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>
  if (!client) return <div className="p-8 text-muted-foreground">Prospect not found.</div>

  const stageOptions = isAdmin
    ? [...LEAD_STAGE_ORDER, 'not_eligible' as LeadStage, 'deferred' as LeadStage]
    : LEAD_STAGE_ORDER

  return (
    <div className="mx-auto max-w-6xl p-8 space-y-6">
      <DetailHeader
        backTo="/app/staff/prospects"
        backLabel="Prospects"
        name={`${client.first_name} ${client.last_name}`}
        subtitle={client.email}
        active={client.active}
        isAdmin={isAdmin}
        disableLoading={disableLoading}
        onToggleActive={handleToggleActive}
        onDelete={() => setDeleteOpen(true)}
        statusBadge={
          <Badge variant={stageBadgeVariant(client.lead_stage)} className="text-sm px-3 py-1">
            {LEAD_STAGE_LABELS[client.lead_stage]}
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

              <section className="rounded-xl border bg-card p-5 space-y-5">
                <h2 className="font-semibold">Stage</h2>
                <StageTimeline
                  stages={LEAD_STAGE_ORDER}
                  labels={LEAD_STAGE_LABELS}
                  current={client.lead_stage}
                  terminal={inPhase1Terminal}
                />
                <div className="space-y-1 pt-1">
                  <p className="text-sm font-medium">{LEAD_STAGE_LABELS[client.lead_stage]}</p>
                  <p className="text-sm text-muted-foreground">{LEAD_STAGE_META[client.lead_stage].current}</p>
                  {!inPhase1Terminal && LEAD_STAGE_META[client.lead_stage].toProgress && (
                    <p className="text-sm text-muted-foreground pt-0.5">
                      <span className="font-medium text-foreground">To progress: </span>
                      {LEAD_STAGE_META[client.lead_stage].toProgress}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
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
                    onRefresh={() => qc.invalidateQueries({ queryKey: ['prospect-docs', id] })}
                  />
                </TabsContent>

                <TabsContent value="sent-docs">
                  <ProspectDeliveryLog
                    deliveries={deliveries ?? []}
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
                onAdded={() => qc.invalidateQueries({ queryKey: ['prospect-events', id] })}
              />
            </TabsContent>

            {/* Timeline */}
            <TabsContent value="timeline" className="mt-4">
              <EventTimelineTab events={events ?? []} />
            </TabsContent>

            {/* Property */}
            <TabsContent value="property" className="mt-4">
              <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
                <Home className="mx-auto mb-2 h-8 w-8 opacity-40" />
                <p>No property cases yet.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right — sidebar */}
        <aside className="space-y-6">
          {/* Stage management */}
          <StageManagementCard
            current={client.lead_stage}
            labels={LEAD_STAGE_LABELS}
            options={stageOptions}
            canChange={canAdvance}
            loading={stageLoading}
            onConfirm={handleStageChange}
            extraActions={!inPhase1Terminal && (
              <div className="flex flex-wrap gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => setDeferOpen(true)}>Defer</Button>
                <Button variant="outline" size="sm" onClick={() => setNotEligOpen(true)}
                  className="text-destructive border-destructive/40 hover:bg-destructive/5">
                  Not eligible
                </Button>
              </div>
            )}
          />

          {/* Assigned to */}
          <AssignedToCard
            assignedTo={client.assigned_to}
            staffMembers={staffMembers ?? []}
            canAssign={isAdmin || staffMember?.role === 'onboarding'}
            eligibleRoles={['onboarding']}
            onAssign={handleAssignTo}
          />

          {/* Signing pack — shown when eligible and no KFS sent yet */}
          {client.lead_stage === 'eligible' && !(deliveries ?? []).some(d => d.document_type === 'kfs') && (
            <ProspectSigningPackCard
              clientId={client.id}
              staffUserId={user?.id ?? ''}
              onSent={() => qc.invalidateQueries({ queryKey: ['prospect-deliveries', id] })}
            />
          )}

          {/* Ticket */}
          {client.target_price && calcSnapshot?.ghi ? (
            <TicketPanel propertyPrice={client.target_price} ghi={calcSnapshot.ghi} />
          ) : null}

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
          <NotEligibleModal open={notEligOpen} onClose={() => setNotEligOpen(false)} client={client} onDone={refresh} />
          <DeferModal open={deferOpen} onClose={() => setDeferOpen(false)} client={client} onDone={refresh} />
          <DeleteClientModal open={deleteOpen} onClose={() => setDeleteOpen(false)} client={client}
            onDeleted={() => navigate('/app/staff/prospects', { replace: true })} />
          {sendDocOpen && (
            <SendDocumentDrawer
              client={client}
              onClose={() => setSendDocOpen(false)}
              onSent={() => {
                setSendDocOpen(false)
                qc.invalidateQueries({ queryKey: ['prospect-deliveries', id] })
              }}
            />
          )}
        </>
      )}
    </div>
  )
}

// ── Delivery log ──────────────────────────────────────────────────────────────

function ProspectDeliveryLog({ deliveries, onSend }: { deliveries: DocumentDelivery[]; onSend: () => void }) {
  async function downloadPdf(storagePath: string) {
    const { data } = await supabase.storage.from('documents').createSignedUrl(storagePath, 3600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  if (deliveries.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
        <p className="text-sm">No documents sent to this client yet.</p>
        <Button size="sm" variant="outline" className="mt-3" onClick={onSend}>
          <Send className="h-3.5 w-3.5 mr-1.5" /> Send first document
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
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
              <td className="px-3 py-3 text-center">{d.email_log_id ? <span className="text-green-600">✓</span> : <span className="text-muted-foreground/40">—</span>}</td>
              <td className="px-3 py-3 text-center">{d.storage_path ? <span className="text-green-600">✓</span> : <span className="text-muted-foreground/40">—</span>}</td>
              <td className="px-3 py-3 text-center">{d.read_at ? <span className="text-green-600">✓</span> : <span className="text-muted-foreground/40">—</span>}</td>
              <td className="px-3 py-3 text-center">
                {!d.requires_ack ? <span className="text-muted-foreground/40">n/a</span>
                  : d.acknowledged_at ? <span className="text-green-600">✓</span>
                  : <span className="text-amber-500">!</span>}
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

// ── Signing pack card ─────────────────────────────────────────────────────────

function ProspectSigningPackCard({ clientId, staffUserId, onSent }: { clientId: string; staffUserId: string; onSent: () => void }) {
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')

  const SIGNING_PACK_TYPES = ['kfs', 'privacy-notice', 'complaints-policy', 'hpa-guidance']

  async function issue() {
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
    <div className="rounded-xl border border-brand-green/30 bg-[#ECF2EE] p-4 space-y-2">
      <p className="text-sm font-semibold text-brand-green">Signing pack</p>
      <p className="text-xs text-muted-foreground">No signing pack delivered yet. Issue KFS, Privacy Notice, Complaints Policy, and HPA Guidance.</p>
      {err && <p className="text-xs text-destructive">{err}</p>}
      <Button size="sm" onClick={issue} disabled={sending} className="w-full bg-brand-green text-brand-cream hover:bg-brand-green-light">
        {sending ? 'Sending…' : 'Issue signing pack'}
      </Button>
    </div>
  )
}
