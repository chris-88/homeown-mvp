import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DOC_TYPE_LABELS, LEAD_STAGE_LABELS, PROGRAMME_STAGE_LABELS, EVENT_TYPE_LABELS } from '@/types'
import type { Client, DocumentRequest, PropertyCase, Event, LeadStage, ProgrammeStage } from '@/types'
import { formatDate, formatCurrency } from '@/lib/utils'
import { ArrowLeft, ExternalLink } from 'lucide-react'

interface CalcSnapshot {
  id: string
  created_at: string
  property_price: number
  entry_stake: number
  monthly_domiter: number
  strike_price: number
  county: string | null
  dublin_postcode: string | null
  household_type: 'solo' | 'couple' | null
  is_ftb: boolean | null
  ghi: number | null
  employment_type: 'paye' | 'self_employed' | 'mixed' | null
  eligible: boolean | null
}

const EMPLOYMENT_LABELS: Record<string, string> = {
  paye: 'Employed (PAYE)',
  self_employed: 'Self-employed',
  mixed: 'Mixed PAYE / self-employed',
}

const ONBOARDING_DOCS: Array<{ doc_type: string; count: number }> = [
  { doc_type: 'photo_id', count: 1 },
  { doc_type: 'proof_of_address', count: 1 },
  { doc_type: 'payslip', count: 2 },
  { doc_type: 'bank_statement', count: 3 },
  { doc_type: 'employer_letter', count: 1 },
]

