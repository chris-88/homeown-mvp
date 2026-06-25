import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { IRISH_COUNTIES, PROPERTY_CASE_STATUS_LABELS } from '@/types'
import type { PropertyCase, PropertyCaseStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Home, Plus, ExternalLink, ChevronDown, ChevronUp, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const BER_RATINGS = ['A1','A2','A3','B1','B2','B3','C1','C2','C3','D1','D2','E1','E2','F','G','Exempt']

const schema = z.object({
  address_line_1: z.string().min(1, 'Required'),
  address_line_2: z.string().optional(),
  city:           z.string().min(1, 'Required'),
  county:         z.string().min(1, 'Required'),
  eircode:        z.string().optional(),
  listing_url:    z.string().url('Must be a valid URL').optional().or(z.literal('')),
  asking_price:   z.coerce.number().min(1, 'Required'),
  property_type:  z.string().min(1, 'Required'),
  bedrooms:       z.coerce.number().min(1, 'Required'),
  ber_rating:     z.string().optional(),
  client_notes:   z.string().optional(),
})
type FormValues = z.infer<typeof schema>

function statusIcon(status: PropertyCaseStatus) {
  if (status === 'go' || status === 'conditional_go' || status === 'accepted') return <CheckCircle2 className="h-3.5 w-3.5 text-brand-green" />
  if (status === 'no_go' || status === 'outbid' || status === 'vendor_withdrawn' || status === 'fallthrough') return <XCircle className="h-3.5 w-3.5 text-destructive" />
  if (status === 'under_review') return <Clock className="h-3.5 w-3.5 text-amber-500" />
  if (status === 'offer_submitted') return <AlertCircle className="h-3.5 w-3.5 text-blue-500" />
  return <Clock className="h-3.5 w-3.5 text-muted-foreground" />
}

function statusVariant(status: PropertyCaseStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'go' || status === 'accepted') return 'default'
  if (status === 'no_go' || status === 'fallthrough') return 'destructive'
  return 'secondary'
}

