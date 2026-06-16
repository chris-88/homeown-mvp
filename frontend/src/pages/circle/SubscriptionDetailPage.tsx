import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download } from 'lucide-react'
import type { Subscription, DacDocument, SubscriptionStatus } from '@/types'
import { DAC_DOC_TYPE_LABELS } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

interface SubWithDac extends Subscription {
  dacs: {
    id: string
    name: string
    coupon_rate: number | null
    term_months: number
    no_call_months: number
    cohort_label: string | null
  } | null
}

const STATUS_STEPS: Array<{ key: SubscriptionStatus; label: string; tsField: keyof Subscription | null }> = [
  { key: 'soft_commit',      label: 'Soft Commit',      tsField: 'committed_at' },
  { key: 'subscribed',       label: 'Subscribed',       tsField: null },
  { key: 'funds_requested',  label: 'Funds Requested',  tsField: 'funds_requested_at' },
  { key: 'funded',           label: 'Funded',           tsField: 'funded_at' },
  { key: 'active',           label: 'Active',           tsField: null },
  { key: 'redeeming',        label: 'Redeeming',        tsField: null },
  { key: 'redeemed',         label: 'Redeemed',         tsField: null },
]

const STATUS_ORDER = STATUS_STEPS.map(s => s.key)

function stepIndex(status: SubscriptionStatus) {
  const i = STATUS_ORDER.indexOf(status)
  return i === -1 ? 0 : i
}

export default function SubscriptionDetailPage() {
  const { subscriptionId } = useParams<{ subscriptionId: string }>()

  const { data: sub, isLoading } = useQuery({
    queryKey: ['subscription', subscriptionId],
    queryFn: async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('*, dacs(id, name, coupon_rate, term_months, no_call_months, cohort_label)')
        .eq('id', subscriptionId!)
        .single()
      return data as SubWithDac | null
    },
    enabled: !!subscriptionId,
  })

  const { data: documents } = useQuery({
    queryKey: ['dac-documents', sub?.dac_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('dac_documents').select('*').eq('dac_id', sub!.dac_id).order('created_at')
      return (data ?? []) as DacDocument[]
    },
    enabled: !!sub?.dac_id,
  })

  async function openSignedUrl(filePath: string) {
    const { data } = await supabase.storage.from('documents').createSignedUrl(filePath, 300)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>
  if (!sub) return <div className="p-8 text-muted-foreground">Subscription not found.</div>

  const currentStep = stepIndex(sub.status as SubscriptionStatus)
  const isWithdrawn = sub.status === 'withdrawn'
  const dac = sub.dacs

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <Link to="/app/circle/portfolio" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />My portfolio
      </Link>

      <div>
        <h1 className="text-2xl font-bold">{dac?.name ?? 'Subscription'}</h1>
        {dac?.cohort_label && <p className="text-muted-foreground">{dac.cohort_label}</p>}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">My commitment</CardTitle></CardHeader>
        <CardContent className="text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><p className="text-muted-foreground">Amount</p><p className="font-medium">{formatCurrency(sub.amount)}</p></div>
            <div>
              <p className="text-muted-foreground">Rate</p>
              <p className="font-medium">{sub.coupon_rate_locked ? `${sub.coupon_rate_locked}% p.a.` : '-'}</p>
            </div>
            {dac?.term_months && <div><p className="text-muted-foreground">Term</p><p className="font-medium">{dac.term_months} months</p></div>}
            {dac?.no_call_months && <div><p className="text-muted-foreground">No-call period</p><p className="font-medium">{dac.no_call_months} months</p></div>}
            {sub.committed_at && <div><p className="text-muted-foreground">Committed</p><p className="font-medium">{formatDate(sub.committed_at)}</p></div>}
            {sub.maturity_date && <div><p className="text-muted-foreground">Maturity date</p><p className="font-medium">{formatDate(sub.maturity_date)}</p></div>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Status</CardTitle></CardHeader>
        <CardContent>
          {isWithdrawn ? (
            <Badge variant="destructive">Withdrawn</Badge>
          ) : (
            <div className="relative">
              {/* Single track line behind the dots */}
              <div className="absolute top-[5px] flex w-full px-[calc(100%/12)]">
                {STATUS_STEPS.slice(0, -1).map((_, i) => (
                  <div key={i} className={`h-0.5 flex-1 ${i < currentStep ? 'bg-primary' : 'bg-muted'}`} />
                ))}
              </div>
              {/* Dots + labels grid */}
              <div className="relative grid" style={{ gridTemplateColumns: `repeat(${STATUS_STEPS.length}, 1fr)` }}>
                {STATUS_STEPS.map((step, i) => {
                  const done = i <= currentStep
                  const current = i === currentStep
                  const ts = step.tsField ? sub[step.tsField] as string | null : null
                  return (
                    <div key={step.key} className="flex flex-col items-center">
                      <div className={`relative z-10 h-2.5 w-2.5 shrink-0 rounded-full border-2
                        ${done ? 'border-primary bg-primary' : 'border-muted bg-background'}
                        ${current ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                      />
                      <p className={`mt-2 text-center text-xs leading-tight
                        ${current ? 'font-semibold text-foreground' : done ? 'text-muted-foreground' : 'text-muted-foreground/40'}`}>
                        {step.label}
                      </p>
                      <p className="min-h-[1rem] mt-0.5 text-center text-[10px] text-muted-foreground">
                        {ts ? formatDate(ts) : ''}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {(documents?.length ?? 0) > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">DAC documents</CardTitle></CardHeader>
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
    </div>
  )
}
