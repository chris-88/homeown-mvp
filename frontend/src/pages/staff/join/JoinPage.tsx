import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { STAFF_ROLE_LABELS } from '@/types'
import type { StaffRole } from '@/types'

type InviteState =
  | { status: 'loading' }
  | { status: 'invalid'; reason: string }
  | { status: 'already_joined' }
  | { status: 'valid'; firstName: string; lastName: string; email: string; role: StaffRole }

const schema = z.object({
  password: z.string().min(8, 'Minimum 8 characters'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] })
type FormValues = z.infer<typeof schema>

export default function StaffJoinPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const memberId = searchParams.get('id')
  const [invite, setInvite] = useState<InviteState>({ status: 'loading' })

  const form = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!memberId) { setInvite({ status: 'invalid', reason: 'No invite ID in URL.' }); return }
    supabase.rpc('get_staff_invite', { member_id: memberId }).then(({ data, error }) => {
      if (error || !data) { setInvite({ status: 'invalid', reason: 'Could not load invite.' }); return }
      if (!data.valid) {
        if (data.reason === 'already_joined') setInvite({ status: 'already_joined' })
        else setInvite({ status: 'invalid', reason: 'This invite link is not valid.' })
        return
      }
      setInvite({ status: 'valid', firstName: data.first_name, lastName: data.last_name, email: data.email, role: data.role })
    })
  }, [memberId])

  async function onSubmit({ password }: FormValues) {
    if (invite.status !== 'valid') return
    const { error: signUpError } = await supabase.auth.signUp({ email: invite.email, password })
    if (signUpError) { form.setError('root', { message: signUpError.message }); return }
    const { error: loginError } = await supabase.auth.signInWithPassword({ email: invite.email, password })
    if (loginError) { form.setError('root', { message: loginError.message }); return }
    navigate('/app/staff')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="text-xl font-semibold tracking-tight">Homeown</Link>
          <p className="mt-1 text-sm text-muted-foreground">Staff Portal</p>
        </div>

        {invite.status === 'loading' && (
          <Card><CardContent className="pt-6"><p className="text-center text-muted-foreground">Loading invite…</p></CardContent></Card>
        )}

        {invite.status === 'invalid' && (
          <Card>
            <CardHeader><CardTitle>Invalid invite</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">{invite.reason}</p></CardContent>
          </Card>
        )}

        {invite.status === 'already_joined' && (
          <Card>
            <CardHeader><CardTitle>Already activated</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">This staff account has already been activated.</p>
              <Button asChild className="w-full"><Link to="/auth/login">Sign in</Link></Button>
            </CardContent>
          </Card>
        )}

        {invite.status === 'valid' && (
          <Card>
            <CardHeader>
              <CardTitle>Activate your account</CardTitle>
              <CardDescription>
                You've been invited as <strong>{STAFF_ROLE_LABELS[invite.role]}</strong>.
                Set a password to get started, {invite.firstName}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                    {invite.email}
                  </div>
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl><Input type="password" placeholder="Min. 8 characters" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="confirm" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm password</FormLabel>
                      <FormControl><Input type="password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  {form.formState.errors.root && (
                    <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
                  )}
                  <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Activating…' : 'Activate account'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
