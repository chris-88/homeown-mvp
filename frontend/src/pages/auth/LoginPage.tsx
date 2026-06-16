import { useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { AuthLayout } from '@/components/shared/AuthLayout'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Required'),
})
type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, loading } = useAuth()
  const form = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!loading && user && profile) {
      const from = (location.state as { from?: string } | null)?.from
      const defaultPath =
        profile.role === 'client' ? '/app/client' :
        profile.role === 'circle' ? '/app/circle' :
        '/app/staff'
      navigate(from ?? defaultPath, { replace: true })
    }
  }, [user, profile, loading, navigate, location.state])

  async function onSubmit({ email, password }: FormValues) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) form.setError('root', { message: error.message })
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">Sign in to your Homeown account</p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-4">
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="me@example.com" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
              <Link to="/auth/forgot" className="block text-xs text-muted-foreground hover:text-foreground">
                Forgot your password?
              </Link>
            </FormItem>
          )} />

          {form.formState.errors.root && (
            <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-brand-green text-brand-cream hover:bg-brand-green-light"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </Form>

      <p className="mt-6 text-sm text-muted-foreground">
        Don't have an account?{' '}
        <Link to="/auth/signup" className="font-medium text-foreground hover:underline underline-offset-4">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  )
}
