import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { STAFF_ROLE_LABELS } from '@/types'
import type { StaffRole } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { ArrowLeft, Copy, Check } from 'lucide-react'

const schema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  email: z.string().email('Valid email required'),
  role: z.string().min(1, 'Required') as z.ZodType<StaffRole>,
  job_title: z.string().optional(),
  phone: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export default function TeamNewPage() {
  const { user } = useAuth()
  const [memberId, setMemberId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const form = useForm<FormValues>({ resolver: zodResolver(schema) })

  const joinUrl = memberId
    ? `${window.location.origin}/#/staff/join?id=${memberId}`
    : null

  async function onSubmit(values: FormValues) {
    const { data, error } = await supabase
      .from('staff_members')
      .insert({
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        role: values.role,
        job_title: values.job_title || null,
        phone: values.phone || null,
        created_by: user?.id ?? null,
      })
      .select()
      .single()

    if (error) { form.setError('root', { message: error.message }); return }
    setMemberId(data.id)
  }

  async function copyJoinUrl() {
    if (!joinUrl) return
    await navigator.clipboard.writeText(joinUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (memberId) {
    return (
      <div className="mx-auto max-w-xl space-y-6 p-8">
        <Link to="/app/staff/team" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />Team
        </Link>

        <div>
          <h1 className="text-2xl font-bold">Staff member created</h1>
          <p className="mt-1 text-muted-foreground">Share this join link with them to activate their account.</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm font-medium">Join link</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md bg-muted px-3 py-2 text-xs break-all">{joinUrl}</code>
              <Button variant="outline" size="icon" onClick={copyJoinUrl}>
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This link lets them set their password and activate the account. Do not share it publicly.
            </p>
            <div className="flex gap-3">
              <Button asChild variant="outline"><Link to="/app/staff/team">Back to team</Link></Button>
              <Button asChild><Link to={`/app/staff/team/${memberId}`}>View profile</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 p-8">
      <Link to="/app/staff/team" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />Team
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Add team member</h1>
        <p className="mt-1 text-muted-foreground">Create a staff account. A join link will be generated.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="first_name" render={({ field }) => (
                  <FormItem><FormLabel>First name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="last_name" render={({ field }) => (
                  <FormItem><FormLabel>Last name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {(Object.entries(STAFF_ROLE_LABELS) as [StaffRole, string][]).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="job_title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Job title <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl><Input placeholder="e.g. Onboarding Specialist" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl><Input type="tel" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {form.formState.errors.root && (
                <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
              )}

              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating…' : 'Create staff member'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
