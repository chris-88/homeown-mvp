import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { supabase } from '@/lib/supabase'
import { useAuth, signInWithGoogle, signInWithApple } from '@/lib/auth'
import { Logo } from '@/components/shared/Logo'

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 fill-current" viewBox="0 0 24 24">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
    </svg>
  )
}

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Required'),
})
type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, profile, loading } = useAuth()
  const form = useForm<FormValues>({ resolver: zodResolver(schema) })
  const [oauthError, setOauthError] = useState('')

  useEffect(() => {
    if (!loading && user && profile) {
      if (profile.role === 'client') navigate('/app/client', { replace: true })
      else if (profile.role === 'circle') navigate('/app/circle', { replace: true })
      else navigate('/app/staff', { replace: true })
    }
  }, [user, profile, loading, navigate])

  async function onSubmit({ email, password }: FormValues) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) form.setError('root', { message: error.message })
  }

  async function handleGoogle() {
    setOauthError('')
    const { error } = await signInWithGoogle()
    if (error) setOauthError(error.message)
  }

  async function handleApple() {
    setOauthError('')
    const { error } = await signInWithApple()
    if (error) setOauthError('Apple Sign In requires additional configuration. Please use email.')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      {/* Logo */}
      <Link to="/" className="mb-8">
        <Logo className="h-8 w-auto text-foreground" />
      </Link>

      {/* Card */}
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-sm">
        <h1 className="text-center text-xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">Sign in to your Homeown account</p>

        {/* OAuth buttons */}
        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={handleApple}
            className="flex w-full items-center justify-center gap-3 rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <AppleIcon />
            Continue with Apple
          </button>
          <button
            type="button"
            onClick={handleGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </div>

        {oauthError && <p className="mt-3 text-center text-xs text-destructive">{oauthError}</p>}

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 border-t" />
          <span className="text-xs text-muted-foreground">or continue with email</span>
          <div className="flex-1 border-t" />
        </div>

        {/* Email / password form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="m@example.com" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link to="/auth/forgot" className="text-xs text-muted-foreground hover:text-foreground">
                    Forgot your password?
                  </Link>
                </div>
                <FormControl>
                  <Input type="password" autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {form.formState.errors.root && (
              <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-foreground text-background hover:bg-foreground/90"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </Form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/auth/signup" className="font-medium text-foreground hover:underline underline-offset-4">
            Sign up
          </Link>
        </p>
      </div>

      {/* Footer */}
      <p className="mt-8 max-w-xs text-center text-xs text-muted-foreground">
        By continuing, you agree to our{' '}
        <Link to="/terms" className="underline underline-offset-2 hover:text-foreground">Terms of Service</Link>
        {' '}and{' '}
        <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">Privacy Notice</Link>.
      </p>
    </div>
  )
}
