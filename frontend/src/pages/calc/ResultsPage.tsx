import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PublicNav } from '@/components/shared/PublicNav'
import { Button } from '@/components/ui/button'
import { useCalcWizard } from '@/lib/calcWizard'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'

function yearsToSave(price: number, monthlyRate = 350): string {
  const deposit = price * 0.10
  const months = Math.ceil(deposit / monthlyRate)
  const y = Math.floor(months / 12)
  const m = months % 12
  if (m === 0) return `${y} years`
  if (y === 0) return `${m} months`
  return `${y}y ${m}m`
}

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
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Programme fit confirmed
        </div>
        <h1 className="text-3xl font-bold tracking-tight leading-tight">The programme works for your situation</h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Based on your target property and income, a regulated mortgage at the end of the 60-month term is a realistic outcome.
        </p>
      </div>

      {/* Key numbers */}
      <div className="space-y-3">
        {/* Hero metric — monthly fee */}
        <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
          <p className="text-xs font-medium opacity-70 uppercase tracking-widest">Monthly service fee</p>
          <p className="mt-2 text-4xl font-bold tabular-nums">
            {formatCurrency(state.monthlyDomiter)}
            <span className="text-xl font-normal opacity-60"> /mo</span>
          </p>
          <p className="mt-1 text-xs opacity-60">Domiter, paid monthly for 60 months</p>
        </div>

        {/* Two supporting stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">Entry Stake</p>
            <p className="mt-2 text-2xl font-bold tabular-nums">{formatCurrency(state.entryStake)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Paid once at the start</p>
          </div>
          <div className="rounded-2xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">Purchase option price</p>
            <p className="mt-2 text-2xl font-bold tabular-nums">{formatCurrency(state.strikePrice)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Fixed from day one</p>
          </div>
        </div>
      </div>

      {/* Traditional route comparison */}
      <div className="rounded-2xl border bg-muted/40 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Without Homeown</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Deposit required</p>
            <p className="text-2xl font-bold tabular-nums">{formatCurrency(state.propertyPrice * 0.10)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">upfront</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Time to save it</p>
            <p className="text-2xl font-bold tabular-nums">{yearsToSave(state.propertyPrice)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">at €350/month</p>
          </div>
        </div>
      </div>

      {/* Secondary details */}
      <div className="divide-y rounded-2xl border overflow-hidden">
        {[
          { label: 'Target property', value: formatCurrency(state.propertyPrice) },
          { label: 'Term', value: '60 months (5 years)' },
          ...(location ? [{ label: 'Location', value: location }] : []),
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-4 py-3.5 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-semibold">{value}</span>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <Button asChild size="lg" className="flex-1">
          <Link to="/calc/save">
            Save my results and book a call
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="flex-1">
          <Link to="/calc">Adjust my figures</Link>
        </Button>
      </div>

      {/* Disclaimer */}
      <div className="text-xs text-muted-foreground/70 leading-relaxed space-y-1.5">
        <p>These figures are illustrative. This self-assessment is not an eligibility determination; programme participation is confirmed only after document verification.</p>
        <p>Homeown does not provide mortgage credit. The purchase option is a right, not an obligation. Mortgage approval at exit is subject to independent lender assessment and is not guaranteed.</p>
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
    if (!state.county || !state.variant) navigate('/calc', { replace: true })
  }, [state.county, state.variant, navigate])

  if (!state.county || !state.variant) return null

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
