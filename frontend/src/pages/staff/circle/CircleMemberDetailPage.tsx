import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ArrowLeft, Copy, Check, Download } from 'lucide-react'
import type { CircleMember, Dac, Subscription, CircleMemberDocument, CircleMemberNote, KycStatus, SubscriptionStatus } from '@/types'
import { KYC_STATUS_LABELS, SUBSCRIPTION_STATUS_LABELS, CIRCLE_MEMBER_DOC_TYPE_LABELS } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

function kycBadge(status: KycStatus) {
  if (status === 'complete') return <Badge variant="secondary" className="bg-green-100 text-green-800">{KYC_STATUS_LABELS[status]}</Badge>
  if (status === 'failed') return <Badge variant="destructive">{KYC_STATUS_LABELS[status]}</Badge>
  if (status === 'in_progress') return <Badge variant="secondary" className="bg-blue-100 text-blue-800">{KYC_STATUS_LABELS[status]}</Badge>
  return <Badge variant="secondary">{KYC_STATUS_LABELS[status]}</Badge>
}

function subStatusBadge(status: SubscriptionStatus) {
  const label = SUBSCRIPTION_STATUS_LABELS[status] ?? status
  if (['funded', 'active'].includes(status)) return <Badge variant="secondary" className="bg-green-100 text-green-800">{label}</Badge>
  if (status === 'funds_requested') return <Badge variant="secondary" className="bg-amber-100 text-amber-800">{label}</Badge>
  if (status === 'withdrawn') return <Badge variant="destructive">{label}</Badge>
  return <Badge variant="secondary">{label}</Badge>
}

const STATUS_TIMESTAMPS: Partial<Record<SubscriptionStatus, keyof Subscription>> = {
  funds_requested: 'funds_requested_at',
  funded: 'funded_at',
}

interface SubWithDac extends Subscription {
  dacs: { name: string; coupon_rate: number | null } | null
}

