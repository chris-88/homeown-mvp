import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PublicNav } from '@/components/shared/PublicNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { supabase } from '@/lib/supabase'
import { useCalcWizard } from '@/lib/calcWizard'

const schema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  email: z.string().email('Please enter a valid email address'),
  consent_contact: z.boolean().refine((v) => v, 'You must agree to be contacted'),
  consent_privacy: z.boolean().refine((v) => v, 'You must agree to the privacy notice'),
})
type FormValues = z.infer<typeof schema>

const HEADINGS: Record<string, string> = {
  eligible: 'Save your results',
  income_gap: 'Stay in touch',
  mover: 'Stay in touch',
}

const SUCCESS: Record<string, (name: string) => string> = {
  eligible: (n) => `Thanks ${n}, we'll be in touch to book your discovery call.`,
  income_gap: (n) => `Thanks ${n}, we'll reach out as things change.`,
  mover: (n) => `Thanks ${n}, we'll be in touch when the mover pathway opens.`,
}

export default function SavePage() {
  const navigate = useNavigate()
  const { state } = useCalcWizard()
  const [savedName, setSavedName] = useState('')

  const variant = state.variant ?? 'eligible'
  const heading = HEADINGS[variant] ?? 'Save your results'

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { consent_contact: false, consent_privacy: false },
  })

  async function onSubmit({ first_name, last_name, email }: FormValues) {
    const leadStage = variant === 'mover' ? 'mover_interest' : 'registered'
    const targetArea = state.county
      ? state.county + (state.dublinPostcode ? ` ${state.dublinPostcode}` : '')
      : null

    const { error } = await supabase.rpc('save_calc_results', {
      p_first_name:       first_name,
      p_last_name:        last_name,
      p_email:            email,
      p_lead_stage:       leadStage,
      p_target_areas:     targetArea,
      p_target_price:     variant !== 'mover' && state.propertyPrice ? state.propertyPrice : null,
      p_property_price:   state.propertyPrice,
      p_entry_stake:      state.entryStake,
      p_monthly_domiter:  state.monthlyDomiter,
      p_strike_price:     state.strikePrice,
      p_county:           state.county || null,
      p_dublin_postcode:  state.dublinPostcode ?? null,
      p_household_type:   state.householdType ?? null,
      p_is_ftb:           state.isFtb ?? null,
      p_ghi:              state.ghi > 0 ? state.ghi : null,
      p_employment_type:  state.employmentType ?? null,
      p_eligible:         variant === 'mover' ? false : state.eligible,
      p_anon_session_id:  sessionStorage.getItem('anon_id') ?? null,
      p_user_agent:       navigator.userAgent,
    })

    if (error) {
      form.setError('root', { message: 'Something went wrong — please try again.' })
      return
    }

    setSavedName(first_name)
  }

  if (savedName) {
    const message = SUCCESS[variant]?.(savedName) ?? `Thanks ${savedName}.`
    return (
      <div className="min-h-screen bg-background">
        <PublicNav />
        <main className="mx-auto max-w-lg px-6 py-24 text-center">
          <div className="rounded-xl border bg-muted/30 p-10 space-y-4">
            <h1 className="text-2xl font-semibold">{message}</h1>
            <Button variant="outline" onClick={() => navigate('/')}>Back to home</Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="mx-auto max-w-lg px-6 py-16">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">{heading}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your details</CardTitle>
            <CardDescription>We'll use these to get in touch with you.</CardDescription>
          </CardHeader>
          <CardContent>
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
                      <FormLabel className="font-normal">I agree to the privacy notice</FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )} />

                {form.formState.errors.root && (
                  <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
                )}
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Saving...' : heading}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
