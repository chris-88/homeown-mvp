import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { STAFF_ROLE_LABELS } from '@/types'
import type { StaffMember, StaffRole } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ArrowLeft, Copy, Check, Trash2 } from 'lucide-react'

// ─── Delete team member modal ───────────────────────────────────────────────
function DeleteMemberModal({
  open, onClose, member, onDeleted,
}: { open: boolean; onClose: () => void; member: StaffMember; onDeleted: () => void }) {
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const expected = `${member.first_name} ${member.last_name}`

  async function handleDelete() {
    setLoading(true); setError('')
    const { error: deleteErr } = await supabase.from('staff_members').delete().eq('id', member.id)
    if (deleteErr) { setError(deleteErr.message); setLoading(false); return }
    onDeleted()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Delete team member</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            This permanently removes <span className="font-medium text-foreground">{expected}</span> from the team.
            Clients and Circle members they were assigned to will become unassigned. This cannot be undone.
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

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { staffMember: me } = useAuth()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: member } = useQuery<StaffMember>({
    queryKey: ['staff-member', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_members').select('*').eq('id', id!).single()
      if (error) throw error
      return data as StaffMember
    },
    enabled: !!id,
  })

  const [formRole, setFormRole] = useState<StaffRole | ''>('')
  const [formTitle, setFormTitle] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formActive, setFormActive] = useState(true)

  // Sync form when member loads
  if (member && !formRole) {
    setFormRole(member.role)
    setFormTitle(member.job_title ?? '')
    setFormPhone(member.phone ?? '')
    setFormActive(member.active)
  }

  const joinUrl = member && !member.user_id
    ? `${window.location.origin}/#/staff/join?id=${member.id}`
    : null

  async function handleSave() {
    setSaving(true); setSaved(false)
    await supabase.from('staff_members').update({
      role: formRole as StaffRole,
      job_title: formTitle || null,
      phone: formPhone || null,
      active: formActive,
    }).eq('id', id!)
    qc.invalidateQueries({ queryKey: ['staff-member', id] })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function copyJoinUrl() {
    if (!joinUrl) return
    await navigator.clipboard.writeText(joinUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isAdmin = me?.role === 'admin'

  if (!member) return <div className="p-8 text-muted-foreground">Loading…</div>

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <Link to="/app/staff/team" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />Team
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{member.first_name} {member.last_name}</h1>
          <p className="mt-0.5 text-muted-foreground">{member.email}</p>
        </div>
        <div className="flex items-center gap-2">
          {member.user_id ? (
            <Badge variant="default">Active</Badge>
          ) : (
            <Badge variant="secondary">Pending activation</Badge>
          )}
          {isAdmin && member.id !== me?.id && (
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}
              className="text-destructive border-destructive/40 hover:bg-destructive/5">
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />Delete
            </Button>
          )}
        </div>
      </div>

      {/* Join URL (if not yet activated) */}
      {joinUrl && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardContent className="pt-4 space-y-2">
            <p className="text-sm font-medium">Pending activation: share join link</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-background px-2 py-1 text-xs break-all">{joinUrl}</code>
              <Button variant="outline" size="icon" className="shrink-0" onClick={copyJoinUrl}>
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit form (admin only) */}
      {isAdmin && (
        <Card>
          <CardHeader><CardTitle>Edit details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Role</label>
              <Select value={formRole} onValueChange={v => setFormRole(v as StaffRole)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(STAFF_ROLE_LABELS) as [StaffRole, string][]).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Job title</label>
              <Input className="mt-1" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="e.g. Senior Onboarding Specialist" />
            </div>

            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input className="mt-1" type="tel" value={formPhone} onChange={e => setFormPhone(e.target.value)} />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="active-toggle"
                type="checkbox"
                checked={formActive}
                onChange={e => setFormActive(e.target.checked)}
                className="rounded border-border"
              />
              <label htmlFor="active-toggle" className="text-sm">Active (can access the portal)</label>
            </div>

            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : saved ? 'Saved!' : 'Save changes'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Read-only view for non-admin */}
      {!isAdmin && (
        <Card>
          <CardContent className="pt-5 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span className="font-medium">{STAFF_ROLE_LABELS[member.role]}</span></div>
            {member.job_title && <div className="flex justify-between"><span className="text-muted-foreground">Title</span><span>{member.job_title}</span></div>}
            {member.phone && <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{member.phone}</span></div>}
          </CardContent>
        </Card>
      )}

      <DeleteMemberModal open={deleteOpen} onClose={() => setDeleteOpen(false)} member={member}
        onDeleted={() => navigate('/app/staff/team', { replace: true })} />
    </div>
  )
}