// ── Overview tab ───────────────────────────────────────────────
function OverviewTab({ member, onRefresh }: { member: CircleMember; onRefresh: () => void }) {
  const qc = useQueryClient()
  const { user } = useAuth()
  const [noteText, setNoteText] = useState('')
  const [posting, setPosting] = useState(false)
  const [copied, setCopied] = useState(false)

  const joinUrl = !member.user_id
    ? `${window.location.origin}/#/circle/join?id=${member.id}`
    : null

  const { data: notes } = useQuery({
    queryKey: ['circle-member-notes', member.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('circle_member_notes').select('*').eq('circle_member_id', member.id)
        .order('created_at', { ascending: false })
      return (data ?? []) as CircleMemberNote[]
    },
  })

  async function handleKycChange(value: string) {
    await supabase.from('circle_members').update({ kyc_status: value, updated_at: new Date().toISOString() }).eq('id', member.id)
    onRefresh()
  }

  async function postNote() {
    const text = noteText.trim()
    if (!text) return
    setPosting(true)
    await supabase.from('circle_member_notes').insert({
      circle_member_id: member.id,
      actor_id: user?.id ?? null,
      text,
    })
    setNoteText('')
    setPosting(false)
    qc.invalidateQueries({ queryKey: ['circle-member-notes', member.id] })
  }

  async function copyLink() {
    if (!joinUrl) return
    await navigator.clipboard.writeText(joinUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Member information</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><p className="text-muted-foreground">Name</p><p className="font-medium">{member.first_name} {member.last_name}</p></div>
            <div><p className="text-muted-foreground">Email</p><p>{member.email}</p></div>
            <div><p className="text-muted-foreground">Phone</p><p>{member.phone ?? '-'}</p></div>
            <div><p className="text-muted-foreground">Source</p><p>{member.source ?? '-'}</p></div>
            <div>
              <p className="text-muted-foreground">Portal status</p>
              <p>{member.user_id ? <span className="text-green-700 font-medium">Joined</span> : <span className="text-amber-600">Pending invite</span>}</p>
            </div>
          </div>
          {member.address && (
            <div><p className="text-muted-foreground">Address</p><p>{member.address}</p></div>
          )}

          {joinUrl && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-muted-foreground">Invite link (not yet joined)</p>
              <div className="flex items-center gap-2">
                <Input value={joinUrl} readOnly className="bg-muted font-mono text-xs" />
                <Button variant="outline" size="sm" onClick={copyLink} className="shrink-0">
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">KYC status</CardTitle></CardHeader>
        <CardContent>
          <Select value={member.kyc_status} onValueChange={handleKycChange}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(KYC_STATUS_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Internal notes</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Internal note — not visible to the member…"
              rows={3}
            />
            <Button size="sm" onClick={postNote} disabled={!noteText.trim() || posting}>
              {posting ? 'Posting…' : 'Post note'}
            </Button>
          </div>

          {notes && notes.length > 0 && (
            <ol className="relative border-l border-border pl-6 space-y-4">
              {notes.map((note) => (
                <li key={note.id} className="relative">
                  <div className="absolute -left-[25px] top-1 h-3 w-3 rounded-full border-2 border-primary bg-background" />
                  <p className="text-sm rounded-md bg-muted/50 px-3 py-2">{note.text}</p>
                  <time className="text-xs text-muted-foreground">{formatDate(note.created_at)}</time>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Investments tab ─────────────────────────────────────────────
function InvestmentsTab({ member }: { member: CircleMember }) {
  const qc = useQueryClient()
  const { user } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [statusLoading, setStatusLoading] = useState<string | null>(null)
  const [newSub, setNewSub] = useState({ dac_id: '', amount: '', status: 'soft_commit' as SubscriptionStatus, notes: '' })

  const { data: subscriptions } = useQuery({
    queryKey: ['staff-member-subs', member.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('*, dacs(name, coupon_rate)')
        .eq('circle_member_id', member.id)
        .order('created_at', { ascending: false })
      return (data ?? []) as SubWithDac[]
    },
  })

  const { data: allDacs } = useQuery({
    queryKey: ['all-non-draft-dacs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('dacs').select('id, name, coupon_rate, status').neq('status', 'draft').order('name')
      return (data ?? []) as Pick<Dac, 'id' | 'name' | 'coupon_rate' | 'status'>[]
    },
  })

  async function addSub() {
    if (!newSub.dac_id || !newSub.amount) return
    setSaving(true)
    const selectedDac = allDacs?.find(d => d.id === newSub.dac_id)
    await supabase.from('subscriptions').insert({
      circle_member_id: member.id,
      dac_id: newSub.dac_id,
      amount: parseInt(newSub.amount),
      coupon_rate_locked: selectedDac?.coupon_rate ?? null,
      initiated_by: 'staff',
      staff_actor_id: user?.id ?? null,
      status: newSub.status,
      committed_at: new Date().toISOString(),
      notes: newSub.notes || null,
    })
    setSaving(false)
    setDialogOpen(false)
    setNewSub({ dac_id: '', amount: '', status: 'soft_commit', notes: '' })
    qc.invalidateQueries({ queryKey: ['staff-member-subs', member.id] })
  }

  async function updateStatus(subId: string, status: SubscriptionStatus) {
    setStatusLoading(subId)
    const extra: Record<string, string> = {}
    const ts = STATUS_TIMESTAMPS[status]
    if (ts) extra[ts as string] = new Date().toISOString()
    await supabase.from('subscriptions').update({ status, ...extra, updated_at: new Date().toISOString() }).eq('id', subId)
    qc.invalidateQueries({ queryKey: ['staff-member-subs', member.id] })
    setStatusLoading(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialogOpen(true)}>Add subscription on behalf of member</Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          {!subscriptions?.length ? (
            <p className="text-sm text-muted-foreground py-4">No subscriptions yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-3 font-medium">DAC</th>
                  <th className="pb-3 pr-3 font-medium">Amount</th>
                  <th className="pb-3 pr-3 font-medium">Rate</th>
                  <th className="pb-3 pr-3 font-medium">Initiated by</th>
                  <th className="pb-3 pr-3 font-medium">Committed</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {subscriptions.map((s) => (
                  <tr key={s.id}>
                    <td className="py-3 pr-3 font-medium">{s.dacs?.name ?? '-'}</td>
                    <td className="py-3 pr-3">{formatCurrency(s.amount)}</td>
                    <td className="py-3 pr-3">{s.coupon_rate_locked ? `${s.coupon_rate_locked}%` : '-'}</td>
                    <td className="py-3 pr-3 capitalize">{s.initiated_by}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{s.committed_at ? formatDate(s.committed_at) : '-'}</td>
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
          <DialogHeader><DialogTitle>Add subscription on behalf of member</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>DAC</Label>
              <Select value={newSub.dac_id} onValueChange={(v) => setNewSub(p => ({ ...p, dac_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select a DAC" /></SelectTrigger>
                <SelectContent>
                  {allDacs?.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
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
              <Textarea
                rows={2} placeholder="Any relevant context…"
                value={newSub.notes}
                onChange={(e) => setNewSub(p => ({ ...p, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={addSub} disabled={!newSub.dac_id || !newSub.amount || saving}>
              {saving ? 'Saving…' : 'Add subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Documents tab ───────────────────────────────────────────────
function DocumentsTab({ member }: { member: CircleMember }) {
  const qc = useQueryClient()
  const { user } = useAuth()
  const [docName, setDocName] = useState('')
  const [docType, setDocType] = useState('kyc')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const { data: documents } = useQuery({
    queryKey: ['staff-member-docs', member.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('circle_member_documents').select('*').eq('circle_member_id', member.id)
        .order('created_at', { ascending: false })
      return (data ?? []) as CircleMemberDocument[]
    },
  })

  async function upload() {
    if (!file || !docName.trim()) return
    setUploading(true)
    const docId = crypto.randomUUID()
    const path = `circle/${member.id}/${docId}/${file.name}`
    const { error: upErr } = await supabase.storage.from('documents').upload(path, file)
    if (upErr) { setUploading(false); return }
    await supabase.from('circle_member_documents').insert({
      circle_member_id: member.id,
      doc_type: docType,
      name: docName.trim(),
      file_path: path,
      file_name: file.name,
      uploaded_by: user?.id ?? null,
    })
    setDocName('')
    setFile(null)
    setUploading(false)
    qc.invalidateQueries({ queryKey: ['staff-member-docs', member.id] })
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
              <Input placeholder="e.g. Passport copy" value={docName} onChange={(e) => setDocName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CIRCLE_MEMBER_DOC_TYPE_LABELS).map(([v, l]) => (
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
                      {CIRCLE_MEMBER_DOC_TYPE_LABELS[doc.doc_type as keyof typeof CIRCLE_MEMBER_DOC_TYPE_LABELS] ?? doc.doc_type}
                      {' '}&middot;{' '}{formatDate(doc.created_at)}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => openSignedUrl(doc.file_path)}>
                    <Download className="h-3.5 w-3.5 mr-1" />Download
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Page root ──────────────────────────────────────────────────
export default function CircleMemberDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()

  const { data: member, isLoading } = useQuery({
    queryKey: ['staff-circle-member', id],
    queryFn: async () => {
      const { data } = await supabase.from('circle_members').select('*').eq('id', id!).single()
      return data as CircleMember | null
    },
    enabled: !!id,
  })

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>
  if (!member) return <div className="p-8 text-muted-foreground">Member not found.</div>

  function refresh() { qc.invalidateQueries({ queryKey: ['staff-circle-member', id] }) }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <Link to="/app/staff/circle" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />Circle CRM
      </Link>
      <div>
        <h1 className="text-2xl font-bold">{member.first_name} {member.last_name}</h1>
        <p className="mt-1 text-muted-foreground">{member.email}</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="investments">Investments</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="overview"><OverviewTab member={member} onRefresh={refresh} /></TabsContent>
          <TabsContent value="investments"><InvestmentsTab member={member} /></TabsContent>
          <TabsContent value="documents"><DocumentsTab member={member} /></TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
