import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { ArrowLeft, Download, Trash2 } from 'lucide-react'
import type { Dac, DacDocument, DacStatus, CircleMember, Subscription, SubscriptionStatus, SeniorStage } from '@/types'
import { DAC_STATUS_LABELS, DAC_DOC_TYPE_LABELS, SUBSCRIPTION_STATUS_LABELS, SENIOR_STAGE_LABELS } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

const STATUS_TIMESTAMPS: Partial<Record<SubscriptionStatus, keyof Subscription>> = {
  funds_requested: 'funds_requested_at',
  funded: 'funded_at',
}

const SENIOR_STAGES: SeniorStage[] = ['pre_market', 'indicative', 'credit_approved', 'documented', 'drawn', 'repaid']

function seniorStageIndex(stage: SeniorStage | null | undefined) {
  return SENIOR_STAGES.indexOf((stage ?? 'pre_market') as SeniorStage)
}

function isSeniorCommitted(stage: SeniorStage | null | undefined) {
  return seniorStageIndex(stage) >= seniorStageIndex('credit_approved')
}

function dacStatusBadge(status: DacStatus) {
  const label = DAC_STATUS_LABELS[status]
  if (status === 'open') return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{label}</Badge>
  if (status === 'upcoming') return <Badge variant="secondary">{label}</Badge>
  if (status === 'draft') return <Badge variant="outline">{label}</Badge>
  return <Badge variant="secondary">{label}</Badge>
}

interface SubWithMember extends Subscription {
  circle_members: { first_name: string; last_name: string } | null
}

