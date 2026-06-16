import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { supabase } from '@/lib/supabase'
import { AuthLayout } from '@/components/shared/AuthLayout'

const schema = z.object({ email: z.string().email('Please enter a valid email address') })
type FormValues = z.infer<typeof schema>

export default function ForgotPage() {
  const [sent, setSent] = useState(false)
  const form = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit({ email }: FormValues) {
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
    setSent(true)
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your email and we'll send a reset link.
      </p>

      <div className="mt-8">
        {sent ? (
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>If an account exists for that address, a reset link has been sent. Check your inbox.</p>
            <Link to="/auth/login" className="font-medium text-foreground hover:underline underline-offset-4">
              Back to sign in
            </Link>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="me@example.com" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button
                type="submit"
                className="w-full bg-brand-green text-brand-cream hover:bg-brand-green-light"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Sending…' : 'Send reset link'}
              </Button>
              <p className="text-sm text-muted-foreground">
                <Link to="/auth/login" className="hover:text-foreground hover:underline underline-offset-4">
                  Back to sign in
                </Link>
              </p>
            </form>
          </Form>
        )}
      </div>
    </AuthLayout>
  )
}
