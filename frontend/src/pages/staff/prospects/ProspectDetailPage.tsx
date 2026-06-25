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
import { Home, Check, Copy, UserCheck, Download, Send, Ban, RotateCcw, Trash2 } from 'lucide-react'
import { DetailHeader } from '@/components/shared/DetailHeader'
import { StageTimeline } from '@/components/shared/StageTimeline'
import { StaffDocumentsSection } from '@/components/shared/StaffDocumentsSection'
import { NotesTab } from '@/components/shared/NotesTab'
import { EventTimelineTab } from '@/components/shared/EventTimelineTab'
import { ClientDetailsSection } from '@/components/shared/ClientDetailsSection'
import { SendDocumentDrawer } from '@/components/shared/SendDocumentDrawer'
import { ROI_COUNTIES, DUBLIN_POSTCODES } from '@/lib/calcWizard'
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
    if (client.user_id) {
      const session = (await supabase.auth.getSession()).data.session
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-auth-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ user_id: client.user_id }),
      }).catch(err => console.warn('delete-auth-user failed:', err))
    }
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

// ─── D-02 discovery summary dialog ───────────────────────────────────────────
function D02SendDialog({
  open, onClose, client, calcSnapshot, staffMember, onDone,
}: {
  open: boolean
  onClose: () => void
  client: Client
  calcSnapshot: { property_price: number | null } | null
  staffMember: { first_name: string; last_name: string; id: string } | null
  onDone: () => void
}) {
  const { user } = useAuth()
  const [propertyPrice, setPropertyPrice] = useState<number>(calcSnapshot?.property_price ?? 0)
  const [discoveryDateStr, setDiscoveryDateStr] = useState<string>(() => {
    const base = client.appointment_at ? new Date(client.appointment_at) : new Date()
    return base.toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const price = Number(propertyPrice) || 0
  const domiter    = Math.round((price * 0.082) / 12)
  const entryStake = Math.round(price * 0.01)
  const strikePrice = Math.round(price * 0.90)

  function fmt(n: number) { return `€${n.toLocaleString('en-IE')}` }

  function displayDate(str: string) {
    if (!str) return ''
    return new Date(`${str}T12:00:00`).toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const staffName  = staffMember ? `${staffMember.first_name} ${staffMember.last_name}` : 'The Homeown Team'
  const clientName = `${client.first_name} ${client.last_name}`

  async function handleConfirm() {
    if (!price) { setError('Please enter a target property price.'); return }
    setLoading(true); setError('')

    // Advance stage — DB trigger fires D-03 automatically
    await supabase.from('clients').update({ lead_stage: 'pre_qual' }).eq('id', client.id)
    await supabase.from('events').insert({
      client_id: client.id, event_type: 'stage_changed', actor_id: user?.id ?? null,
      payload: { from: client.lead_stage, to: 'pre_qual', note: 'D-02 sent; D-03 auto-queued' },
      visibility: 'internal',
    })

    // Send D-02 discovery summary
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deliver-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
      body: JSON.stringify({
        client_id: client.id,
        document_type: 'd02-discovery-summary',
        variables: {
          clientName,
          staffName,
          discoveryDate: displayDate(discoveryDateStr),
          targetPriceBand: fmt(price),
          domiterExample: `${fmt(domiter)} per month`,
          entryStakeExample: fmt(entryStake),
          strikePriceExample: fmt(strikePrice),
          nextStep: 'book-follow-up',
        },
        channels: 'both',
        idempotency_key: `d02-${client.id}-${discoveryDateStr}`,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      setError(`D-02 send failed: ${body.slice(0, 120)}`)
      setLoading(false)
      return
    }

    setLoading(false); onDone(); onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Advance to Pre-Qualification</DialogTitle></DialogHeader>
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Confirm the numbers below. A Discovery Summary (D-02) will be sent to the client and document collection (D-03) will start automatically.
          </p>
          <div>
            <label className="text-sm font-medium">Target property price (€)</label>
            <Input
              type="number"
              className="mt-1"
              value={propertyPrice || ''}
              onChange={e => setPropertyPrice(Number(e.target.value))}
              placeholder="e.g. 350000"
            />
          </div>
          {price > 0 && (
            <div className="rounded-md border bg-muted/40 p-3 space-y-1.5">
              <div className="flex justify-between"><span className="text-muted-foreground">Monthly service fee</span><span className="font-medium">{fmt(domiter)}/mo</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Entry Stake (once)</span><span className="font-medium">{fmt(entryStake)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Option price</span><span className="font-medium">{fmt(strikePrice)}</span></div>
            </div>
          )}
          <div>
            <label className="text-sm font-medium">Discovery date</label>
            <Input type="date" className="mt-1" value={discoveryDateStr} onChange={e => setDiscoveryDateStr(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Conducted by</label>
            <Input className="mt-1" value={staffName} readOnly />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={loading || !price}>
            {loading ? 'Sending…' : 'Send D-02 & advance'}
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
  const [d02DialogOpen, setD02DialogOpen] = useState(false)
  const [disableLoading, setDisableLoading] = useState(false)
  const [stageLoading, setStageLoading] = useState(false)
  const [stageClickPending, setStageClickPending] = useState<LeadStage | null>(null)
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

  const { data: calcSnapshot } = useQuery<{
    id: string
    property_price: number | null
    ghi: number | null
    age: number | null
    household_type: string | null
    is_ftb: boolean | null
    employment_type: string | null
    county: string | null
    dublin_postcode: string | null
    current_housing_cost: number | null
    current_savings: number | null
    monthly_savings: number | null
  } | null>({
    queryKey: ['prospect-snapshot', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('calculator_snapshots')
        .select('id, property_price, ghi, age, household_type, is_ftb, employment_type, county, dublin_postcode, current_housing_cost, current_savings, monthly_savings')
        .eq('client_id', id!)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return data
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
    if (target === 'in_discovery') {
      const { data: { session } } = await supabase.auth.getSession()
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-booking-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ client_id: client.id }),
      })
    }
    setStageLoading(false)
    refresh()
  }

  const canAdvance = canAdvancePhase1(staffMember?.role)
  const canAssign = canAssignDAC(staffMember?.role)
  const isAdmin = staffMember?.role === 'admin'
  const inPhase1Terminal = client?.lead_stage === 'not_eligible' || client?.lead_stage === 'deferred'

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>
  if (!client) return <div className="p-8 text-muted-foreground">Prospect not found.</div>

  return (
    <div className="mx-auto max-w-6xl p-8 space-y-6">
      <DetailHeader
        backTo="/app/staff/prospects"
        backLabel="Prospects"
        name={`${client.first_name} ${client.last_name}`}
        active={client.active}
        isAdmin={isAdmin}
        hideAdminButtons
        disableLoading={disableLoading}
        onToggleActive={handleToggleActive}
        onDelete={() => setDeleteOpen(true)}
        statusBadge={
          <Badge variant={stageBadgeVariant(client.lead_stage)} className="text-sm px-3 py-1">
            {LEAD_STAGE_LABELS[client.lead_stage]}
          </Badge>
        }
      />

      <Tabs defaultValue="overview">
            <div className="flex items-center justify-between gap-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="ticket">Ticket</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="property">Property</TabsTrigger>
              </TabsList>
              <Select
                value={client.assigned_to ?? 'none'}
                onValueChange={v => handleAssignTo(v === 'none' ? '' : v)}
                disabled={!(isAdmin || staffMember?.role === 'onboarding')}
              >
                <SelectTrigger className="h-8 text-xs w-40 shrink-0">
                  <SelectValue placeholder="Not assigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not assigned</SelectItem>
                  {staffMembers
                    ?.filter(s => s.role === 'onboarding' || s.role === 'admin')
                    .map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Overview */}
            <TabsContent value="overview" className="mt-4 space-y-6">
              <ClientDetailsSection client={client} snapshot={calcSnapshot} />

              <section className="rounded-md border bg-card p-5 space-y-4">
                <Badge variant={stageBadgeVariant(client.lead_stage)} className="text-xs">
                  {LEAD_STAGE_LABELS[client.lead_stage]}
                </Badge>
                <StageTimeline
                  stages={LEAD_STAGE_ORDER}
                  labels={LEAD_STAGE_LABELS}
                  current={client.lead_stage}
                  terminal={inPhase1Terminal}
                  onStageClick={canAdvance && !inPhase1Terminal ? s => setStageClickPending(s) : undefined}
                />
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">{LEAD_STAGE_META[client.lead_stage].current}</p>
                  {!inPhase1Terminal && LEAD_STAGE_META[client.lead_stage].toProgress && (
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">To progress: </span>
                      {LEAD_STAGE_META[client.lead_stage].toProgress}
                    </p>
                  )}
                </div>
                {stageClickPending && stageClickPending !== client.lead_stage && (
                  <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Move to</span>
                    <span className="font-medium">{LEAD_STAGE_LABELS[stageClickPending]}</span>
                    <span className="text-muted-foreground">?</span>
                    <div className="ml-auto flex gap-2">
                      <Button size="sm" onClick={async () => {
                        if (stageClickPending === 'pre_qual') {
                          setD02DialogOpen(true)
                        } else {
                          await handleStageChange(stageClickPending, '')
                          setStageClickPending(null)
                        }
                      }} disabled={stageLoading}>
                        {stageLoading ? '…' : stageClickPending === 'pre_qual' ? 'Send D-02 & advance →' : 'Confirm'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setStageClickPending(null)}>Cancel</Button>
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-1 border-t">
                  {client.user_id ? (
                    <Button variant="outline" size="sm" disabled className="text-green-700 border-green-200 bg-green-50 opacity-100">
                      <UserCheck className="h-3.5 w-3.5 mr-1.5" />Portal active
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={copyPortalLink}>
                      {linkCopied ? <Check className="h-3.5 w-3.5 mr-1.5 text-primary" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                      {linkCopied ? 'Copied!' : 'Copy portal link'}
                    </Button>
                  )}
                  {!inPhase1Terminal && canAdvance && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setDeferOpen(true)}>Defer</Button>
                      <Button variant="outline" size="sm" className="text-destructive border-destructive/40 hover:bg-destructive/5" onClick={() => setNotEligOpen(true)}>
                        Not eligible
                      </Button>
                    </>
                  )}
                  {isAdmin && (
                    <>
                      <Button variant="outline" size="sm" onClick={handleToggleActive} disabled={disableLoading}>
                        {disableLoading ? '…' : client.active
                          ? <><Ban className="h-3.5 w-3.5 mr-1.5" />Disable</>
                          : <><RotateCcw className="h-3.5 w-3.5 mr-1.5" />Enable</>}
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive border-destructive/40 hover:bg-destructive/5" onClick={() => setDeleteOpen(true)}>
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />Delete
                      </Button>
                    </>
                  )}
                </div>
              </section>

              {/* Assign to DAC */}
              {canAssign && client.lead_stage === 'eligible' && (
                <section className="rounded-md border bg-card p-5 space-y-3">
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
                </section>
              )}
            </TabsContent>

            {/* Ticket */}
            <TabsContent value="ticket" className="mt-4">
              <ProspectTicketTab
                clientId={client.id}
                targetPrice={client.target_price}
                snapshot={calcSnapshot ?? null}
                phone={client.phone}
                appointmentAt={client.appointment_at}
                onSaved={refresh}
              />
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
                  <ProspectDeliveryLog deliveries={deliveries ?? []} onSend={() => setSendDocOpen(true)} />
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Notes */}
            <TabsContent value="notes" className="mt-4">
              <NotesTab clientId={client.id} events={events ?? []} onAdded={() => qc.invalidateQueries({ queryKey: ['prospect-events', id] })} />
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

      {/* Modals */}
      {client && (
        <>
          <NotEligibleModal open={notEligOpen} onClose={() => setNotEligOpen(false)} client={client} onDone={refresh} />
          <DeferModal open={deferOpen} onClose={() => setDeferOpen(false)} client={client} onDone={refresh} />
          <D02SendDialog
            open={d02DialogOpen}
            onClose={() => { setD02DialogOpen(false); setStageClickPending(null) }}
            client={client}
            calcSnapshot={calcSnapshot ?? null}
            staffMember={staffMember ?? null}
            onDone={() => { setStageClickPending(null); refresh() }}
          />
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

// ── Ticket tab ────────────────────────────────────────────────────────────────

type SnapType = {
  id: string; property_price: number | null; ghi: number | null; age: number | null
  household_type: string | null; is_ftb: boolean | null; employment_type: string | null
  county: string | null; dublin_postcode: string | null
  current_housing_cost: number | null; current_savings: number | null; monthly_savings: number | null
} | null

function numInput(val: number | null) { return val === null ? '' : String(val) }
function parseNum(s: string) { const n = parseInt(s.replace(/[^0-9]/g, ''), 10); return isNaN(n) ? null : n }

function ToggleGroup({ value, options, onChange }: {
  value: string | null
  options: { value: string; label: string }[]
  onChange: (v: string | null) => void
}) {
  return (
    <div className="flex gap-1">
      {options.map(o => (
        <button key={o.value} type="button" onClick={() => onChange(value === o.value ? null : o.value)}
          className={`px-3 py-1 rounded-full text-xs border transition-colors ${
            value === o.value ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'
          }`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground w-40 shrink-0">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  )
}

function CalcRow({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 tabular-nums shrink-0">
        <span className="font-medium">{value}</span>
        {note && <span className="text-xs text-muted-foreground">{note}</span>}
      </div>
    </div>
  )
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground pt-2 pb-1">{children}</p>
}

function pmtCalc(r: number, n: number, pv: number) {
  if (r === 0) return pv / n
  const f = Math.pow(1 + r, n)
  return (pv * r * f) / (f - 1)
}

function ProspectTicketTab({ clientId, targetPrice, snapshot, phone, appointmentAt, onSaved }: {
  clientId: string; targetPrice: number | null; snapshot: SnapType
  phone: string | null; appointmentAt: string | null; onSaved: () => void
}) {
  const init = () => ({
    propertyPrice: targetPrice ?? snapshot?.property_price ?? 0,
    ghi:           snapshot?.ghi ?? 0,
    age:           snapshot?.age ?? null as number | null,
    householdType: snapshot?.household_type ?? null as string | null,
    isFtb:         snapshot?.is_ftb ?? null as boolean | null,
    employmentType:snapshot?.employment_type ?? null as string | null,
    county:        snapshot?.county ?? '',
    dublinPostcode:snapshot?.dublin_postcode ?? null as string | null,
    currentHousingCost: snapshot?.current_housing_cost ?? null as number | null,
    currentSavings:     snapshot?.current_savings ?? null as number | null,
    monthlySavings:     snapshot?.monthly_savings ?? null as number | null,
  })

  const [form, setForm] = useState(init)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Re-sync when snapshot arrives from the query
  const [synced, setSynced] = useState(false)
  if (!synced && snapshot) { setForm(init()); setSynced(true) }

  const set = (k: keyof typeof form, v: unknown) => setForm(prev => ({ ...prev, [k]: v }))

  const price        = form.propertyPrice || 0
  const entryStake   = Math.round(price * 0.01)
  const monthlyFee   = parseFloat(((price * 0.082) / 12).toFixed(2))
  const strikePrice  = Math.round(price * 0.9)
  const projected    = Math.round(price * Math.pow(1.05, 5))
  const appEur       = projected - strikePrice
  const appPct       = price > 0 ? (appEur / price) * 100 : 0
  const ltv          = projected > 0 ? (strikePrice / projected) * 100 : 0
  const gmiMonthly   = (form.ghi || 0) / 12
  const feePct       = gmiMonthly > 0 ? Math.round((monthlyFee / gmiMonthly) * 100) : null
  const stressMtg    = Math.round(pmtCalc(0.055 / 12, 360, strikePrice))
  const baseMtg      = Math.round(pmtCalc(0.035 / 12, 360, strikePrice))
  const stressPct    = gmiMonthly > 0 ? Math.round((stressMtg / gmiMonthly) * 100) : null
  const basePct      = gmiMonthly > 0 ? Math.round((baseMtg / gmiMonthly) * 100) : null

  async function handleSave() {
    setSaving(true)
    const { data: snap } = await supabase
      .from('calculator_snapshots').select('id').eq('client_id', clientId)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()

    if (snap) {
      await supabase.from('calculator_snapshots').update({
        property_price: price || null,
        entry_stake: entryStake,
        monthly_domiter: monthlyFee,
        strike_price: strikePrice,
        ghi: form.ghi || null,
        age: form.age,
        household_type: form.householdType,
        is_ftb: form.isFtb,
        employment_type: form.employmentType,
        county: form.county || null,
        dublin_postcode: form.dublinPostcode,
        current_housing_cost: form.currentHousingCost,
        current_savings: form.currentSavings,
        monthly_savings: form.monthlySavings,
      }).eq('id', snap.id)
    }

    const targetArea = form.county
      ? form.county + (form.dublinPostcode ? ` ${form.dublinPostcode}` : '')
      : null
    await supabase.from('clients').update({
      target_price: price || null,
      target_areas: targetArea,
    }).eq('id', clientId)

    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    onSaved()
  }

  const fmt = (n: number) => `€${Math.round(n).toLocaleString('en-IE')}`

  if (!snapshot) {
    return (
      <div className="rounded-md border bg-card p-8 text-center text-muted-foreground text-sm">
        No calculator data on record yet.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 items-start">

      {/* Left — editable inputs */}
      <div className="rounded-md border bg-card p-5 space-y-1">
        <SectionHead>Profile</SectionHead>
        {phone && <FieldRow label="Phone"><span className="text-sm">{phone}</span></FieldRow>}
        {appointmentAt && (
          <FieldRow label="Call booked">
            <span className="text-sm">
              {new Date(appointmentAt).toLocaleString('en-IE', { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </FieldRow>
        )}
        <FieldRow label="County">
          <Select value={form.county || 'none'} onValueChange={v => {
            set('county', v === 'none' ? '' : v)
            if (v !== 'Dublin') set('dublinPostcode', null)
          }}>
            <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select county" /></SelectTrigger>
            <SelectContent>{ROI_COUNTIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </FieldRow>
        {form.county === 'Dublin' && (
          <FieldRow label="Dublin postcode">
            <Select value={form.dublinPostcode ?? 'none'} onValueChange={v => set('dublinPostcode', v === 'none' ? null : v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select postcode" /></SelectTrigger>
              <SelectContent>{DUBLIN_POSTCODES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </FieldRow>
        )}
        <FieldRow label="Age">
          <Input type="number" min={18} max={65} className="h-8 text-sm w-24"
            value={numInput(form.age)} onChange={e => set('age', parseNum(e.target.value))} />
        </FieldRow>
        <FieldRow label="Household">
          <ToggleGroup value={form.householdType} onChange={v => set('householdType', v)}
            options={[{ value: 'solo', label: 'Solo' }, { value: 'couple', label: 'Couple' }]} />
        </FieldRow>
        <FieldRow label="First-time buyer">
          <ToggleGroup value={form.isFtb === null ? null : String(form.isFtb)} onChange={v => set('isFtb', v === null ? null : v === 'true')}
            options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]} />
        </FieldRow>
        <FieldRow label="Employment">
          <ToggleGroup value={form.employmentType} onChange={v => set('employmentType', v)}
            options={[{ value: 'paye', label: 'PAYE' }, { value: 'self_employed', label: 'Self-employed' }, { value: 'mixed', label: 'Mixed' }]} />
        </FieldRow>

        <SectionHead>Finances</SectionHead>
        <FieldRow label="Gross income">
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">€</span>
            <Input type="number" min={0} step={1000} className="h-8 text-sm w-32"
              value={numInput(form.ghi)} onChange={e => set('ghi', parseNum(e.target.value) ?? 0)} />
            <span className="text-xs text-muted-foreground">/yr</span>
          </div>
        </FieldRow>
        <FieldRow label="Housing cost">
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">€</span>
            <Input type="number" min={0} step={50} className="h-8 text-sm w-28"
              value={numInput(form.currentHousingCost)} onChange={e => set('currentHousingCost', parseNum(e.target.value))} />
            <span className="text-xs text-muted-foreground">/mo</span>
          </div>
        </FieldRow>
        <FieldRow label="Current savings">
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">€</span>
            <Input type="number" min={0} step={500} className="h-8 text-sm w-28"
              value={numInput(form.currentSavings)} onChange={e => set('currentSavings', parseNum(e.target.value))} />
          </div>
        </FieldRow>
        <FieldRow label="Monthly saving">
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">€</span>
            <Input type="number" min={0} step={50} className="h-8 text-sm w-28"
              value={numInput(form.monthlySavings)} onChange={e => set('monthlySavings', parseNum(e.target.value))} />
            <span className="text-xs text-muted-foreground">/mo</span>
          </div>
        </FieldRow>

        <SectionHead>Target property</SectionHead>
        <FieldRow label="Property price">
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">€</span>
            <Input type="number" min={100000} max={1000000} step={5000} className="h-8 text-sm w-32"
              value={numInput(form.propertyPrice || null)} onChange={e => set('propertyPrice', parseNum(e.target.value) ?? 0)} />
          </div>
        </FieldRow>

        <div className="pt-3">
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saved ? <><Check className="h-3.5 w-3.5 mr-1.5" />Saved</> : saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>

      {/* Right — calculated outputs */}
      <div className="rounded-md border bg-card p-5 space-y-1">
        <SectionHead>Homeown numbers</SectionHead>
        <div className="rounded-md border bg-muted/30 p-3 space-y-0 mb-3">
          <CalcRow label="Entry Stake" value={fmt(entryStake)} />
          <CalcRow label="Monthly service fee" value={fmt(monthlyFee)} note={feePct !== null ? `${feePct}% of GHI` : undefined} />
          <CalcRow label="Option price" value={fmt(strikePrice)} />
          <CalcRow label="Strike reduction" value={fmt(price - strikePrice)} />
        </div>

        <SectionHead>Financial model</SectionHead>
        <div className="rounded-md border bg-muted/30 p-3 space-y-0">
          <CalcRow label="Projected value (Y5)" value={fmt(projected)} />
          <CalcRow label="Appreciation (€)" value={fmt(appEur)} />
          <CalcRow label="Appreciation (%)" value={`${appPct.toFixed(2)}%`} />
          <CalcRow label="LTV at completion" value={`${ltv.toFixed(2)}%`} />
          <CalcRow label="Stress mortgage" value={fmt(stressMtg)} note={stressPct !== null ? `${stressPct}% of GHI` : undefined} />
          <CalcRow label="Base mortgage" value={fmt(baseMtg)} note={basePct !== null ? `${basePct}% of GHI` : undefined} />
          <CalcRow label="Fee vs stress diff" value={fmt(monthlyFee - stressMtg)} />
          <CalcRow label="Fee vs base diff" value={fmt(monthlyFee - baseMtg)} />
        </div>
      </div>

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
              <td className="px-3 py-3 text-center">{d.email_log_id ? <span className="text-primary">✓</span> : <span className="text-muted-foreground/40">—</span>}</td>
              <td className="px-3 py-3 text-center">{d.storage_path ? <span className="text-primary">✓</span> : <span className="text-muted-foreground/40">—</span>}</td>
              <td className="px-3 py-3 text-center">{d.read_at ? <span className="text-primary">✓</span> : <span className="text-muted-foreground/40">—</span>}</td>
              <td className="px-3 py-3 text-center">
                {!d.requires_ack ? <span className="text-muted-foreground/40">n/a</span>
                  : d.acknowledged_at ? <span className="text-primary">✓</span>
                  : <span className="text-brand-burgundy">!</span>}
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