function PropertyCard({ property }: { property: PropertyCase }) {
  const [expanded, setExpanded] = useState(false)
  const label = PROPERTY_CASE_STATUS_LABELS[property.status] ?? property.status

  return (
    <div className="rounded-md border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold truncate">{property.address_line_1}{property.address_line_2 ? `, ${property.address_line_2}` : ''}</p>
          <p className="text-sm text-muted-foreground">{property.city}, {property.county}{property.eircode ? ` · ${property.eircode}` : ''}</p>
        </div>
        <Badge variant={statusVariant(property.status)} className="shrink-0 flex items-center gap-1">
          {statusIcon(property.status)}{label}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span><span className="text-muted-foreground">Asking: </span><span className="font-medium">{formatCurrency(property.asking_price)}</span></span>
        {property.property_type && <span><span className="text-muted-foreground">Type: </span><span className="font-medium capitalize">{property.property_type}</span></span>}
        {property.bedrooms && <span><span className="text-muted-foreground">Beds: </span><span className="font-medium">{property.bedrooms}</span></span>}
        {property.ber_rating && <span><span className="text-muted-foreground">BER: </span><span className="font-medium">{property.ber_rating}</span></span>}
      </div>

      {(property.listing_url || property.client_notes || property.gonogo_notes) && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? 'Less' : 'More detail'}
        </button>
      )}

      {expanded && (
        <div className="space-y-2 text-sm border-t pt-3">
          {property.listing_url && (
            <a href={property.listing_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-primary hover:underline underline-offset-2">
              <ExternalLink className="h-3 w-3" />View listing
            </a>
          )}
          {property.client_notes && (
            <p className="text-muted-foreground">{property.client_notes}</p>
          )}
          {property.gonogo_notes && (
            <div className="rounded-md bg-muted/50 px-3 py-2">
              <p className="text-xs font-medium mb-1">Review note from Homeown</p>
              <p className="text-muted-foreground text-xs">{property.gonogo_notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SubmitForm({ clientId, onDone }: { clientId: string; onDone: () => void }) {
  const form = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    await supabase.from('property_cases').insert({
      client_id:      clientId,
      status:         'submitted',
      address_line_1: values.address_line_1,
      address_line_2: values.address_line_2 || null,
      city:           values.city,
      county:         values.county,
      eircode:        values.eircode || null,
      listing_url:    values.listing_url || null,
      asking_price:   values.asking_price,
      property_type:  values.property_type,
      bedrooms:       values.bedrooms,
      ber_rating:     values.ber_rating || null,
      client_notes:   values.client_notes || null,
    })
    await supabase.from('events').insert({
      client_id:  clientId,
      event_type: 'property_submitted',
      payload:    { address: values.address_line_1 },
      visibility: 'client',
    })
    form.reset()
    onDone()
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Submit a property</CardTitle></CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Address */}
            <FormField control={form.control} name="address_line_1" render={({ field }) => (
              <FormItem><FormLabel>Address line 1</FormLabel><FormControl><Input placeholder="123 Main Street" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="address_line_2" render={({ field }) => (
              <FormItem><FormLabel>Address line 2 <span className="text-muted-foreground">(optional)</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
                    <SelectContent>{IRISH_COUNTIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="eircode" render={({ field }) => (
              <FormItem><FormLabel>Eircode <span className="text-muted-foreground">(optional)</span></FormLabel><FormControl><Input placeholder="D01 AB12" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="listing_url" render={({ field }) => (
              <FormItem><FormLabel>Listing URL <span className="text-muted-foreground">(optional)</span></FormLabel><FormControl><Input type="url" placeholder="https://daft.ie/..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            {/* Property details */}
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField control={form.control} name="asking_price" render={({ field }) => (
                <FormItem><FormLabel>Asking price (€)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="property_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="duplex">Duplex</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="bedrooms" render={({ field }) => (
                <FormItem><FormLabel>Bedrooms</FormLabel><FormControl><Input type="number" min={1} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="ber_rating" render={({ field }) => (
              <FormItem>
                <FormLabel>BER rating <span className="text-muted-foreground">(optional)</span></FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select if known" /></SelectTrigger></FormControl>
                  <SelectContent>{BER_RATINGS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="client_notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes <span className="text-muted-foreground">(optional)</span></FormLabel>
                <FormControl><Textarea placeholder="Why you like it, any concerns…" rows={3} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Submitting…' : 'Submit property'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default function PropertyPage() {
  const { client } = useAuth()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const canSearch = client?.programme_stage === 'searching'

  const { data: properties, isLoading } = useQuery<PropertyCase[]>({
    queryKey: ['client-properties', client?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('property_cases')
        .select('*')
        .eq('client_id', client!.id)
        .eq('active', true)
        .order('created_at', { ascending: false })
      return (data ?? []) as PropertyCase[]
    },
    enabled: !!client?.id && canSearch,
  })

  if (!client) return null

  if (!canSearch) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Home className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <h1 className="text-xl font-semibold">Property search</h1>
            <p className="mt-2 text-muted-foreground">This section opens once you have been matched with a DAC and your property brief is set. Your purchasing agent will be in touch.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Property search</h1>
          <p className="mt-1 text-muted-foreground">Submit properties you find and track our review.</p>
        </div>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />Submit property
          </Button>
        )}
      </div>

      {showForm && (
        <SubmitForm
          clientId={client.id}
          onDone={() => {
            setShowForm(false)
            qc.invalidateQueries({ queryKey: ['client-properties', client.id] })
          }}
        />
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !properties?.length && !showForm ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-dashed bg-muted/30 py-12 text-center">
          <Home className="h-8 w-8 text-muted-foreground/40" />
          <div>
            <p className="font-medium">No properties submitted yet</p>
            <p className="text-sm text-muted-foreground mt-1">When you find a property you like, submit it here for review.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />Submit your first property
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {properties?.map(p => <PropertyCard key={p.id} property={p} />)}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Our team reviews each submission within 3 business days. You can submit multiple properties simultaneously.
      </p>
    </div>
  )
}
