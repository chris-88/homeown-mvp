import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PublicNav } from '@/components/shared/PublicNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { supabase } from '@/lib/supabase'
import { useAuth, signInWithGoogle } from '@/lib/auth'
import { useCalcWizard, type CalcWizardState } from '@/lib/calcWizard'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle2 } from 'lucide-react'

const PENDING_KEY = 'homeown_calc_pending'

const schema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  email: z.string().email('Please enter a valid email address'),
  consent_contact: z.boolean().refine((v) => v, 'You must agree to be contacted'),
  consent_privacy: z.boolean().refine((v) => v, 'You must agree to the privacy notice'),
})
type FormValues = z.infer<typeof schema>

const consentSchema = z.object({
  consent_contact: z.boolean().refine((v) => v, 'You must agree to be contacted'),
  consent_privacy: z.boolean().refine((v) => v, 'You must agree to the privacy notice'),
})
type ConsentValues = z.infer<typeof consentSchema>

const COPY: Record<string, { heading: string; sub: string; button: string }> = {
  eligible: {
    heading: 'Save your results and book a call',
    sub: "Leave your details and we'll be in touch to book a 20-minute discovery call.",
    button: 'Save and request a call',
  },
  income_gap: {
    heading: 'Stay in touch',
    sub: "Leave your details and we'll reach out as things change.",
    button: 'Stay in touch',
  },
  mover: {
    heading: 'Keep me posted',
    sub: "We'll reach out when the mover pathway opens.",
    button: 'Keep me posted',
  },
}

const NEXT_STEPS: Record<string, string[]> = {
  eligible: [
    "We'll review your details within 1 business day",
    "You'll get an email to book your discovery call (20 minutes, no obligation)",
    "The call is a two-way conversation; we'll answer your questions too",
  ],
  income_gap: [
    "We'll keep your details on file",
    "We'll reach out if programme parameters change or new options open up",
  ],
  mover: [
    "We'll notify you as soon as the mover pathway opens",
    'No commitment required at this stage',
  ],
}

async function submitCalcResults(
  first_name: string,
  last_name: string,
  email: string,
  calcState: CalcWizardState,
) {
  const variant = calcState.variant ?? 'eligible'
  const leadStage = variant === 'mover' ? 'deferred' : 'new_lead'
  const targetArea = calcState.county
    ? calcState.county + (calcState.dublinPostcode ? ` ${calcState.dublinPostcode}` : '')
    : null

  return supabase.rpc('save_calc_results', {
    p_first_name:       first_name,
    p_last_name:        last_name,
    p_email:            email,
    p_lead_stage:       leadStage,
    p_target_areas:     targetArea,
    p_target_price:     variant !== 'mover' && calcState.propertyPrice ? calcState.propertyPrice : null,
    p_property_price:   calcState.propertyPrice,
    p_entry_stake:      calcState.entryStake,
    p_monthly_domiter:  calcState.monthlyDomiter,
    p_strike_price:     calcState.strikePrice,
    p_county:           calcState.county || null,
    p_dublin_postcode:  calcState.dublinPostcode ?? null,
    p_household_type:   calcState.householdType ?? null,
    p_is_ftb:           calcState.isFtb ?? null,
    p_ghi:              calcState.ghi > 0 ? calcState.ghi : null,
    p_employment_type:  calcState.employmentType ?? null,
    p_eligible:         variant === 'mover' ? false : calcState.eligible,
    p_anon_session_id:  sessionStorage.getItem('anon_id') ?? null,
    p_user_agent:       navigator.userAgent,
  })
}

