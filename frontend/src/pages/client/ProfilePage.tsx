import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'

const schema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  phone: z.string().optional(),
  target_areas: z.string().optional(),
  household_size: z.coerce.number().int().min(1).optional().or(z.literal('')),
})
type FormValues = z.infer<typeof schema>

export default function ProfilePage() {
  const { client } = useAuth()
  const qc = useQueryClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: client?.first_name ?? '',
      last_name: client?.last_name ?? '',
      phone: client?.phone ?? '',
      target_areas: client?.target_areas ?? '',
      household_size: client?.household_size ?? '',
    },
  })

  if (!client) return null

  async function onSubmit(values: FormValues) {
    if (!client) return
    const payload = {
      ...values,
      household_size: values.household_size === '' ? null : values.household_size,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('clients').update(payload).eq('id', client.id)
    if (error) return
    qc.invalidateQueries({ queryKey: ['auth'] })
    form.reset(values)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="mt-1 text-muted-foreground">Keep your details up to date.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Your details</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="first_name" render={({ field }) => (
                  <FormItem><FormLabel>First name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="last_name" render={({ field }) => (
                  <FormItem><FormLabel>Last name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone (optional)</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="target_areas" render={({ field }) => (
                <FormItem><FormLabel>Target areas (optional)</FormLabel><FormControl><Input placeholder="e.g. Dublin 6, Dublin 8" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="household_size" render={({ field }) => (
                <FormItem><FormLabel>Household size (optional)</FormLabel><FormControl><Input type="number" min={1} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving…' : 'Save changes'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Email: <span className="text-foreground">{client.email}</span></p>
        </CardContent>
      </Card>
    </div>
  )
}
