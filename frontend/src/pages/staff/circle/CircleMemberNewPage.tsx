import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { ArrowLeft, Copy, Check } from 'lucide-react'
import type { CircleMember } from '@/types'

const schema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export default function CircleMemberNewPage() {
  const [createdMember, setCreatedMember] = useState<CircleMember | null>(null)
  const [copied, setCopied] = useState(false)

  const form = useForm<FormValues>({ resolver: zodResolver(schema) })

  const joinUrl = createdMember
    ? `${window.location.origin}/#/circle/join?id=${createdMember.id}`
    : ''

  async function onSubmit({ first_name, last_name, email, phone }: FormValues) {
    const { data, error } = await supabase
      .from('circle_members')
      .insert({ first_name, last_name, email, phone: phone ?? null })
      .select()
      .single()

    if (error) {
      form.setError('root', { message: error.message })
      return
    }
    setCreatedMember(data as CircleMember)
  }

  async function copyLink() {
    await navigator.clipboard.writeText(joinUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (createdMember) {
    return (
      <div className="mx-auto max-w-xl space-y-6 p-8">
        <Link to="/app/staff/circle" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />Circle CRM
        </Link>

        <div className="rounded-lg border border-green-200 bg-green-50 p-6 space-y-3">
          <p className="font-semibold text-green-800">Member created</p>
          <p className="text-sm text-green-700">
            Share this link with {createdMember.first_name}. They'll use it to set their password and access the portal.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Join link</label>
          <div className="flex items-center gap-2">
            <Input value={joinUrl} readOnly className="bg-muted font-mono text-xs" />
            <Button variant="outline" size="sm" onClick={copyLink} className="shrink-0">
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="flex gap-3">
          <Button asChild>
            <Link to={`/app/staff/circle/${createdMember.id}`}>Go to member record</Link>
          </Button>
          <Button variant="outline" onClick={() => { setCreatedMember(null); form.reset() }}>
            Add another member
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 p-8">
      <Link to="/app/staff/circle" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />Circle CRM
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Add Circle member</h1>
        <p className="mt-1 text-muted-foreground">Create a member record and generate their invite link.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Member details</CardTitle>
          <CardDescription>The invite link will be generated once the record is saved.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="first_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl><Input placeholder="Jane" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="last_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl><Input placeholder="Smith" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl><Input type="email" placeholder="jane@example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl><Input type="tel" placeholder="+353 87 000 0000" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {form.formState.errors.root && (
                <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
              )}

              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating…' : 'Create member'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
