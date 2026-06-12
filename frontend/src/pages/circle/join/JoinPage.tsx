import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { supabase } from '@/lib/supabase'

interface InviteData {
  first_name: string
  email: string
  already_joined: boolean
}

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
})
type FormValues = z.infer<typeof schema>

export default function JoinPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const memberId = params.get('id')

  const [loading, setLoading] = useState(true)
  const [invite, setInvite] = useState<InviteData | null>(null)
  const [invalid, setInvalid] = useState(false)

  const form = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!memberId) { setInvalid(true); setLoading(false); return }
    supabase.rpc('get_circle_invite', { member_id: memberId }).then(({ data }) => {
      if (!data || data.length === 0) { setInvalid(true) }
      else { setInvite(data[0] as InviteData) }
      setLoading(false)
    })
  }, [memberId])

  async function onSubmit({ password }: FormValues) {
    if (!invite) return
    const { error: signUpError } = await supabase.auth.signUp({ email: invite.email, password })
    if (signUpError) {
      form.setError('root', { message: signUpError.message })
      return
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: invite.email, password })
    if (signInError) {
      form.setError('root', { message: 'Account created — please sign in.' })
      navigate('/auth/login')
      return
    }
    navigate('/app/circle')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (invalid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="max-w-sm text-center space-y-4">
          <Link to="/" className="text-xl font-semibold tracking-tight">Homeown</Link>
          <p className="text-muted-foreground">
            This link is invalid or has expired. Please contact your Homeown relationship manager.
          </p>
        </div>
      </div>
    )
  }

  if (invite?.already_joined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="max-w-sm text-center space-y-4">
          <Link to="/" className="text-xl font-semibold tracking-tight">Homeown</Link>
          <p className="text-muted-foreground">You've already set up your account.</p>
          <Button asChild><Link to="/auth/login">Sign in</Link></Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center space-y-1">
          <Link to="/" className="text-xl font-semibold tracking-tight block">Homeown</Link>
          <h1 className="text-2xl font-bold">Welcome to the Homeown Circle, {invite?.first_name}</h1>
          <p className="text-muted-foreground text-sm">Set a password to access your investor portal.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
            <CardDescription>Your account will be linked to {invite?.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Email address</label>
                  <Input value={invite?.email ?? ''} readOnly className="bg-muted" />
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
                  {form.formState.isSubmitting ? 'Creating account…' : 'Create my account'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
