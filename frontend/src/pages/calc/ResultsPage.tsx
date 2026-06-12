import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PublicNav } from '@/components/shared/PublicNav'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useCalcWizard } from '@/lib/calcWizard'
import { formatCurrency } from '@/lib/utils'

// ── Variant A — Eligible ──────────────────────────────────────
function EligibleResults() {
  const { state } = useCalcWizard()

  const rows = [
    { label: 'Target property', value: formatCurrency(state.propertyPrice) },
    { label: 'Monthly service fee (Domiter)', value: `${formatCurrency(state.monthlyDomiter)} / month` },
    { label: 'Entry Stake', value: formatCurrency(state.entryStake) },
    { label: 'Purchase option price', value: formatCurrency(state.strikePrice) },
    { label: 'Term', value: '60 months' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">The programme looks like a fit</h1>
        <p className="mt-3 text-muted-foreground">Based on your target property and household income, the Homeown pathway may be suitable for you.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <dl className="space-y-4">
            {rows.map(({ label, value }, i) => (
              <div key={label}>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="text-right text-sm font-semibold">{value}</dd>
                </div>
                {i < rows.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
        Homeown does not provide mortgage credit. The purchase option is a right, not an obligation. Mortgage approval at end of term is subject to an independent regulated lender's assessment and is not guaranteed. Monthly payments are a service fee, not rent and not credit repayments. This self-assessment is not an eligibility determination — programme participation is confirmed only after document verification.
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild className="flex-1">
          <Link to="/calc/save">Save my results and book a call</Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link to="/calc">Adjust my figures</Link>
        </Button>
      </div>
    </div>
  )
}

// ── Variant B — Income Gap ────────────────────────────────────
function IncomeGapResults() {
  const { state, setPrice } = useCalcWizard()
  const navigate = useNavigate()

  function adjustToMaxProperty() {
    setPrice(state.maxPropertyForIncome)
    navigate('/calc')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your target price may be out of reach at exit</h1>
      </div>

      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>
          Based on standard mortgage lending parameters, a household income of{' '}
          <strong className="text-foreground">{formatCurrency(state.ghi)}</strong> would typically support a
          regulated mortgage of up to{' '}
          <strong className="text-foreground">{formatCurrency(state.ghi * 4)}</strong>. For this property,
          the purchase option price at the end of the term would be{' '}
          <strong className="text-foreground">{formatCurrency(state.strikePrice)}</strong>, which is above that range.
        </p>
        <p>
          Based on your income, the programme works best for properties up to approximately{' '}
          <strong className="text-foreground">{formatCurrency(state.maxPropertyForIncome)}</strong>.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={adjustToMaxProperty} className="flex-1">
          Adjust my target price
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link to="/calc/save">Stay in touch</Link>
        </Button>
      </div>
    </div>
  )
}

// ── Variant C — Mover ─────────────────────────────────────────
function MoverResults() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">We're working on it for movers</h1>
      </div>

      <p className="text-muted-foreground leading-relaxed">
        The Homeown programme currently serves first-time buyers. We're building out the pathway for people
        looking to move — if that's you, leave your details and we'll be in touch when it opens.
      </p>

      <Button asChild className="w-full sm:w-auto">
        <Link to="/calc/save">Keep me posted</Link>
      </Button>
    </div>
  )
}

// ── Page root ─────────────────────────────────────────────────
export default function ResultsPage() {
  const { state } = useCalcWizard()
  const navigate = useNavigate()

  useEffect(() => {
    if (!state.county) navigate('/calc', { replace: true })
  }, [state.county, navigate])

  if (!state.county) return null

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="mx-auto max-w-lg px-6 py-16">
        {state.variant === 'eligible' && <EligibleResults />}
        {state.variant === 'income_gap' && <IncomeGapResults />}
        {state.variant === 'mover' && <MoverResults />}
      </main>
    </div>
  )
}
