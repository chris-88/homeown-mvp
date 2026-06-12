import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { STAFF_ROLE_LABELS } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function ProfilePage() {
  const { staffMember, user } = useAuth()
  const qc = useQueryClient()

  const [displayName, setDisplayName] = useState(staffMember?.display_name ?? '')
  const [phone, setPhone] = useState(staffMember?.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)


  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)

  if (!staffMember) {
    return (
      <div className="mx-auto max-w-xl p-8">
        <p className="text-muted-foreground">
          Your staff profile is not yet set up. Ask an admin to create your staff_members record.
        </p>
      </div>
    )
  }

  async function handleSaveProfile() {
    setSaving(true); setSaved(false)
    await supabase.from('staff_members').update({
      display_name: displayName || null,
      phone: phone || null,
    }).eq('id', staffMember!.id)
    qc.invalidateQueries({ queryKey: ['auth'] })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleChangePassword() {
    setPwError('')
    if (newPw !== confirmPw) { setPwError('Passwords do not match'); return }
    if (newPw.length < 8) { setPwError('Minimum 8 characters'); return }
    setPwSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) { setPwError(error.message); setPwSaving(false); return }
    setNewPw(''); setConfirmPw('')
    setPwSaving(false); setPwSaved(true)
    setTimeout(() => setPwSaved(false), 3000)
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="mt-1 text-muted-foreground">Update your display preferences and password.</p>
      </div>

      {/* Identity */}
      <Card>
        <CardHeader><CardTitle>Account info</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{staffMember.first_name} {staffMember.last_name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Email</span>
            <span>{user?.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Role</span>
            <Badge variant="outline">{STAFF_ROLE_LABELS[staffMember.role]}</Badge>
          </div>
          {staffMember.job_title && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Title</span>
              <span>{staffMember.job_title}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editable profile */}
      <Card>
        <CardHeader><CardTitle>Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Display name <span className="text-muted-foreground font-normal">(optional)</span></label>
            <Input
              className="mt-1"
              placeholder="How your name appears to clients"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Phone <span className="text-muted-foreground font-normal">(optional)</span></label>
            <Input
              className="mt-1"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader><CardTitle>Change password</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium">New password</label>
            <Input className="mt-1" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Confirm new password</label>
            <Input className="mt-1" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
          </div>
          {pwError && <p className="text-sm text-destructive">{pwError}</p>}
          {pwSaved && <p className="text-sm text-green-600">Password updated successfully.</p>}
          <Button onClick={handleChangePassword} disabled={pwSaving || !newPw}>
            {pwSaving ? 'Updating…' : 'Update password'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
