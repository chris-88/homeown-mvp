import { useState } from 'react'
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
import { useAuth } from '@/lib/auth'
import { useCalcWizard } from '@/lib/calcWizard'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle2 } from 'lucide-react'

const schema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  email: z.string().email('Please enter a valid email address'),
  consent_contact: z.boolean().refine((v) => v, 'You must agree to be contacted'),
  consent_privacy: z.boolean().refine((v) => v, 'You must agree to the privacy notice'),
})
type FormValues = z.infer<typeof schema>


const COPY: Record<string, { heading: string; sub: string; button: string }> = {
  eligible: {
    heading: 'Save your results and book a call',
    sub: "Leave your details and we'll be in touch to book a 20-minute discovery call.",
    button: 'Save and request a call',
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
  mover: [
    "We'll notify you as soon as the mover pathway opens",
    'No commitment required at this stage',
  ],
}

async function submitCalcResults(
  first_name: string,
  last_name: string,
  email: string,
  calcState: ReturnType<typeof useCalcWizard>['state'],
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
  const { user, client } = useAuth()
  const [savedName, setSavedName] = useState('')
  // Determine which calc state to use
  const activeState = wizardState
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

  async function onSubmit({ first_name, last_name, email }: FormValues) {
    const { error } = await submitCalcResults(first_name, last_name, email, activeState)
    if (error) {
      form.setError('root', { message: 'Something went wrong. Please try again.' })
      return
    }
    setSavedName(first_name)
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

  // ── Standard form ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="mx-auto max-w-lg px-6 py-16 space-y-8">

        <div>
          <h1 className="text-2xl font-normal tracking-tight">{copy.heading}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{copy.sub}</p>
        </div>

        {/* Comparison table — eligible only */}
        {variant === 'eligible' && activeState.propertyPrice > 0 && (() => {
          const { propertyPrice, currentSavings, monthlySavings, strikePrice, entryStake, monthlyDomiter, currentHousingCost } = activeState
          const deposit = Math.round(propertyPrice * 0.10)

          const depositData = Array.from({ length: 11 }, (_, i) => ({
            deposit: Math.round(propertyPrice * 0.10 * Math.pow(1.05, i)),
            accumulated: Math.round(currentSavings + monthlySavings * 12 * i),
          }))
          const crossoverIdx = depositData.findIndex((d, i) => i > 0 && d.accumulated >= d.deposit)
          const crossoverYears: number = crossoverIdx <= 0 ? -1 : (() => {
            const prev = depositData[crossoverIdx - 1]!
            const curr = depositData[crossoverIdx]!
            const t = (prev.deposit - prev.accumulated) / ((curr.accumulated - prev.accumulated) - (curr.deposit - prev.deposit))
            return (crossoverIdx - 1) + Math.max(0, Math.min(1, t))
          })()

          const fmtYrsMonths = (y: number) => {
            const totalMonths = Math.round(y * 12)
            const yrs = Math.floor(totalMonths / 12)
            const mos = totalMonths % 12
            return mos === 0 ? `${yrs} yrs` : `${yrs} yrs, ${mos} mo`
          }

          const tradMoveIn = crossoverYears === -1 ? '> 10 years' : fmtYrsMonths(crossoverYears)
          const tradBuyPrice = Math.round(propertyPrice * Math.pow(1.05, crossoverYears === -1 ? 10 : crossoverYears))
          const tradMonthly = (currentHousingCost ?? 0) + monthlySavings

          const rows = [
            {
              label: 'Upfront',
              homeown: { main: formatCurrency(entryStake), sub: 'Entry Stake' },
              trad:    { main: formatCurrency(deposit),    sub: '10% deposit' },
            },
            {
              label: 'Move in',
              homeown: { main: '3–6 months', sub: 'from today' },
              trad:    { main: tradMoveIn,   sub: 'to save the deposit' },
            },
            {
              label: 'Monthly',
              homeown: { main: formatCurrency(monthlyDomiter), sub: 'service fee' },
              trad:    { main: formatCurrency(tradMonthly),    sub: 'housing + monthly contribution' },
            },
            {
              label: 'Buy price',
              homeown: { main: formatCurrency(strikePrice),    sub: 'fixed today' },
              trad:    { main: `~${formatCurrency(tradBuyPrice)}`, sub: crossoverYears === -1 ? 'estimated market price (10+ yrs)' : 'market price at purchase' },
            },
          ]

          return (
            <div className="rounded-lg border overflow-hidden">
              {/* Column headers */}
              <div className="grid grid-cols-[90px_1fr_1fr] sm:grid-cols-[110px_1fr_1fr]">
                <div className="bg-muted/40 border-b border-r" />
                {/* Homeown — featured column with green top accent */}
                <div className="bg-muted/40 border-b border-r border-t-2 border-t-primary px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">Homeown</p>
                </div>
                <div className="bg-muted/40 border-b px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Traditional</p>
                </div>
              </div>

              {rows.map(({ label, homeown, trad }) => (
                <div key={label} className="grid grid-cols-[90px_1fr_1fr] sm:grid-cols-[110px_1fr_1fr] border-b last:border-b-0">
                  <div className="bg-muted/20 border-r px-3 py-4 flex items-center">
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                  </div>
                  <div className="border-r px-4 py-4">
                    <p className="text-lg font-bold tabular-nums text-foreground">{homeown.main}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{homeown.sub}</p>
                  </div>
                  <div className="px-4 py-4">
                    <p className="text-lg font-bold tabular-nums text-muted-foreground">{trad.main}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{trad.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        })()}

        {/* What to expect */}
        {variant === 'eligible' && (
          <div className="rounded-md border bg-muted/30 p-5">
            <p className="text-sm font-medium mb-3">What happens next</p>
            <ul className="space-y-2">
              {NEXT_STEPS.eligible.map((s) => (
                <li key={s} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-0.5 shrink-0 text-primary">•</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

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
          <Link to="/calc" className="underline underline-offset-2 hover:text-foreground">
            Back to calculator
          </Link>
        </p>
      </main>
    </div>
  )
}
