import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { ArrowLeft, Download } from 'lucide-react'
import type { Dac, DacDocument, CircleMember, Subscription, DacStatus, SubscriptionStatus } from '@/types'
import { DAC_STATUS_LABELS, DAC_DOC_TYPE_LABELS, SUBSCRIPTION_STATUS_LABELS } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

interface DacWithSubs extends Dac {
  subscriptions: Array<{ amount: number; status: string }>
}

function dacStatusBadge(status: DacStatus) {
  const label = DAC_STATUS_LABELS[status]
  if (status === 'open') return <Badge className="bg-brand-green-muted text-brand-green hover:bg-brand-green-muted">{label}</Badge>
  if (status === 'upcoming') return <Badge variant="secondary">{label}</Badge>
  return <Badge variant="outline">{label}</Badge>
}

function computeRaised(subs: Array<{ amount: number; status: string }>) {
  return subs
    .filter(s => !['soft_commit', 'withdrawn'].includes(s.status))
    .reduce((sum, s) => sum + s.amount, 0)
}

const schema = z.object({
  amount: z.coerce.number().int().min(1, 'Amount must be at least €1'),
  confirmed: z.boolean().refine(v => v, 'You must confirm you have read the documents'),
})
type FormValues = z.infer<typeof schema>

export default function CircleDacDetail() {
  const { dacId } = useParams<{ dacId: string }>()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [subscribed, setSubscribed] = useState(false)
  const [subscribedAmount, setSubscribedAmount] = useState(0)

  const { data: member } = useQuery({
    queryKey: ['my-circle-member'],
    queryFn: async () => {
      const { data } = await supabase.from('circle_members').select('*').eq('user_id', user!.id).single()
      return data as CircleMember | null
    },
    enabled: !!user,
  })

  const { data: dac, isLoading } = useQuery({
    queryKey: ['dac', dacId],
    queryFn: async () => {
      const { data } = await supabase
        .from('dacs').select('*, subscriptions(amount, status)').eq('id', dacId!).single()
      return data as DacWithSubs | null
    },
    enabled: !!dacId,
  })

  const { data: documents } = useQuery({
    queryKey: ['dac-documents', dacId],
    queryFn: async () => {
      const { data } = await supabase
        .from('dac_documents').select('*').eq('dac_id', dacId!).order('created_at')
      return (data ?? []) as DacDocument[]
    },
    enabled: !!dacId,
  })

  const { data: existingSub } = useQuery({
    queryKey: ['my-dac-subscription', dacId, member?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('circle_member_id', member!.id)
        .eq('dac_id', dacId!)
        .maybeSingle()
      return data as Subscription | null
    },
    enabled: !!member && !!dacId,
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { confirmed: false },
  })

  async function openSignedUrl(filePath: string) {
    const { data } = await supabase.storage.from('documents').createSignedUrl(filePath, 300)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function onSubmit({ amount }: FormValues) {
    if (!member || !dac) return
    const { error } = await supabase.from('subscriptions').insert({
      circle_member_id: member.id,
      dac_id: dacId,
      amount,
      coupon_rate_locked: dac.coupon_rate,
      initiated_by: 'member',
      status: 'soft_commit',
      committed_at: new Date().toISOString(),
    })
    if (error) {
      form.setError('root', { message: 'Could not register subscription. Please try again.' })
      return
    }
    setSubscribedAmount(amount)
    setSubscribed(true)
    qc.invalidateQueries({ queryKey: ['my-subscriptions'] })
    qc.invalidateQueries({ queryKey: ['my-dac-subscription', dacId, member.id] })
  }

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>
  if (!dac) return <div className="p-8 text-muted-foreground">Opportunity not found.</div>

  const raised = computeRaised(dac.subscriptions)
  const target = dac.target_sub_amount ?? 0

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <Link to="/app/circle/opportunities" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />All opportunities
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{dac.name}</h1>
          {dac.cohort_label && <p className="text-muted-foreground">{dac.cohort_label}</p>}
        </div>
        {dacStatusBadge(dac.status as DacStatus)}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Investment terms</CardTitle></CardHeader>
        <CardContent className="text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            {dac.geographic_focus && <div><p className="text-muted-foreground">Geographic focus</p><p className="font-medium">{dac.geographic_focus}</p></div>}
            {dac.property_count && <div><p className="text-muted-foreground">Properties</p><p className="font-medium">{dac.property_count}</p></div>}
            {dac.coupon_rate && <div><p className="text-muted-foreground">Coupon rate</p><p className="font-medium">{dac.coupon_rate}% per annum</p></div>}
            <div><p className="text-muted-foreground">Term</p><p className="font-medium">{dac.term_months} months</p></div>
            <div><p className="text-muted-foreground">No-call period</p><p className="font-medium">{dac.no_call_months} months</p></div>
            {target > 0 && <div><p className="text-muted-foreground">Target amount</p><p className="font-medium">{formatCurrency(target)}</p></div>}
            {target > 0 && <div><p className="text-muted-foreground">Amount raised</p><p className="font-medium">{formatCurrency(raised)}</p></div>}
            {target > 0 && <div><p className="text-muted-foreground">Remaining</p><p className="font-medium">{formatCurrency(Math.max(0, target - raised))}</p></div>}
            {dac.open_date && <div><p className="text-muted-foreground">Open date</p><p className="font-medium">{formatDate(dac.open_date)}</p></div>}
            {dac.close_date && <div><p className="text-muted-foreground">Close date</p><p className="font-medium">{formatDate(dac.close_date)}</p></div>}
          </div>
          {dac.description && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-muted-foreground mb-1">Description</p>
              <p className="whitespace-pre-wrap">{dac.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {(documents?.length ?? 0) > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Documents</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y">
              {documents!.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{DAC_DOC_TYPE_LABELS[doc.doc_type as keyof typeof DAC_DOC_TYPE_LABELS] ?? doc.doc_type}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => openSignedUrl(doc.file_path)}>
                    <Download className="h-3.5 w-3.5 mr-1" />Download
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {dac.status === 'open' && (
        <Card>
          <CardHeader><CardTitle className="text-base">Subscribe</CardTitle></CardHeader>
          <CardContent>
            {subscribed ? (
              <div className="rounded-lg border border-brand-green/20 bg-brand-green-muted p-4 space-y-1">
                <p className="font-medium text-brand-green">Subscription registered</p>
                <p className="text-sm text-brand-green">
                  Your subscription of {formatCurrency(subscribedAmount)} has been registered. A member of the team will be in touch to confirm next steps.
                </p>
              </div>
            ) : existingSub ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">You already have a subscription for this DAC.</p>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium">{formatCurrency(existingSub.amount)}</p>
                  <Badge variant="secondary">{SUBSCRIPTION_STATUS_LABELS[existingSub.status as SubscriptionStatus] ?? existingSub.status}</Badge>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/app/circle/portfolio/${existingSub.id}`}>View subscription</Link>
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {dac.coupon_rate && (
                    <p className="text-sm text-muted-foreground">
                      Current rate: <strong>{dac.coupon_rate}% per annum</strong> (locked at subscription)
                    </p>
                  )}
                  <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (€)</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} step={1} placeholder="e.g. 25000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="confirmed" render={({ field }) => (
                    <FormItem className="flex items-start gap-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div>
                        <FormLabel className="font-normal">I have read the available documents and wish to register this subscription</FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )} />
                  {form.formState.errors.root && (
                    <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
                  )}
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Registering…' : 'Register subscription'}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