export default function SavePage() {
  const navigate = useNavigate()
  const { state: wizardState } = useCalcWizard()
  const { user, client, loading: authLoading } = useAuth()
  const [savedName, setSavedName] = useState('')
  const [oauthCalcState, setOauthCalcState] = useState<CalcWizardState | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)

  // ── After OAuth redirect: restore pending calc state ──────────
  useEffect(() => {
    if (authLoading || !user) return
    const raw = localStorage.getItem(PENDING_KEY)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as CalcWizardState
      setOauthCalcState(parsed)
    } catch {
      // ignore malformed state
    }
    localStorage.removeItem(PENDING_KEY)
  }, [authLoading, user])

  // Determine which calc state to use
  const activeState = oauthCalcState ?? wizardState
  const variant = activeState.variant ?? 'eligible'
  const copy = COPY[variant] ?? COPY.eligible

  // ── Standard form (email + password) ─────────────────────────
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: client?.first_name ?? '',
      last_name: client?.last_name ?? '',
      email: user?.email ?? '',
      consent_contact: false,
      consent_privacy: false,
    },
  })

  // ── OAuth consent-only form ───────────────────────────────────
  const consentForm = useForm<ConsentValues>({
    resolver: zodResolver(consentSchema),
    defaultValues: { consent_contact: false, consent_privacy: false },
  })

  async function onSubmit({ first_name, last_name, email }: FormValues) {
    const { error } = await submitCalcResults(first_name, last_name, email, activeState)
    if (error) {
      form.setError('root', { message: 'Something went wrong. Please try again.' })
      return
    }
    setSavedName(first_name)
  }

  async function onConsentSubmit(_values: ConsentValues) {
    // OAuth mode: use name from client record or user metadata
    const meta = user?.user_metadata as { full_name?: string; name?: string } || {}
    const nameParts = (client?.first_name ? `${client.first_name} ${client.last_name}` : meta.full_name || meta.name || '').split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    const { error } = await submitCalcResults(firstName, lastName, user?.email ?? '', oauthCalcState!)
    if (error) {
      consentForm.setError('root', { message: 'Something went wrong. Please try again.' })
      return
    }
    setSavedName(firstName || user?.email?.split('@')[0] || 'there')
  }

  async function handleContinueWithGoogle() {
    setGoogleLoading(true)
    localStorage.setItem(PENDING_KEY, JSON.stringify(activeState))
    localStorage.setItem('homeown_oauth_next', '/calc/save')
    await signInWithGoogle()
    // If we reach here the redirect didn't happen (error case)
    setGoogleLoading(false)
    localStorage.removeItem(PENDING_KEY)
    localStorage.removeItem('homeown_oauth_next')
  }

  // ── Success state ─────────────────────────────────────────────
  if (savedName) {
    const nextSteps = NEXT_STEPS[variant] ?? NEXT_STEPS.eligible
    return (
      <div className="min-h-screen bg-background">
        <PublicNav />
        <main className="mx-auto max-w-lg px-6 py-24">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-normal">
              {variant === 'eligible' ? `You're on the list, ${savedName}.` : `Thanks, ${savedName}.`}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {variant === 'eligible'
                ? "Check your inbox. We'll be in touch shortly to book your call."
                : "We'll keep your details and reach out when something changes."}
            </p>
          </div>

          <div className="mt-8 rounded border bg-muted/30 p-5">
            <p className="text-sm font-medium">What happens next</p>
            <ul className="mt-3 space-y-2">
              {nextSteps.map((step) => (
                <li key={step} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-0.5 shrink-0 text-primary">•</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" className="flex-1" onClick={() => navigate('/')}>Back to home</Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/calc">Run the calculator again</Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  // ── OAuth consent form (returned from Google sign-in) ─────────
  if (oauthCalcState && user) {
    const meta = user.user_metadata as { full_name?: string; name?: string } || {}
    const displayName = client?.first_name
      ? `${client.first_name} ${client.last_name}`
      : meta.full_name || meta.name || user.email

    return (
      <div className="min-h-screen bg-background">
        <PublicNav />
        <main className="mx-auto max-w-lg px-6 py-16 space-y-8">
          <div>
            <h1 className="text-2xl font-normal tracking-tight">{copy.heading}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{copy.sub}</p>
          </div>

          {/* Results summary */}
          {variant === 'eligible' && oauthCalcState.propertyPrice > 0 && (
            <div className="divide-y rounded border bg-muted/30">
              {[
                { label: 'Monthly service fee', value: `${formatCurrency(oauthCalcState.monthlyDomiter)} / mo` },
                { label: 'Entry Stake', value: formatCurrency(oauthCalcState.entryStake) },
                { label: 'Purchase option price', value: formatCurrency(oauthCalcState.strikePrice) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-semibold numeric">{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Signed-in user info */}
          <div className="rounded border bg-brand-cream-light px-4 py-3 text-sm">
            <p className="font-medium">{displayName}</p>
            <p className="text-muted-foreground">{user.email}</p>
          </div>

          {/* Consent only */}
          <Form {...consentForm}>
            <form onSubmit={consentForm.handleSubmit(onConsentSubmit)} className="space-y-5">
              <FormField control={consentForm.control} name="consent_contact" render={({ field }) => (
                <FormItem className="flex items-start gap-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div>
                    <FormLabel className="font-normal">I agree to be contacted about the Homeown pathway</FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )} />
              <FormField control={consentForm.control} name="consent_privacy" render={({ field }) => (
                <FormItem className="flex items-start gap-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div>
                    <FormLabel className="font-normal">
                      I agree to the{' '}
                      <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">privacy notice</Link>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )} />
              {consentForm.formState.errors.root && (
                <p className="text-sm text-destructive">{consentForm.formState.errors.root.message}</p>
              )}
              <Button type="submit" className="w-full" disabled={consentForm.formState.isSubmitting}>
                {consentForm.formState.isSubmitting ? 'Saving…' : copy.button}
              </Button>
            </form>
          </Form>
        </main>
      </div>
    )
  }

  // ── Standard form ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="mx-auto max-w-lg px-6 py-16 space-y-8">

        <div>
          <h1 className="text-2xl font-normal tracking-tight">{copy.heading}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{copy.sub}</p>
        </div>

        {/* Results summary — eligible only */}
        {variant === 'eligible' && activeState.propertyPrice > 0 && (
          <div className="divide-y rounded border bg-muted/30">
            {[
              { label: 'Monthly service fee', value: `${formatCurrency(activeState.monthlyDomiter)} / mo` },
              { label: 'Entry Stake', value: formatCurrency(activeState.entryStake) },
              { label: 'Purchase option price', value: formatCurrency(activeState.strikePrice) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold numeric">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Google sign-up shortcut */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleContinueWithGoogle}
            disabled={googleLoading}
            className="flex w-full items-center justify-center gap-3 rounded-md border border-input bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 border-t" />
            <span className="text-xs text-muted-foreground">or fill in the form</span>
            <div className="flex-1 border-t" />
          </div>
        </div>

        {/* Manual form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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

            <FormField control={form.control} name="consent_contact" render={({ field }) => (
              <FormItem className="flex items-start gap-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div>
                  <FormLabel className="font-normal">I agree to be contacted about the Homeown pathway</FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )} />

            <FormField control={form.control} name="consent_privacy" render={({ field }) => (
              <FormItem className="flex items-start gap-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div>
                  <FormLabel className="font-normal">
                    I agree to the{' '}
                    <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">
                      privacy notice
                    </Link>
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )} />

            {form.formState.errors.root && (
              <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
            )}

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Saving…' : copy.button}
            </Button>
          </form>
        </Form>

        <p className="text-center text-xs text-muted-foreground">
          <Link to="/calc/results" className="underline underline-offset-2 hover:text-foreground">
            Back to my results
          </Link>
        </p>
      </main>
    </div>
  )
}