// ── Summary bar ────────────────────────────────────────────────
function SummaryBar({ dac, subAmounts }: { dac: Dac; subAmounts: { amount: number; status: string }[] }) {
  const subCommitted = subAmounts
    .filter(s => !['soft_commit', 'withdrawn'].includes(s.status))
    .reduce((sum, s) => sum + s.amount, 0)

  const subFunded = subAmounts
    .filter(s => ['funded', 'active'].includes(s.status))
    .reduce((sum, s) => sum + s.amount, 0)

  const seniorCommitted = isSeniorCommitted(dac.senior_stage) ? (dac.senior_committed_amount ?? 0) : 0
  const seniorFunded = dac.senior_drawn_amount ?? 0

  const totalTarget = (dac.target_sub_amount ?? 0) + (dac.target_senior_amount ?? 0)
  const totalCommitted = subCommitted + seniorCommitted
  const totalFunded = subFunded + seniorFunded
  const totalGap = Math.max(0, totalTarget - totalCommitted)

  if (totalTarget === 0) return null

  return (
    <div className="grid gap-3 sm:grid-cols-4">
      {[
        { label: 'Target', value: formatCurrency(totalTarget) },
        { label: 'Committed', value: formatCurrency(totalCommitted) },
        { label: 'Funded', value: formatCurrency(totalFunded) },
        { label: 'Gap', value: formatCurrency(totalGap) },
      ].map(({ label, value }) => (
        <Card key={label}>
          <CardContent className="pt-4">
            <p className="text-lg font-bold numeric">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ── Fundamentals tab ──────────────────────────────────────────
const fundamentalsSchema = z.object({
  name: z.string().min(1, 'Required'),
  cohort_label: z.string().optional(),
  status: z.string(),
  description: z.string().optional(),
  geographic_focus: z.string().optional(),
  property_count: z.coerce.number().int().min(0).optional().nullable(),
  target_sub_amount: z.coerce.number().int().min(0).optional().nullable(),
  target_senior_amount: z.coerce.number().int().min(0).optional().nullable(),
  coupon_rate: z.coerce.number().min(0).max(100).optional().nullable(),
  no_call_months: z.coerce.number().int().min(0),
  term_months: z.coerce.number().int().min(1),
  open_date: z.string().optional().nullable(),
  close_date: z.string().optional().nullable(),
  notes: z.string().optional(),
})
type FundamentalsValues = z.infer<typeof fundamentalsSchema>

function FundamentalsTab({ dac, onRefresh }: { dac: Dac; onRefresh: () => void }) {
  const form = useForm<FundamentalsValues>({
    resolver: zodResolver(fundamentalsSchema),
    defaultValues: {
      name: dac.name,
      cohort_label: dac.cohort_label ?? '',
      status: dac.status,
      description: dac.description ?? '',
      geographic_focus: dac.geographic_focus ?? '',
      property_count: dac.property_count,
      target_sub_amount: dac.target_sub_amount,
      target_senior_amount: dac.target_senior_amount,
      coupon_rate: dac.coupon_rate,
      no_call_months: dac.no_call_months,
      term_months: dac.term_months,
      open_date: dac.open_date,
      close_date: dac.close_date,
      notes: dac.notes ?? '',
    },
  })

  async function onSubmit(values: FundamentalsValues) {
    await supabase.from('dacs').update({
      ...values,
      cohort_label: values.cohort_label || null,
      description: values.description || null,
      geographic_focus: values.geographic_focus || null,
      notes: values.notes || null,
      open_date: values.open_date || null,
      close_date: values.close_date || null,
      updated_at: new Date().toISOString(),
    }).eq('id', dac.id)
    onRefresh()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Name</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="cohort_label" render={({ field }) => (
            <FormItem>
              <FormLabel>Cohort label</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {Object.entries(DAC_STATUS_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="geographic_focus" render={({ field }) => (
            <FormItem>
              <FormLabel>Geographic focus</FormLabel>
              <FormControl><Input {...field} /></FormControl>
            </FormItem>
          )} />

          <FormField control={form.control} name="property_count" render={({ field }) => (
            <FormItem>
              <FormLabel>Property count</FormLabel>
              <FormControl><Input type="number" min={0} {...field} value={field.value ?? ''} /></FormControl>
            </FormItem>
          )} />

          <FormField control={form.control} name="target_sub_amount" render={({ field }) => (
            <FormItem>
              <FormLabel>Target sub amount (€)</FormLabel>
              <FormControl><Input type="number" min={0} {...field} value={field.value ?? ''} /></FormControl>
            </FormItem>
          )} />

          <FormField control={form.control} name="target_senior_amount" render={({ field }) => (
            <FormItem>
              <FormLabel>Target senior amount (€)</FormLabel>
              <FormControl><Input type="number" min={0} {...field} value={field.value ?? ''} /></FormControl>
            </FormItem>
          )} />

          <FormField control={form.control} name="coupon_rate" render={({ field }) => (
            <FormItem>
              <FormLabel>Coupon rate (% p.a.)</FormLabel>
              <FormControl><Input type="number" min={0} max={100} step={0.01} {...field} value={field.value ?? ''} /></FormControl>
            </FormItem>
          )} />

          <FormField control={form.control} name="no_call_months" render={({ field }) => (
            <FormItem>
              <FormLabel>No-call period (months)</FormLabel>
              <FormControl><Input type="number" min={0} {...field} /></FormControl>
            </FormItem>
          )} />

          <FormField control={form.control} name="term_months" render={({ field }) => (
            <FormItem>
              <FormLabel>Term (months)</FormLabel>
              <FormControl><Input type="number" min={1} {...field} /></FormControl>
            </FormItem>
          )} />

          <FormField control={form.control} name="open_date" render={({ field }) => (
            <FormItem>
              <FormLabel>Open date</FormLabel>
              <FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl>
            </FormItem>
          )} />

          <FormField control={form.control} name="close_date" render={({ field }) => (
            <FormItem>
              <FormLabel>Close date</FormLabel>
              <FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl>
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl><Textarea rows={3} {...field} /></FormControl>
          </FormItem>
        )} />

        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel>Internal notes</FormLabel>
            <FormControl><Textarea rows={2} {...field} /></FormControl>
          </FormItem>
        )} />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : 'Save changes'}
        </Button>
      </form>
    </Form>
  )
}

// ── Documents tab ──────────────────────────────────────────────
function DocumentsTab({ dac }: { dac: Dac }) {
  const qc = useQueryClient()
  const { user } = useAuth()
  const [docName, setDocName] = useState('')
  const [docType, setDocType] = useState('info_memo')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: documents } = useQuery({
    queryKey: ['staff-dac-docs', dac.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('dac_documents').select('*').eq('dac_id', dac.id).order('created_at')
      return (data ?? []) as DacDocument[]
    },
  })

  async function upload() {
    if (!file || !docName.trim()) return
    setUploading(true)
    const docId = crypto.randomUUID()
    const path = `dac/${dac.id}/${docId}/${file.name}`
    const { error: upErr } = await supabase.storage.from('documents').upload(path, file)
    if (upErr) { setUploading(false); return }
    await supabase.from('dac_documents').insert({
      dac_id: dac.id,
      doc_type: docType,
      name: docName.trim(),
      file_path: path,
      file_name: file.name,
      uploaded_by: user?.id ?? null,
    })
    setDocName('')
    setFile(null)
    setUploading(false)
    qc.invalidateQueries({ queryKey: ['staff-dac-docs', dac.id] })
  }

  async function deleteDoc(doc: DacDocument) {
    setDeletingId(doc.id)
    await supabase.storage.from('documents').remove([doc.file_path])
    await supabase.from('dac_documents').delete().eq('id', doc.id)
    qc.invalidateQueries({ queryKey: ['staff-dac-docs', dac.id] })
    setDeletingId(null)
  }

  async function openSignedUrl(filePath: string) {
    const { data } = await supabase.storage.from('documents').createSignedUrl(filePath, 300)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Upload document</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Document name</Label>
              <Input placeholder="e.g. Information Memorandum v1" value={docName} onChange={(e) => setDocName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DAC_DOC_TYPE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>File</Label>
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <Button size="sm" onClick={upload} disabled={!file || !docName.trim() || uploading}>
            {uploading ? 'Uploading…' : 'Upload'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          {!documents?.length ? (
            <p className="text-sm text-muted-foreground py-4">No documents yet.</p>
          ) : (
            <ul className="divide-y">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {DAC_DOC_TYPE_LABELS[doc.doc_type as keyof typeof DAC_DOC_TYPE_LABELS] ?? doc.doc_type}
                      {' '}&middot;{' '}{formatDate(doc.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => openSignedUrl(doc.file_path)}>
                      <Download className="h-3.5 w-3.5 mr-1" />Download
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteDoc(doc)}
                      disabled={deletingId === doc.id}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Subscriptions tab ──────────────────────────────────────────
function SubscriptionsTab({ dac }: { dac: Dac }) {
  const qc = useQueryClient()
  const { user } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [statusLoading, setStatusLoading] = useState<string | null>(null)
  const [newSub, setNewSub] = useState({ member_id: '', amount: '', status: 'soft_commit' as SubscriptionStatus, notes: '' })

  const { data: subscriptions } = useQuery({
    queryKey: ['staff-dac-subs', dac.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('*, circle_members(first_name, last_name)')
        .eq('dac_id', dac.id)
        .order('created_at', { ascending: false })
      return (data ?? []) as SubWithMember[]
    },
  })

  const { data: allMembers } = useQuery({
    queryKey: ['staff-circle-members-select'],
    queryFn: async () => {
      const { data } = await supabase
        .from('circle_members').select('id, first_name, last_name').order('last_name')
      return (data ?? []) as Pick<CircleMember, 'id' | 'first_name' | 'last_name'>[]
    },
  })

  async function addSub() {
    if (!newSub.member_id || !newSub.amount) return
    setSaving(true)
    await supabase.from('subscriptions').insert({
      circle_member_id: newSub.member_id,
      dac_id: dac.id,
      amount: parseInt(newSub.amount),
      coupon_rate_locked: dac.coupon_rate,
      initiated_by: 'staff',
      staff_actor_id: user?.id ?? null,
      status: newSub.status,
      committed_at: new Date().toISOString(),
      notes: newSub.notes || null,
    })
    setSaving(false)
    setDialogOpen(false)
    setNewSub({ member_id: '', amount: '', status: 'soft_commit', notes: '' })
    qc.invalidateQueries({ queryKey: ['staff-dac-subs', dac.id] })
    qc.invalidateQueries({ queryKey: ['staff-dac-sub-amounts', dac.id] })
  }

  async function updateStatus(subId: string, status: SubscriptionStatus) {
    setStatusLoading(subId)
    const extra: Record<string, string> = {}
    const ts = STATUS_TIMESTAMPS[status]
    if (ts) extra[ts as string] = new Date().toISOString()
    await supabase.from('subscriptions').update({ status, ...extra, updated_at: new Date().toISOString() }).eq('id', subId)
    qc.invalidateQueries({ queryKey: ['staff-dac-subs', dac.id] })
    qc.invalidateQueries({ queryKey: ['staff-dac-sub-amounts', dac.id] })
    setStatusLoading(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialogOpen(true)}>Add subscription</Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          {!subscriptions?.length ? (
            <p className="text-sm text-muted-foreground py-4">No subscriptions yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-3 font-medium">Member</th>
                  <th className="pb-3 pr-3 font-medium">Amount</th>
                  <th className="pb-3 pr-3 font-medium">Rate</th>
                  <th className="pb-3 pr-3 font-medium">By</th>
                  <th className="pb-3 pr-3 font-medium">Committed</th>
                  <th className="pb-3 pr-3 font-medium">Funded</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {subscriptions.map((s) => (
                  <tr key={s.id}>
                    <td className="py-3 pr-3">
                      <Link to={`/app/staff/circle/${s.circle_member_id}`} className="font-medium hover:underline">
                        {s.circle_members ? `${s.circle_members.first_name} ${s.circle_members.last_name}` : '-'}
                      </Link>
                    </td>
                    <td className="py-3 pr-3 numeric">{formatCurrency(s.amount)}</td>
                    <td className="py-3 pr-3">{s.coupon_rate_locked ? `${s.coupon_rate_locked}%` : '-'}</td>
                    <td className="py-3 pr-3 capitalize">{s.initiated_by}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{s.committed_at ? formatDate(s.committed_at) : '-'}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{s.funded_at ? formatDate(s.funded_at) : '-'}</td>
                    <td className="py-3">
                      <Select
                        value={s.status}
                        onValueChange={(v) => updateStatus(s.id, v as SubscriptionStatus)}
                        disabled={statusLoading === s.id}
                      >
                        <SelectTrigger className="h-7 w-40 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(SUBSCRIPTION_STATUS_LABELS).map(([v, l]) => (
                            <SelectItem key={v} value={v}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add subscription</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Member</Label>
              <Select value={newSub.member_id} onValueChange={(v) => setNewSub(p => ({ ...p, member_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select a member" /></SelectTrigger>
                <SelectContent>
                  {allMembers?.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.first_name} {m.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Amount (€)</Label>
              <Input
                type="number" min={1} step={1} placeholder="e.g. 25000"
                value={newSub.amount}
                onChange={(e) => setNewSub(p => ({ ...p, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Initial status</Label>
              <Select value={newSub.status} onValueChange={(v) => setNewSub(p => ({ ...p, status: v as SubscriptionStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="soft_commit">Soft Commit</SelectItem>
                  <SelectItem value="subscribed">Subscribed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea rows={2} value={newSub.notes} onChange={(e) => setNewSub(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={addSub} disabled={!newSub.member_id || !newSub.amount || saving}>
              {saving ? 'Saving…' : 'Add subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Senior tab ────────────────────────────────────────────────
const seniorSchema = z.object({
  senior_lender:           z.string().optional(),
  senior_stage:            z.string(),
  senior_committed_amount: z.coerce.number().int().min(0).optional().nullable(),
  senior_drawn_amount:     z.coerce.number().int().min(0).optional().nullable(),
  senior_term_sheet_date:  z.string().optional().nullable(),
  senior_approval_date:    z.string().optional().nullable(),
  senior_draw_date:        z.string().optional().nullable(),
  senior_notes:            z.string().optional(),
})
type SeniorValues = z.infer<typeof seniorSchema>

function SeniorTab({ dac, onRefresh }: { dac: Dac; onRefresh: () => void }) {
  const form = useForm<SeniorValues>({
    resolver: zodResolver(seniorSchema),
    defaultValues: {
      senior_lender:           dac.senior_lender ?? '',
      senior_stage:            dac.senior_stage ?? 'pre_market',
      senior_committed_amount: dac.senior_committed_amount,
      senior_drawn_amount:     dac.senior_drawn_amount,
      senior_term_sheet_date:  dac.senior_term_sheet_date,
      senior_approval_date:    dac.senior_approval_date,
      senior_draw_date:        dac.senior_draw_date,
      senior_notes:            dac.senior_notes ?? '',
    },
  })

  const watchedStage = form.watch('senior_stage') as SeniorStage
  const currentIdx = seniorStageIndex(watchedStage)

  async function onSubmit(values: SeniorValues) {
    await supabase.from('dacs').update({
      senior_lender:           values.senior_lender || null,
      senior_stage:            values.senior_stage,
      senior_committed_amount: values.senior_committed_amount ?? null,
      senior_drawn_amount:     values.senior_drawn_amount ?? null,
      senior_term_sheet_date:  values.senior_term_sheet_date || null,
      senior_approval_date:    values.senior_approval_date || null,
      senior_draw_date:        values.senior_draw_date || null,
      senior_notes:            values.senior_notes || null,
      updated_at:              new Date().toISOString(),
    }).eq('id', dac.id)
    onRefresh()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* Stage stepper */}
        <Card>
          <CardContent className="pt-4 pb-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">Facility stage</p>
            <div className="flex items-start gap-0">
              {SENIOR_STAGES.map((stage, i) => {
                const isPast    = i < currentIdx
                const isCurrent = i === currentIdx
                return (
                  <div key={stage} className="flex items-start flex-1 min-w-0">
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      <div className={cn(
                        'h-2.5 w-2.5 rounded-full shrink-0 transition-colors',
                        isCurrent ? 'bg-primary ring-2 ring-primary/30' : isPast ? 'bg-primary/50' : 'bg-border',
                      )} />
                      <span className={cn(
                        'mt-2 text-center text-[10px] leading-tight px-0.5',
                        isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground',
                      )}>
                        {SENIOR_STAGE_LABELS[stage]}
                      </span>
                    </div>
                    {i < SENIOR_STAGES.length - 1 && (
                      <div className={cn(
                        'mt-1 h-px flex-1 shrink-0 transition-colors',
                        isPast || isCurrent ? 'bg-primary/40' : 'bg-border',
                      )} />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Form fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="senior_lender" render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Senior lender</FormLabel>
              <FormControl><Input placeholder="e.g. AIB, Bank of Ireland" {...field} /></FormControl>
            </FormItem>
          )} />

          <FormField control={form.control} name="senior_stage" render={({ field }) => (
            <FormItem>
              <FormLabel>Stage</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {SENIOR_STAGES.map(s => (
                    <SelectItem key={s} value={s}>{SENIOR_STAGE_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="senior_committed_amount" render={({ field }) => (
            <FormItem>
              <FormLabel>Facility size / committed (€)</FormLabel>
              <FormControl>
                <Input type="number" min={0} placeholder={String(dac.target_senior_amount ?? '')} {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="senior_drawn_amount" render={({ field }) => (
            <FormItem>
              <FormLabel>Amount drawn (€)</FormLabel>
              <FormControl>
                <Input type="number" min={0} {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField control={form.control} name="senior_term_sheet_date" render={({ field }) => (
            <FormItem>
              <FormLabel>Term sheet received</FormLabel>
              <FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl>
            </FormItem>
          )} />

          <FormField control={form.control} name="senior_approval_date" render={({ field }) => (
            <FormItem>
              <FormLabel>Credit approval</FormLabel>
              <FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl>
            </FormItem>
          )} />

          <FormField control={form.control} name="senior_draw_date" render={({ field }) => (
            <FormItem>
              <FormLabel>First draw</FormLabel>
              <FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl>
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="senior_notes" render={({ field }) => (
          <FormItem>
            <FormLabel>Facility notes</FormLabel>
            <FormControl><Textarea rows={3} placeholder="Lender contacts, conditions precedent, covenants…" {...field} /></FormControl>
          </FormItem>
        )} />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : 'Save changes'}
        </Button>
      </form>
    </Form>
  )
}

// ── Page root ──────────────────────────────────────────────────
export default function StaffDacDetail() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()

  const { data: dac, isLoading } = useQuery({
    queryKey: ['staff-dac', id],
    queryFn: async () => {
      const { data } = await supabase.from('dacs').select('*').eq('id', id!).single()
      return data as Dac | null
    },
    enabled: !!id,
  })

  const { data: subAmounts } = useQuery({
    queryKey: ['staff-dac-sub-amounts', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('subscriptions').select('amount, status').eq('dac_id', id!)
      return (data ?? []) as { amount: number; status: string }[]
    },
    enabled: !!id,
  })

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>
  if (!dac) return <div className="p-8 text-muted-foreground">DAC not found.</div>

  function refresh() {
    qc.invalidateQueries({ queryKey: ['staff-dac', id] })
    qc.invalidateQueries({ queryKey: ['staff-dac-sub-amounts', id] })
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <Link to="/app/staff/dacs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />DACs
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{dac.name}</h1>
          {dac.cohort_label && <p className="mt-1 text-muted-foreground">{dac.cohort_label}</p>}
        </div>
        {dacStatusBadge(dac.status as DacStatus)}
      </div>

      {/* Summary bar — always visible across all tabs */}
      <SummaryBar dac={dac} subAmounts={subAmounts ?? []} />

      <Tabs defaultValue="fundamentals">
        <TabsList>
          <TabsTrigger value="fundamentals">Fundamentals</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="senior">Senior</TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="fundamentals"><FundamentalsTab dac={dac} onRefresh={refresh} /></TabsContent>
          <TabsContent value="documents"><DocumentsTab dac={dac} /></TabsContent>
          <TabsContent value="subscriptions"><SubscriptionsTab dac={dac} /></TabsContent>
          <TabsContent value="senior"><SeniorTab dac={dac} onRefresh={refresh} /></TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
