import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { IRISH_COUNTIES } from '@/types'

const schema = z.object({
  address_line_1: z.string().min(1, 'Required'),
  address_line_2: z.string().optional(),
  city: z.string().min(1, 'Required'),
  county: z.string().min(1, 'Required'),
  eircode: z.string().optional(),
  asking_price: z.coerce.number().min(1, 'Required'),
  agreed_price: z.coerce.number().min(1, 'Required'),
})
type FormValues = z.infer<typeof schema>

export default function PropertyPage() {
  const { client } = useAuth()
  const [submitted, setSubmitted] = useState(false)
  const form = useForm<FormValues>({ resolver: zodResolver(schema) })

  const eligible = client?.programme_stage === 'searching' || client?.programme_stage === 'dac_assigned'

  if (!client) return null

  if (!eligible) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <h1 className="text-2xl font-bold">Property submission</h1>
        <p className="mt-4 text-muted-foreground">This page will be available once you are eligible to search.</p>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <h1 className="text-2xl font-bold">Property submitted</h1>
        <p className="mt-4 text-muted-foreground">Your property has been submitted. We'll review it and be in touch.</p>
      </div>
    )
  }

  async function onSubmit(values: FormValues) {
    if (!client) return
    const { error } = await supabase.from('property_cases').insert({ ...values, client_id: client.id, status: 'submitted' })
    if (error) return
    await supabase.from('clients').update({ programme_stage: 'sale_agreed', updated_at: new Date().toISOString() }).eq('id', client.id)
    await supabase.from('events').insert({ event_type: 'sale_agreed_submitted', client_id: client.id, visibility: 'internal' })
    setSubmitted(true)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">Submit a property</h1>
        <p className="mt-1 text-muted-foreground">You have sale agreed. Fill in the details below.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Property details</CardTitle>
          <CardDescription>All fields marked required must be completed.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="address_line_1" render={({ field }) => (
                <FormItem><FormLabel>Address line 1</FormLabel><FormControl><Input placeholder="123 Main Street" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="address_line_2" render={({ field }) => (
                <FormItem><FormLabel>Address line 2 (optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>City / Town</FormLabel><FormControl><Input placeholder="Dublin" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="county" render={({ field }) => (
                  <FormItem>
                    <FormLabel>County</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select county" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {IRISH_COUNTIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="eircode" render={({ field }) => (
                <FormItem><FormLabel>Eircode (optional)</FormLabel><FormControl><Input placeholder="D01 AB12" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="asking_price" render={({ field }) => (
                  <FormItem><FormLabel>Asking price (€)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="agreed_price" render={({ field }) => (
                  <FormItem><FormLabel>Agreed price (€)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Submitting…' : 'Submit property'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