// ── Overview tab ──────────────────────────────────────────────
function OverviewTab({ client, onRefresh }: { client: Client; onRefresh: () => void }) {
  const qc = useQueryClient()
  const [pathwayStart, setPathwayStart] = useState(client.pathway_start_date ?? '')

  const { data: dacs } = useQuery({
    queryKey: ['all-dacs'],
    queryFn: async () => {
      const { data } = await supabase.from('dacs').select('id, name, cohort_label').order('name')
      return (data ?? []) as Array<{ id: string; name: string; cohort_label: string | null }>
    },
  })

  const { data: snapshot } = useQuery({
    queryKey: ['staff-client-snapshot', client.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('calculator_snapshots')
        .select('*')
        .eq('client_id', client.id)
        .eq('saved', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return data as CalcSnapshot | null
    },
  })

  async function handleLeadStageChange(value: string) {
    await supabase.from('clients').update({ lead_stage: value, updated_at: new Date().toISOString() }).eq('id', client.id)
    onRefresh()
  }

  async function handleProgrammeStageChange(value: string) {
    await supabase.from('clients').update({ programme_stage: value, updated_at: new Date().toISOString() }).eq('id', client.id)
    if (value === 'limit_letter_ready') {
      await supabase.from('events').insert({ client_id: client.id, event_type: 'limit_letter_issued', visibility: 'client' })
    }
    onRefresh()
  }

  async function handleDacIdChange(value: string) {
    const dacId = value === 'none' ? null : value
    await supabase.from('clients').update({ dac_id: dacId, updated_at: new Date().toISOString() }).eq('id', client.id)
    onRefresh()
  }

  async function handlePathwayStartBlur() {
    await supabase.from('clients').update({ pathway_start_date: pathwayStart || null, updated_at: new Date().toISOString() }).eq('id', client.id)
    onRefresh()
  }

  async function createOnboardingChecklist() {
    const rows = ONBOARDING_DOCS.flatMap(({ doc_type, count }) =>
      Array.from({ length: count }, () => ({ client_id: client.id, doc_type, status: 'requested' }))
    )
    await supabase.from('document_requests').insert(rows)
    await supabase.from('clients').update({ programme_stage: 'onboarding_docs_requested', updated_at: new Date().toISOString() }).eq('id', client.id)
    await supabase.from('events').insert({ client_id: client.id, event_type: 'pre_qual_submitted', visibility: 'internal' })
    qc.invalidateQueries({ queryKey: ['staff-client-docs', client.id] })
    onRefresh()
  }

  const { data: existingDocs } = useQuery({
    queryKey: ['staff-client-docs-count', client.id],
    queryFn: async () => {
      const { count } = await supabase.from('document_requests').select('id', { count: 'exact', head: true }).eq('client_id', client.id)
      return count ?? 0
    },
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Client information</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><p className="text-muted-foreground">Name</p><p className="font-medium">{client.first_name} {client.last_name}</p></div>
            <div><p className="text-muted-foreground">Email</p><p>{client.email}</p></div>
            <div><p className="text-muted-foreground">Phone</p><p>{client.phone ?? '-'}</p></div>
            <div><p className="text-muted-foreground">Household size</p><p>{client.household_size ?? '-'}</p></div>
            <div><p className="text-muted-foreground">Target areas</p><p>{client.target_areas ?? '-'}</p></div>
            <div>
              <p className="text-muted-foreground">Target price</p>
              <p>{client.target_price ? formatCurrency(client.target_price) : '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Calculator results</CardTitle></CardHeader>
        <CardContent className="text-sm">
          {!snapshot ? (
            <p className="text-muted-foreground">No calculator results on record.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Target property</p>
                  <p className="font-medium">{formatCurrency(snapshot.property_price)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Purchase option price</p>
                  <p className="font-medium">{formatCurrency(snapshot.strike_price)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Entry Stake</p>
                  <p className="font-medium">{formatCurrency(snapshot.entry_stake)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Monthly service fee (Domiter)</p>
                  <p className="font-medium">{formatCurrency(snapshot.monthly_domiter)} / month</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Target area</p>
                  <p className="font-medium">
                    {snapshot.county ?? '-'}{snapshot.dublin_postcode ? ` ${snapshot.dublin_postcode}` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Household</p>
                  <p className="font-medium">{snapshot.household_type === 'couple' ? 'Couple' : snapshot.household_type === 'solo' ? 'Solo' : '-'}</p>
                </div>
                {snapshot.is_ftb !== null && (
                  <div>
                    <p className="text-muted-foreground">First-time buyer</p>
                    <p className="font-medium">{snapshot.is_ftb ? 'Yes' : 'No (mover)'}</p>
                  </div>
                )}
                {snapshot.ghi && (
                  <div>
                    <p className="text-muted-foreground">Gross household income</p>
                    <p className="font-medium">{formatCurrency(snapshot.ghi)} / year</p>
                  </div>
                )}
                {snapshot.employment_type && (
                  <div>
                    <p className="text-muted-foreground">Employment type</p>
                    <p className="font-medium">{EMPLOYMENT_LABELS[snapshot.employment_type] ?? snapshot.employment_type}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Eligibility outcome</p>
                  {snapshot.is_ftb === false ? (
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">Mover — not yet eligible</span>
                  ) : snapshot.eligible ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Eligible</span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Income gap</span>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Submitted {formatDate(snapshot.created_at)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Stage management</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Lead stage</Label>
              <Select value={client.lead_stage} onValueChange={handleLeadStageChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(LEAD_STAGE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Programme stage</Label>
              <Select value={client.programme_stage ?? 'none'} onValueChange={(v) => handleProgrammeStageChange(v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Not started" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not started</SelectItem>
                  {Object.entries(PROGRAMME_STAGE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button variant="outline" onClick={createOnboardingChecklist} disabled={(existingDocs ?? 0) > 0}>
            {(existingDocs ?? 0) > 0 ? 'Checklist already created' : 'Create onboarding checklist'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Programme details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>DAC</Label>
              <Select value={client.dac_id ?? 'none'} onValueChange={handleDacIdChange}>
                <SelectTrigger><SelectValue placeholder="Not assigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not assigned</SelectItem>
                  {dacs?.map(d => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}{d.cohort_label ? ` (${d.cohort_label})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Pathway start date</Label>
              <Input
                type="date"
                value={pathwayStart}
                onChange={(e) => setPathwayStart(e.target.value)}
                onBlur={handlePathwayStartBlur}
              />
            </div>
          </div>
          {client.pathway_start_date && (
            <p className="text-sm text-muted-foreground">
              60-month term ends:{' '}
              <strong className="text-foreground">
                {new Date(new Date(client.pathway_start_date).setMonth(new Date(client.pathway_start_date).getMonth() + 60)).toLocaleDateString('en-IE', { year: 'numeric', month: 'long' })}
              </strong>
            </p>
          )}
        </CardContent>
      </Card>

    </div>
  )
}

// ── Documents tab ─────────────────────────────────────────────
function docStatusVariant(status: string) {
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'destructive'
  if (status === 'received') return 'default'
  return 'secondary'
}

function DocumentsTab({ client }: { client: Client }) {
  const qc = useQueryClient()
  const { user } = useAuth()
  const [rejectDoc, setRejectDoc] = useState<DocumentRequest | null>(null)
  const [reason, setReason] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [loadingReject, setLoadingReject] = useState(false)

  const { data: docs } = useQuery({
    queryKey: ['staff-client-docs', client.id],
    queryFn: async () => {
      const { data } = await supabase.from('document_requests').select('*').eq('client_id', client.id).order('created_at')
      return (data ?? []) as DocumentRequest[]
    },
  })

  async function approve(doc: DocumentRequest) {
    setLoadingId(doc.id)
    await supabase.from('document_requests').update({ status: 'approved', reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq('id', doc.id)
    await supabase.from('events').insert({ client_id: client.id, event_type: 'document_approved', visibility: 'client' })
    qc.invalidateQueries({ queryKey: ['staff-client-docs', client.id] })
    setLoadingId(null)
  }

  async function reject() {
    if (!rejectDoc) return
    setLoadingReject(true)
    await supabase.from('document_requests').update({ status: 'rejected', rejection_reason: reason, reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq('id', rejectDoc.id)
    await supabase.from('events').insert({ client_id: client.id, event_type: 'document_rejected', visibility: 'client' })
    qc.invalidateQueries({ queryKey: ['staff-client-docs', client.id] })
    setLoadingReject(false)
    setRejectDoc(null)
    setReason('')
  }

  async function openSignedUrl(filePath: string) {
    const { data } = await supabase.storage.from('documents').createSignedUrl(filePath, 300)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function markVerified() {
    await supabase.from('clients').update({ programme_stage: 'limit_letter_ready', updated_at: new Date().toISOString() }).eq('id', client.id)
    await supabase.from('events').insert({ client_id: client.id, event_type: 'limit_letter_issued', visibility: 'client' })
    qc.invalidateQueries({ queryKey: ['staff-client', client.id] })
  }

  const allApproved = docs && docs.length > 0 && docs.every((d) => d.status === 'approved')

  return (
    <div className="space-y-4">
      {allApproved && client.programme_stage !== 'limit_letter_ready' && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">All documents approved.</p>
          <Button size="sm" className="mt-2" onClick={markVerified}>Mark as Verified and issue Eligibility Letter</Button>
        </div>
      )}

      <Card>
        <CardContent className="pt-4">
          {!docs || docs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No document requests yet.</p>
          ) : (
            <div className="divide-y">
              {docs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="text-sm font-medium">{DOC_TYPE_LABELS[doc.doc_type as keyof typeof DOC_TYPE_LABELS] ?? doc.doc_type}</p>
                    {doc.rejection_reason && <p className="text-xs text-destructive">{doc.rejection_reason}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={docStatusVariant(doc.status) as Parameters<typeof Badge>[0]['variant']}>
                      {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </Badge>
                    {doc.file_path && (
                      <Button size="sm" variant="ghost" onClick={() => openSignedUrl(doc.file_path!)}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {doc.status === 'received' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => approve(doc)} disabled={loadingId === doc.id}>
                          {loadingId === doc.id ? 'Saving…' : 'Approve'}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => { setRejectDoc(doc); setReason('') }} disabled={!!loadingId}>Reject</Button>
                      </>
                    )}
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

// ── Property tab ──────────────────────────────────────────────
function PropertyTab({ client }: { client: Client }) {
  const qc = useQueryClient()
  const [valuationInputs, setValuationInputs] = useState<Record<string, string>>({})

  const { data: cases } = useQuery({
    queryKey: ['staff-client-property', client.id],
    queryFn: async () => {
      const { data } = await supabase.from('property_cases').select('*').eq('client_id', client.id).order('created_at', { ascending: false })
      return (data ?? []) as PropertyCase[]
    },
  })

  async function saveValuation(pcId: string) {
    const amount = parseFloat(valuationInputs[pcId] ?? '')
    if (isNaN(amount) || amount <= 0) return
    await supabase.from('property_cases').update({ valuation_amount: amount, updated_at: new Date().toISOString() }).eq('id', pcId)
    await supabase.from('events').insert({ client_id: client.id, event_type: 'valuation_uploaded', visibility: 'internal' })
    qc.invalidateQueries({ queryKey: ['staff-client-property', client.id] })
  }

  async function issueApproval(pc: PropertyCase) {
    await supabase.from('clients').update({ programme_stage: 'approval_notice_issued', updated_at: new Date().toISOString() }).eq('id', client.id)
    await supabase.from('events').insert({ client_id: client.id, event_type: 'approval_notice_issued', visibility: 'client' })
    qc.invalidateQueries({ queryKey: ['staff-client', client.id] })
    qc.invalidateQueries({ queryKey: ['staff-client-property', client.id] })
  }

  async function updateCaseStatus(pcId: string, status: string) {
    await supabase.from('property_cases').update({ status, updated_at: new Date().toISOString() }).eq('id', pcId)
    qc.invalidateQueries({ queryKey: ['staff-client-property', client.id] })
  }

  if (!cases || cases.length === 0) return <p className="text-sm text-muted-foreground py-4">No property cases yet.</p>

  return (
    <div className="space-y-4">
      {cases.map((pc) => (
        <Card key={pc.id}>
          <CardContent className="pt-6 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div><p className="text-muted-foreground">Address</p><p className="font-medium">{pc.address_line_1}{pc.address_line_2 ? `, ${pc.address_line_2}` : ''}, {pc.city}, {pc.county}{pc.eircode ? ` ${pc.eircode}` : ''}</p></div>
              <div><p className="text-muted-foreground">Asking price</p><p>€{pc.asking_price.toLocaleString()}</p></div>
              <div><p className="text-muted-foreground">Agreed price</p><p>{pc.agreed_price ? `€${pc.agreed_price.toLocaleString()}` : '-'}</p></div>
              <div>
                <p className="text-muted-foreground">Valuation</p>
                {pc.valuation_amount ? (
                  <p>€{pc.valuation_amount.toLocaleString()}</p>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      className="h-7 w-32 text-sm"
                      placeholder="0"
                      value={valuationInputs[pc.id] ?? ''}
                      onChange={(e) => setValuationInputs((prev) => ({ ...prev, [pc.id]: e.target.value }))}
                    />
                    <Button size="sm" variant="outline" onClick={() => saveValuation(pc.id)} disabled={!valuationInputs[pc.id]}>
                      Save
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={pc.status} onValueChange={(v) => updateCaseStatus(pc.id, v)}>
                <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['submitted','valuation_scheduled','valuation_received','approved','rejected','conveyancing','purchased'].map((s) => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {pc.status === 'valuation_received' && pc.valuation_amount && (
                <Button size="sm" onClick={() => issueApproval(pc)}>Issue Approval Notice</Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ── Timeline tab ──────────────────────────────────────────────
function TimelineTab({ clientId }: { clientId: string }) {
  const qc = useQueryClient()
  const { user } = useAuth()
  const [noteText, setNoteText] = useState('')
  const [posting, setPosting] = useState(false)

  const { data: events } = useQuery({
    queryKey: ['staff-client-events', clientId],
    queryFn: async () => {
      const { data } = await supabase.from('events').select('*').eq('client_id', clientId).order('created_at', { ascending: false })
      return (data ?? []) as Event[]
    },
  })

  async function postNote() {
    const text = noteText.trim()
    if (!text) return
    setPosting(true)
    await supabase.from('events').insert({
      client_id: clientId,
      event_type: 'staff_note',
      actor_id: user?.id ?? null,
      payload: { text },
      visibility: 'internal',
    })
    setNoteText('')
    setPosting(false)
    qc.invalidateQueries({ queryKey: ['staff-client-events', clientId] })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Add note</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Internal note — not visible to the client…"
            rows={3}
          />
          <Button size="sm" onClick={postNote} disabled={!noteText.trim() || posting}>
            {posting ? 'Posting…' : 'Post note'}
          </Button>
        </CardContent>
      </Card>

      {!events || events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No events yet.</p>
      ) : (
        <ol className="relative border-l border-border pl-6 space-y-6">
          {events.map((ev) => (
            <li key={ev.id} className="relative">
              <div className="absolute -left-[25px] top-1 h-3 w-3 rounded-full border-2 border-primary bg-background" />
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-medium">{EVENT_TYPE_LABELS[ev.event_type] ?? ev.event_type}</p>
                  <Badge variant={ev.visibility === 'client' ? 'default' : 'secondary'} className="shrink-0 text-xs">
                    {ev.visibility === 'client' ? 'Client-visible' : 'Internal'}
                  </Badge>
                </div>
                {ev.event_type === 'staff_note' && ev.payload?.text && (
                  <p className="text-sm text-foreground rounded-md bg-muted/50 px-3 py-2">
                    {ev.payload.text as string}
                  </p>
                )}
                <time className="text-xs text-muted-foreground">{formatDate(ev.created_at)}</time>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

// ── Page root ─────────────────────────────────────────────────
export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()

  const { data: client, isLoading } = useQuery({
    queryKey: ['staff-client', id],
    queryFn: async () => {
      const { data } = await supabase.from('clients').select('*').eq('id', id!).single()
      return data as Client | null
    },
    enabled: !!id,
  })

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>
  if (!client) return <div className="p-8 text-muted-foreground">Client not found.</div>

  function refresh() { qc.invalidateQueries({ queryKey: ['staff-client', id] }) }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <Link to="/app/staff/clients" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        All clients
      </Link>
      <div>
        <h1 className="text-2xl font-bold">{client.first_name} {client.last_name}</h1>
        <p className="mt-1 text-muted-foreground">{client.email}</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="property">Property</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="overview"><OverviewTab client={client} onRefresh={refresh} /></TabsContent>
          <TabsContent value="documents"><DocumentsTab client={client} /></TabsContent>
          <TabsContent value="property"><PropertyTab client={client} /></TabsContent>
          <TabsContent value="timeline"><TimelineTab clientId={client.id} /></TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
