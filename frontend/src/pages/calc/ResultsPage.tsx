import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PublicNav } from '@/components/shared/PublicNav'
import { Button } from '@/components/ui/button'
import { useCalcWizard } from '@/lib/calcWizard'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'

// ── Variant A — Eligible ──────────────────────────────────────
function EligibleResults() {
  const { state } = useCalcWizard()

  const location = state.county
    ? state.county + (state.dublinPostcode ? ` ${state.dublinPostcode}` : '')
    : null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Programme fit confirmed
        </div>
        <h1 className="text-3xl font-bold tracking-tight">The programme works for your situation</h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Based on your target property and income, a regulated mortgage at the end of the 60-month term is a realistic outcome.
        </p>
      </div>

      {/* 3 key numbers */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Monthly service fee', sub: 'Domiter, per month', value: `${formatCurrency(state.monthlyDomiter)} / mo` },
          { label: 'Entry Stake', sub: 'Paid once at the start', value: formatCurrency(state.entryStake) },
          { label: 'Purchase option price', sub: 'Fixed from day one', value: formatCurrency(state.strikePrice) },
        ].map(({ label, sub, value }) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1.5 text-2xl font-bold tabular-nums">{value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      {/* Secondary details */}
      <div className="divide-y rounded-xl border">
        {[
          { label: 'Target property', value: formatCurrency(state.propertyPrice) },
          { label: 'Term', value: '60 months (5 years)' },
          ...(location ? [{ label: 'Location', value: location }] : []),
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="text-xs text-muted-foreground leading-relaxed space-y-1.5">
        <p>These figures are illustrative. This self-assessment is not an eligibility determination; programme participation is confirmed only after document verification.</p>
        <p>Homeown does not provide mortgage credit. The purchase option is a right, not an obligation. Mortgage approval at exit is subject to independent lender assessment and is not guaranteed.</p>
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild className="flex-1">
          <Link to="/calc/save">
            Save my results and book a call
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
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

  const maxMortgage = state.ghi * 4
  const shortfall = state.strikePrice - maxMortgage

  function adjustToMaxProperty() {
    setPrice(state.maxPropertyForIncome)
    navigate('/calc')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5" />
          Income gap detected
        </div>
        <h1 className="text-3xl font-bold tracking-tight">This property may be out of reach at exit</h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Your income supports a standard mortgage of up to{' '}
          <strong className="text-foreground">{formatCurrency(maxMortgage)}</strong>. The purchase option price
          for your target property would be{' '}
          <strong className="text-foreground">{formatCurrency(state.strikePrice)}</strong>, a shortfall of{' '}
          <strong className="text-foreground">{formatCurrency(shortfall)}</strong>.
        </p>
      </div>

      {/* Gap breakdown */}
      <div className="divide-y rounded-xl border">
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <span className="text-muted-foreground">Your annual income</span>
          <span className="font-medium tabular-nums">{formatCurrency(state.ghi)}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <span className="text-muted-foreground">Standard mortgage capacity (4×)</span>
          <span className="font-medium tabular-nums">{formatCurrency(maxMortgage)}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <span className="text-muted-foreground">Purchase option price ({formatCurrency(state.propertyPrice)} target)</span>
          <span className="font-medium tabular-nums text-destructive">{formatCurrency(state.strikePrice)}</span>
        </div>
        <div className="flex items-center justify-between rounded-b-xl bg-primary/5 px-4 py-3 text-sm">
          <span className="font-medium">Programme fits up to</span>
          <span className="font-bold tabular-nums text-primary">{formatCurrency(state.maxPropertyForIncome)}</span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Adjust your target to{' '}
        <strong className="text-foreground">{formatCurrency(state.maxPropertyForIncome)}</strong> and the programme fits. Or leave your details and we'll reach out as your circumstances change.
      </p>

      {/* CTAs */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={adjustToMaxProperty} className="flex-1">
          Try {formatCurrency(state.maxPropertyForIncome)}
          <ArrowRight className="ml-2 h-4 w-4" />
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">We're building the mover pathway</h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          The Homeown programme currently serves first-time buyers. We're building out the pathway for people moving from one owned home to another. Leave your details and we'll reach out when it opens.
        </p>
      </div>

      <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        In the meantime, if you know a first-time buyer who might be a fit, point them to{' '}
        <Link to="/" className="underline underline-offset-2 hover:text-foreground">homeown.ie</Link>.
      </div>

      <Button asChild>
        <Link to="/calc/save">
          Keep me posted
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
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
