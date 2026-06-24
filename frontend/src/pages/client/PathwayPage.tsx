import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

const ANNUAL_APPRECIATION = 0.05
const YEARS = 5

function pmtCalc(principal: number, annualRate: number, years: number) {
  const r = annualRate / 12
  const n = years * 12
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

function StatBlock({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-2xl font-bold tabular-nums text-primary">{value}</p>
      <p className="mt-0.5 text-sm text-muted-foreground leading-snug">{label}</p>
      {sub && <p className="text-xs text-muted-foreground/70 mt-0.5">{sub}</p>}
    </div>
  )
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0">
      <span className={`text-sm ${muted ? 'text-muted-foreground' : ''}`}>{label}</span>
      <span className={`text-sm font-medium tabular-nums ${muted ? 'text-muted-foreground' : ''}`}>{value}</span>
    </div>
  )
}

const STAGES = [
  {
    n: 1,
    title: 'Application & eligibility',
    body: 'You complete our calculator, have a discovery call with our team, and submit supporting documents. We confirm your eligibility based on income, household type, and programme criteria.',
  },
  {
    n: 2,
    title: 'Matching & property search',
    body: "You're matched with a Designated Activity Company (DAC) that co-invests in your property. You search the open market. Most participants search for several months. We provide guidance throughout.",
  },
  {
    n: 3,
    title: 'Acquisition',
    body: 'Once you identify a property, we purchase it through the DAC. You pay the Entry Stake on completion. Legal conveyancing proceeds in the normal way. You move in on completion day.',
  },
  {
    n: 4,
    title: 'Pathway (60 months)',
    body: "You pay a monthly service fee — the Domiter — and build a beneficial interest in the property. Your option price is fixed from day one. Homeown conducts six-monthly check-ins.",
  },
  {
    n: 5,
    title: 'Option & exit',
    body: "At the end of your pathway you have the option to purchase the property at the agreed option price, subject to independent mortgage approval. If you choose not to proceed, you exit the pathway.",
  },
]

export default function ClientPathwayPage() {
  const { client } = useAuth()

  const { data: snapshot } = useQuery({
    queryKey: ['client-snapshot', client?.id],
    queryFn: async () => {
      if (!client) return null
      const { data } = await supabase
        .from('calculator_snapshots')
        .select('property_price, ghi, current_housing_cost, monthly_savings, current_savings')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return data
    },
    enabled: !!client,
  })

  if (!client) return null

  const price = snapshot?.property_price ?? 0
  const ghi = snapshot?.ghi ?? 0
  const housingCost = snapshot?.current_housing_cost ?? 0
  const monthlySaving = snapshot?.monthly_savings ?? 0

  const entryStake   = Math.round(price * 0.01)
  const monthlyFee   = Math.round((price * 0.082) / 12)
  const optionPrice  = Math.round(price * 0.90)
  const strikeReduction = price - optionPrice
  const projected    = Math.round(price * Math.pow(1 + ANNUAL_APPRECIATION, YEARS))
  const appEur       = projected - price
  const appPct       = (appEur / price) * 100
  const ltv          = (optionPrice / projected) * 100
  const stressMtg    = Math.round(pmtCalc(optionPrice, 0.07, 30))
  const baseMtg      = Math.round(pmtCalc(optionPrice, 0.04, 30))
  const feePctGhi    = ghi > 0 ? ((monthlyFee * 12) / ghi * 100).toFixed(1) : null
  const stressPctGhi = ghi > 0 ? ((stressMtg * 12) / ghi * 100).toFixed(1) : null
  const tradMonthly  = housingCost + monthlySaving

  const hasNumbers = price > 0

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">My Pathway</h1>
        <p className="mt-1 text-muted-foreground">Your personalised numbers and how the Homeown pathway works.</p>
      </div>

      {!hasNumbers ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground text-sm">Your personalised numbers will appear here after your discovery call.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Your numbers */}
          <Card>
            <CardHeader><CardTitle className="text-base">Your numbers</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
                <StatBlock label="Entry Stake" value={formatCurrency(entryStake)} />
                <StatBlock label="Monthly service fee" value={formatCurrency(monthlyFee)} sub={feePctGhi ? `${feePctGhi}% of income` : undefined} />
                <StatBlock label="Option price" value={formatCurrency(optionPrice)} />
                <StatBlock label="Price reduction" value={formatCurrency(strikeReduction)} sub="vs today's market price" />
              </div>
              <p className="text-xs text-muted-foreground border-t pt-3">
                Based on a property price of {formatCurrency(price)}. Option price is fixed from the date of acquisition.
              </p>
            </CardContent>
          </Card>

          {/* Monthly comparison */}
          {tradMonthly > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Monthly cost comparison</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="rounded-lg border-t-2 border-primary bg-card p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">With Homeown</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(monthlyFee)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Monthly service fee</p>
                  </div>
                  <div className="rounded-lg border-t-2 border-border bg-muted/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Traditional route</p>
                    <p className="text-2xl font-bold">{formatCurrency(tradMonthly)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {housingCost > 0 && monthlySaving > 0
                        ? `${formatCurrency(housingCost)} housing + ${formatCurrency(monthlySaving)} saving`
                        : housingCost > 0 ? `${formatCurrency(housingCost)} housing cost`
                        : `${formatCurrency(monthlySaving)} monthly saving`}
                    </p>
                  </div>
                </div>
                {tradMonthly > monthlyFee && (
                  <p className="mt-4 text-sm text-muted-foreground border-t pt-3">
                    The Homeown service fee is <span className="font-medium text-foreground">{formatCurrency(tradMonthly - monthlyFee)}/mo less</span> than your current combined housing and saving commitment.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Financial model */}
          <Card>
            <CardHeader><CardTitle className="text-base">Financial model (year 5 projection)</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-0">
                <Row label="Projected market value" value={formatCurrency(projected)} />
                <Row label="Appreciation (€)" value={`+${formatCurrency(appEur)}`} />
                <Row label="Appreciation (%)" value={`+${appPct.toFixed(1)}%`} />
                <Row label="LTV at option exercise" value={`${ltv.toFixed(1)}%`} />
                <Row label="Stress-test mortgage (7%, 30yr)" value={`${formatCurrency(stressMtg)}/mo`} muted sub={stressPctGhi ? `${stressPctGhi}% of income` : undefined} />
                <Row label="Base mortgage (4%, 30yr)" value={`${formatCurrency(baseMtg)}/mo`} muted />
              </div>
              <p className="mt-3 text-xs text-muted-foreground border-t pt-3">
                Projections assume {(ANNUAL_APPRECIATION * 100).toFixed(0)}% annual appreciation and are illustrative only. Mortgage figures are indicative and subject to lender approval at completion.
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {/* The 5 stages */}
      <Card>
        <CardHeader><CardTitle className="text-base">How the pathway works</CardTitle></CardHeader>
        <CardContent>
          <ol className="space-y-6">
            {STAGES.map(({ n, title, body }) => (
              <li key={n} className="flex gap-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">
                  {n}
                </div>
                <div>
                  <p className="font-medium text-sm">{title}</p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
