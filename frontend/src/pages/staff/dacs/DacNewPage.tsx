import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { ArrowLeft } from 'lucide-react'
import { DAC_STATUS_LABELS } from '@/types'

const schema = z.object({
  name: z.string().min(1, 'Required'),
  cohort_label: z.string().optional(),
  status: z.string().default('draft'),
  description: z.string().optional(),
  geographic_focus: z.string().optional(),
  property_count: z.coerce.number().int().min(0).optional().nullable(),
  target_sub_amount: z.coerce.number().int().min(0).optional().nullable(),
  target_senior_amount: z.coerce.number().int().min(0).optional().nullable(),
  coupon_rate: z.coerce.number().min(0).max(100).optional().nullable(),
  no_call_months: z.coerce.number().int().min(0).default(12),
  term_months: z.coerce.number().int().min(1).default(18),
  open_date: z.string().optional().nullable(),
  close_date: z.string().optional().nullable(),
  notes: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export default function DacNewPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'draft', no_call_months: 12, term_months: 18 },
  })

  async function onSubmit(values: FormValues) {
    const { data, error } = await supabase
      .from('dacs')
      .insert({
        ...values,
        created_by: user?.id ?? null,
        cohort_label: values.cohort_label || null,
        description: values.description || null,
        geographic_focus: values.geographic_focus || null,
        notes: values.notes || null,
        open_date: values.open_date || null,
        close_date: values.close_date || null,
      })
      .select()
      .single()

    if (error) {
      form.setError('root', { message: error.message })
      return
    }
    navigate(`/app/staff/dacs/${data.id}`)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <Link to="/app/staff/dacs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />DACs
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Create DAC</h1>
        <p className="mt-1 text-muted-foreground">Set up a new Designated Activity Company.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>DAC details</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Name</FormLabel>
                    <FormControl><Input placeholder="Homeown DAC 001" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="cohort_label" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cohort label <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl><Input placeholder="e.g. 2026-A" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.entries(DAC_STATUS_LABELS).map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="geographic_focus" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Geographic focus <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl><Input placeholder="e.g. Dublin commuter belt" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="property_count" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property count <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl><Input type="number" min={0} {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="target_sub_amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target sub amount (€) <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl><Input type="number" min={0} step={1} {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="target_senior_amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target senior amount (€) <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl><Input type="number" min={0} step={1} {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="coupon_rate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coupon rate (% p.a.) <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl><Input type="number" min={0} max={100} step={0.01} placeholder="e.g. 8.50" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="no_call_months" render={({ field }) => (
                  <FormItem>
                    <FormLabel>No-call period (months)</FormLabel>
                    <FormControl><Input type="number" min={0} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="term_months" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term (months)</FormLabel>
                    <FormControl><Input type="number" min={1} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="open_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Open date <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="close_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Close date <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl><Textarea rows={3} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Internal notes <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl><Textarea rows={2} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {form.formState.errors.root && (
                <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
              )}

              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating…' : 'Create DAC'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
