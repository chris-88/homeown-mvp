import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PublicNav } from '@/components/shared/PublicNav'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useCalcWizard, ROI_COUNTIES, DUBLIN_POSTCODES } from '@/lib/calcWizard'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Area, ComposedChart } from 'recharts'
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react'

const APPRECIATION = 0.05

// ── Helpers ───────────────────────────────────────────────────
function fmtK(v: number) { return `€${Math.round(v / 1000)}k` }

function SliderCard({
  label, value, display, min, max, step, onChange, minLabel, maxLabel,
}: {
  label: string; value: number; display: string
  min: number; max: number; step: number
  onChange: (v: number) => void
  minLabel?: string; maxLabel?: string
}) {
  const pct = `${((value - min) / (max - min)) * 100}%`
  return (
    <div className="rounded-md border bg-card px-5 py-4">
      <div className="flex items-baseline justify-between gap-4 mb-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold tabular-nums">{display}</p>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="slider-range"
        style={{ '--pct': pct } as React.CSSProperties} />
      {(minLabel || maxLabel) && (
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  )
}

// Compact inline slider used inside forms (Step 4)
function Slider({
  label, value, display, min, max, step, onChange, minLabel, maxLabel,
}: {
  label: string; value: number; display: string
  min: number; max: number; step: number
  onChange: (v: number) => void
  minLabel?: string; maxLabel?: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-base font-semibold tabular-nums">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-primary" style={{ minHeight: 44, cursor: 'pointer' }} />
      {(minLabel || maxLabel) && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  )
}

function RadioCard({ selected, onClick, children }: {
  selected: boolean; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button type="button" onClick={onClick}
      className={cn(
        'w-full rounded-md border-2 p-4 text-left transition-colors hover:bg-accent',
        selected ? 'border-primary bg-primary/5' : 'border-border bg-background',
      )}>
      {children}
    </button>
  )
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-8">
      <div className="mb-2 text-xs text-muted-foreground">
        Step {step} of {total}
      </div>
      <div className="h-1 w-full rounded-full bg-muted">
        <div className="h-1 rounded-full bg-primary transition-all duration-300"
          style={{ width: `${(step / total) * 100}%` }} />
      </div>
    </div>
  )
}

// ── Step 1 — Sliders ──────────────────────────────────────────
function Step1({ onNext }: { onNext: () => void }) {
  const { state, setPrice, update } = useCalcWizard()
  const maxSavings = Math.round(state.propertyPrice * 0.10)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Your situation</h2>
        <p className="mt-2 text-muted-foreground">
          Adjust the sliders — we'll show you exactly what your options look like.
        </p>
      </div>

      <div className="space-y-2">
      <SliderCard
        label="Property target"
        value={state.propertyPrice}
        display={formatCurrency(state.propertyPrice)}
        min={200000} max={800000} step={5000}
        onChange={setPrice}
        minLabel="€200k" maxLabel="€800k"
      />

      <SliderCard
        label="Current savings"
        value={Math.min(state.currentSavings, maxSavings)}
        display={formatCurrency(Math.min(state.currentSavings, maxSavings))}
        min={0} max={maxSavings} step={100}
        onChange={v => update({ currentSavings: v })}
        minLabel="€0" maxLabel={fmtK(maxSavings)}
      />

      <SliderCard
        label="Monthly savings"
        value={state.monthlySavings}
        display={formatCurrency(state.monthlySavings)}
        min={100} max={3000} step={100}
        onChange={v => update({ monthlySavings: v })}
        minLabel="€100" maxLabel="€3,000"
      />

      <SliderCard
        label="Gross household income"
        value={state.ghi}
        display={formatCurrency(state.ghi)}
        min={25000} max={200000} step={1000}
        onChange={v => update({ ghi: v })}
        minLabel="€25k" maxLabel="€200k"
      />
      </div>

      <p className="text-xs text-muted-foreground">
        These figures illustrate your financial position only. Homeown does not conduct credit assessments through this calculator.
      </p>

      <Button onClick={onNext} className="w-full" size="lg">
        See your projection
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )
}

// ── Step 2 — Charts (the wow moment) ─────────────────────────
const depositChartConfig = {
  deposit: { label: 'Deposit required', color: 'var(--destructive)' },
  savings: { label: 'Your savings', color: 'var(--primary)' },
} satisfies ChartConfig

const homeownChartConfig = {
  marketValue: { label: 'Market value', color: 'var(--color-muted-foreground)' },
  optionPrice: { label: 'Your option price', color: 'var(--primary)' },
} satisfies ChartConfig

function Step2({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { state } = useCalcWizard()
  const { propertyPrice, currentSavings, monthlySavings, strikePrice, entryStake, ghi } = state

  // Chart data
  const depositData = Array.from({ length: 11 }, (_, i) => ({
    year: i,
    deposit: Math.round(propertyPrice * 0.10 * Math.pow(1 + APPRECIATION, i)),
    savings: Math.round(currentSavings + monthlySavings * 12 * i),
  }))

  // Fractional crossover year via linear interpolation between integer years
  const crossoverIdx = depositData.findIndex((d, i) => i > 0 && d.savings >= d.deposit)
  const crossoverYears = (() => {
    if (crossoverIdx <= 0) return -1
    const prev = depositData[crossoverIdx - 1]
    const curr = depositData[crossoverIdx]
    const t = (prev.deposit - prev.savings) / ((curr.savings - prev.savings) - (curr.deposit - prev.deposit))
    return (crossoverIdx - 1) + Math.max(0, Math.min(1, t))
  })()

  const homeownData = Array.from({ length: 6 }, (_, i) => ({
    year: i,
    marketValue: Math.round(propertyPrice * Math.pow(1 + APPRECIATION, i)),
    optionPrice: strikePrice,
    equity: Math.round(propertyPrice * Math.pow(1 + APPRECIATION, i)) - strikePrice,
  }))
  const finalMarket = homeownData[5].marketValue
  const finalEquity = finalMarket - strikePrice

  const yMaxDeposit = Math.ceil(Math.max(depositData[10].deposit, depositData[10].savings) * 1.1 / 10000) * 10000
  const yMinHomeown = Math.max(0, strikePrice - 50000)
  const yMaxHomeown = Math.ceil(finalMarket * 1.06 / 10000) * 10000

  // Derived numbers — use fractional crossover year for accurate price forecast
  const alreadyHasDeposit  = currentSavings >= propertyPrice * 0.10
  const tradBuyYear         = crossoverYears > 0 ? crossoverYears : 10
  const tradBuyPrice        = Math.round(propertyPrice * Math.pow(1 + APPRECIATION, tradBuyYear))
  const tradDepositRequired = Math.round(tradBuyPrice * 0.10)

  const ghiEntered            = ghi > 0
  // Compact stat formatter for the summary grid
  function fmtStat(v: number) {
    return v >= 10000 ? `€${Math.round(v / 1000)}k` : formatCurrency(v)
  }

  // Start time display
  const startTimeLabel = crossoverYears > 0
    ? `${crossoverYears.toFixed(1)} years`
    : '10+ years'

  // Outcome bucket — drives all messaging on this page
  type Bucket = 'already_eligible' | 'close_race' | 'too_slow' | 'never' | 'income_capped'

  // Max property where exit mortgage fits within 4× GHI (rounded down to nearest €5k)
  const maxAffordableProperty = ghiEntered
    ? Math.floor((ghi * 4 / 0.9) / 5000) * 5000
    : 0

  const bucket: Bucket = (() => {
    if (alreadyHasDeposit)                       return 'already_eligible'
    if (ghiEntered && ghi * 4 < strikePrice)     return 'income_capped'
    if (crossoverYears === -1)                   return 'never'
    if (crossoverYears > 5)                      return 'too_slow'
    return 'close_race'
  })()

  const bucketCopy: Record<Bucket, { headline: string; body: string; benefit: string; detail: string; ctaLabel: string }> = {
    already_eligible: {
      headline: 'You could buy traditionally today.',
      body: `Your ${formatCurrency(currentSavings)} already covers the ${formatCurrency(Math.round(propertyPrice * 0.10))} deposit. The traditional route is open to you right now.`,
      benefit: `Homeown locks in ${formatCurrency(strikePrice)} — 10% below today's market price.`,
      detail: `Your 1% Entry Stake (${formatCurrency(entryStake)}) secures the option price in writing for the full 5-year term. If the market rises, your purchase price doesn't move.`,
      ctaLabel: 'Compare the pathways',
    },
    close_race: {
      headline: 'The target keeps moving.',
      body: `At your savings rate, you'd reach the deposit in ${startTimeLabel}. But by then the property costs ${formatCurrency(tradBuyPrice)}, so the deposit itself is ${formatCurrency(tradDepositRequired)}.`,
      benefit: `Homeown freezes ${formatCurrency(strikePrice)} from today. The race stops now.`,
      detail: `Instead of chasing a deposit that grows with the market, your 1% Entry Stake (${formatCurrency(entryStake)}) locks in the price. You move in this year and the option price is fixed in writing — regardless of where the market goes.`,
      ctaLabel: 'See how they compare',
    },
    too_slow: {
      headline: `At your savings rate, the deposit takes ${startTimeLabel}.`,
      body: `By the time you'd reach the traditional deposit, the Homeown 5-year programme would already be complete. Participants who started now would have built an estimated ${formatCurrency(finalEquity)} in equity.`,
      benefit: `Homeown gets you started this year.`,
      detail: `1% Entry Stake (${formatCurrency(entryStake)}). Option price fixed at ${formatCurrency(strikePrice)}. By the time you'd have saved the traditional deposit, you'd already own the home.`,
      ctaLabel: 'See my Homeown pathway',
    },
    never: {
      headline: 'The deposit gap never closes at this savings rate.',
      body: `The deposit grows with the property price. At ${formatCurrency(monthlySavings)}/mo your savings fall further behind each year — by year 10 the gap is ${formatCurrency(depositData[10].deposit - depositData[10].savings)}.`,
      benefit: `Homeown is the route in. No deposit race.`,
      detail: `1% Entry Stake (${formatCurrency(entryStake)}) to get started. Move in this year with the option to purchase at ${formatCurrency(strikePrice)}, fixed for the full term. The monthly service fee replaces your current housing cost — the deposit gap is removed from the equation.`,
      ctaLabel: 'See the Homeown alternative',
    },
    income_capped: {
      headline: `On ${formatCurrency(ghi)} income, the exit mortgage is the constraint.`,
      body: `Standard 4× lending supports a mortgage of ${formatCurrency(ghi * 4)}. The Homeown option price on this property is ${formatCurrency(strikePrice)} — a gap of ${formatCurrency(strikePrice - ghi * 4)}.`,
      benefit: `Two ways to make it work.`,
      detail: `1. Lower target: at your income, properties up to ${formatCurrency(maxAffordableProperty)} fit the Homeown pathway. 2. Increase Entry Contribution: an additional upfront payment of ${formatCurrency(strikePrice - ghi * 4)} brings your exit mortgage to ${formatCurrency(ghi * 4)}, within your income's range. Your adviser can walk through both.`,
      ctaLabel: 'Discuss my options',
    },
  }

  // Comparison table
  const compRows = [
    {
      label: 'Deposit required',
      trad: formatCurrency(tradDepositRequired),
      hw:   formatCurrency(entryStake),
    },
    {
      label: 'Start time',
      trad: startTimeLabel,
      hw:   'Now',
    },
    {
      label: 'Purchase price',
      trad: formatCurrency(tradBuyPrice),
      hw:   formatCurrency(strikePrice),
    },
    {
      label: 'Yr 5 equity',
      trad: formatCurrency(tradDepositRequired),
      hw:   formatCurrency(finalEquity),
    },
  ]

  const depositAtTradYear = tradDepositRequired
  const savingsAtTradYear = Math.round(currentSavings + monthlySavings * 12 * tradBuyYear)

  return (
    <div className="space-y-4">

      {/* ── Summary stat grid ── */}
      <div className="grid grid-cols-4 divide-x border-y">
        {[
          { label: 'Target', value: fmtStat(propertyPrice) },
          { label: 'Saving', value: fmtStat(monthlySavings) },
          { label: 'Saved',  value: fmtStat(currentSavings) },
          { label: 'Income', value: fmtStat(ghi) },
        ].map(({ label, value }) => (
          <div key={label} className="px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground leading-none">{label}</p>
            <p className="text-base font-bold tabular-nums mt-1 leading-none">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Realisation — bucket-specific messaging ── */}
      <div className="rounded-md border overflow-hidden">
        <div className="px-4 py-3">
          <p className="text-sm font-semibold">{bucketCopy[bucket].headline}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{bucketCopy[bucket].body}</p>
        </div>
        <div className="px-4 py-3 bg-brand-green-muted border-t border-brand-green/15">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-green mb-1.5">Homeown pathway</p>
          <p className="text-sm font-semibold text-brand-green">{bucketCopy[bucket].benefit}</p>
          <p className="text-sm text-brand-green/80 mt-0.5">{bucketCopy[bucket].detail}</p>
        </div>
      </div>

      {/* ── Traditional route — card + callout ── */}
      <Card>
        <CardHeader className="pb-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Traditional route</p>
          <p className="text-xl font-bold leading-snug">The deposit keeps moving.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ChartContainer config={depositChartConfig} className="h-44 w-full">
            <LineChart data={depositData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="year" tickFormatter={(v: number) => v === 0 ? 'Now' : `Yr ${v}`}
                tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={fmtK} tickLine={false} axisLine={false}
                tick={{ fontSize: 10 }} width={36} domain={[0, yMaxDeposit]} />
              <ChartTooltip content={
                <ChartTooltipContent
                  formatter={(v) => formatCurrency(typeof v === 'number' ? v : 0)}
                  labelFormatter={(l) => Number(l) === 0 ? 'Now' : `Year ${l}`}
                />
              } />
              <Line dataKey="deposit" stroke="var(--color-deposit)" strokeWidth={2.5} dot={false} />
              <Line dataKey="savings" stroke="var(--color-savings)" strokeWidth={2}
                dot={false} strokeDasharray="5 3" />
            </LineChart>
          </ChartContainer>
          <div className="flex items-start gap-2 pt-2 border-t text-sm">
            <TrendingDown className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Deposit required by {startTimeLabel}: {formatCurrency(depositAtTradYear)}</p>
              <p className="text-muted-foreground">Your savings reach {formatCurrency(savingsAtTradYear)} in the same period.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Homeown pathway — card + callout ── */}
      <Card>
        <CardHeader className="pb-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-green">Homeown pathway</p>
          <p className="text-xl font-bold leading-snug">Your price is fixed. The market works for you.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ChartContainer config={homeownChartConfig} className="h-44 w-full">
            <ComposedChart data={homeownData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="year" tickFormatter={(v: number) => v === 0 ? 'Now' : `Yr ${v}`}
                tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={fmtK} tickLine={false} axisLine={false}
                tick={{ fontSize: 10 }} width={36} domain={[yMinHomeown, yMaxHomeown]} />
              <ChartTooltip content={
                <ChartTooltipContent
                  formatter={(v) => formatCurrency(typeof v === 'number' ? v : 0)}
                  labelFormatter={(l) => Number(l) === 0 ? 'Now' : `Year ${l}`}
                  hideIndicator
                />
              } />
              {/* Equity fill: from fixed strike price up to rising market value */}
              <Area dataKey="marketValue" fill="var(--color-primary)" fillOpacity={0.12}
                stroke="none" baseValue={strikePrice} legendType="none" />
              <Line dataKey="marketValue" stroke="var(--color-muted-foreground)"
                strokeWidth={1.5} dot={false} strokeDasharray="5 3" />
              <Line dataKey="optionPrice" stroke="var(--color-primary)"
                strokeWidth={2.5} dot={false} />
            </ComposedChart>
          </ChartContainer>
          <div className="flex items-start gap-2 pt-2 border-t text-sm">
            <TrendingUp className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Estimated equity at year 5: {formatCurrency(finalEquity)}</p>
              <p className="text-muted-foreground">Market appreciation over 5 years on a property locked at {formatCurrency(strikePrice)}.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Comparison table — clean, no colour ── */}
      <div className="rounded-md border overflow-hidden">
        <div className="grid grid-cols-3 border-b text-xs font-semibold uppercase tracking-widest text-muted-foreground bg-muted/30">
          <div className="px-4 py-2" />
          <div className="px-4 py-2">Traditional</div>
          <div className="px-4 py-2">Homeown</div>
        </div>
        {compRows.map(({ label, trad, hw }) => (
          <div key={label} className="grid grid-cols-3 border-t text-sm">
            <div className="px-4 py-2.5 text-xs text-muted-foreground">{label}</div>
            <div className="px-4 py-2.5 font-medium tabular-nums">{trad}</div>
            <div className="px-4 py-2.5 font-semibold tabular-nums">{hw}</div>
          </div>
        ))}
        <div className="px-4 py-2 border-t bg-muted/10">
          <p className="text-xs text-muted-foreground">5% annual appreciation assumed. Equity excludes mortgage costs at completion.</p>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} className="flex-1 h-12">Back</Button>
        <Button onClick={onNext} className="flex-1 h-12" size="lg">
          {bucketCopy[bucket].ctaLabel}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ── Step 3 — Pathway fundamentals ────────────────────────────
function Step3({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { state } = useCalcWizard()

  const items = [
    {
      label: 'Monthly service fee',
      sublabel: 'Domiter — paid every month for 60 months',
      value: `${formatCurrency(state.monthlyDomiter)} / mo`,
      description: 'Replaces your current housing cost for the programme duration. It is not rent — it is a structured service fee that gives you occupation rights and builds towards ownership.',
    },
    {
      label: 'Entry Stake',
      sublabel: '1% of property price, paid once at the start',
      value: formatCurrency(state.entryStake),
      description: 'Your initial stake in the property. This is equity at risk — it confirms your commitment and gives you a beneficial interest from day one. It is not a returnable deposit.',
    },
    {
      label: 'Purchase option price',
      sublabel: 'Fixed on the day the property is acquired',
      value: formatCurrency(state.strikePrice),
      description: 'The price you pay to buy the home at the end of the 60-month term. It is fixed in writing from the start — regardless of what the market does in the meantime.',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Your Homeown numbers</h2>
        <p className="mt-2 text-muted-foreground">
          For a {formatCurrency(state.propertyPrice)} property. These figures are fixed for the life of the programme.
        </p>
      </div>

      <div className="space-y-4">
        {items.map(({ label, sublabel, value, description }) => (
          <div key={label} className="rounded-lg border p-5 space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>
              </div>
              <p className="text-xl font-bold tabular-nums shrink-0 text-primary">{value}</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
        ))}
      </div>

      <div className="rounded-md border bg-muted/30 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
        These figures are illustrative based on your target property price. The programme is subject to independent property valuation and document verification. The monthly service fee is not a mortgage repayment and does not reduce the option price.
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">Back</Button>
        <Button onClick={onNext} className="flex-1" size="lg">
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ── Step 4 — Details ──────────────────────────────────────────
function Step4({ onBack }: { onBack: () => void }) {
  const { state, update } = useCalcWizard()
  const navigate = useNavigate()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleNext() {
    const errs: Record<string, string> = {}
    if (!state.county) errs.county = 'Please select a county'
    if (state.county === 'Dublin' && !state.dublinPostcode) errs.dublinPostcode = 'Please select a postcode'
    if (state.householdType === null) errs.householdType = 'Please select an option'
    if (state.isFtb === null) errs.isFtb = 'Please answer this question'
    if (!state.employmentType) errs.employmentType = 'Please select an option'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setSubmitting(true)

    const variant = state.isFtb === false ? 'mover' : 'eligible'
    const eligible = variant === 'eligible'
    update({ variant, eligible })

    const anonId = sessionStorage.getItem('anon_id') ?? crypto.randomUUID()
    sessionStorage.setItem('anon_id', anonId)

    const { data } = await supabase.from('calculator_snapshots').insert({
      anon_session_id: anonId,
      property_price: state.propertyPrice,
      entry_stake: state.entryStake,
      monthly_domiter: state.monthlyDomiter,
      strike_price: state.strikePrice,
      county: state.county,
      dublin_postcode: state.dublinPostcode ?? null,
      household_type: state.householdType,
      is_ftb: state.isFtb,
      ghi: state.ghi > 0 ? state.ghi : null,
      employment_type: state.employmentType,
      eligible,
      saved: false,
    }).select('id').single()

    if (data?.id) sessionStorage.setItem('snapshot_id', data.id)
    setSubmitting(false)
    navigate('/calc/save')
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">A bit about you</h2>
        <p className="mt-2 text-muted-foreground">
          Helps us understand programme demand and prepare for your discovery call.
        </p>
      </div>

      {/* Age */}
      <Slider
        label="Your age"
        value={state.age}
        display={`${state.age}`}
        min={22} max={55} step={1}
        onChange={v => update({ age: v })}
        minLabel="22" maxLabel="55"
      />

      <div className="border-t" />

      {/* Location */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold">Where are you looking to buy?</h3>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">County</label>
          <Select value={state.county || undefined}
            onValueChange={v => update({ county: v, dublinPostcode: v !== 'Dublin' ? null : state.dublinPostcode })}>
            <SelectTrigger><SelectValue placeholder="Select county" /></SelectTrigger>
            <SelectContent>
              {ROI_COUNTIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.county && <p className="text-sm text-destructive">{errors.county}</p>}
        </div>

        {state.county === 'Dublin' && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Dublin postcode</label>
            <Select value={state.dublinPostcode || undefined}
              onValueChange={v => update({ dublinPostcode: v })}>
              <SelectTrigger><SelectValue placeholder="Select postcode" /></SelectTrigger>
              <SelectContent>
                {DUBLIN_POSTCODES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.dublinPostcode && <p className="text-sm text-destructive">{errors.dublinPostcode}</p>}
          </div>
        )}
      </div>

      <div className="border-t" />

      {/* Household */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold">Your household</h3>

        <div className="space-y-2">
          <p className="text-sm font-medium">Who will be on the pathway?</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <RadioCard selected={state.householdType === 'solo'} onClick={() => update({ householdType: 'solo' })}>
              <p className="font-medium">Just me</p>
              <p className="text-sm text-muted-foreground mt-0.5">Single applicant</p>
            </RadioCard>
            <RadioCard selected={state.householdType === 'couple'} onClick={() => update({ householdType: 'couple' })}>
              <p className="font-medium">Me and my partner</p>
              <p className="text-sm text-muted-foreground mt-0.5">Two applicants</p>
            </RadioCard>
          </div>
          {errors.householdType && <p className="text-sm text-destructive">{errors.householdType}</p>}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Have you ever owned a home?</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <RadioCard selected={state.isFtb === true} onClick={() => update({ isFtb: true })}>
              <p className="font-medium">No, never</p>
              <p className="text-sm text-muted-foreground mt-0.5">I am a first-time buyer</p>
            </RadioCard>
            <RadioCard selected={state.isFtb === false} onClick={() => update({ isFtb: false })}>
              <p className="font-medium">Yes</p>
              <p className="text-sm text-muted-foreground mt-0.5">I currently own or have previously owned a home</p>
            </RadioCard>
          </div>
          {errors.isFtb && <p className="text-sm text-destructive">{errors.isFtb}</p>}
        </div>
      </div>

      <div className="border-t" />

      {/* Employment */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold">Employment</h3>
        <p className="text-sm font-medium">How is your income earned?</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {([
            { value: 'paye', label: 'Employed (PAYE)' },
            { value: 'self_employed', label: 'Self-employed' },
            { value: 'mixed', label: 'Mix of both' },
          ] as const).map(({ value, label }) => (
            <RadioCard key={value}
              selected={state.employmentType === value}
              onClick={() => update({ employmentType: value })}>
              <p className="text-sm font-medium">{label}</p>
            </RadioCard>
          ))}
        </div>
        {errors.employmentType && <p className="text-sm text-destructive">{errors.employmentType}</p>}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1" disabled={submitting}>Back</Button>
        <Button onClick={handleNext} className="flex-1" size="lg" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save and book a call'}
          {!submitting && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}

// ── Page root ─────────────────────────────────────────────────
export default function CalcPage() {
  const [step, setStep] = useState(1)

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="mx-auto max-w-lg px-6 py-12">
        <ProgressBar step={step} total={4} />
        {step === 1 && <Step1 onNext={() => setStep(2)} />}
        {step === 2 && <Step2 onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <Step3 onNext={() => setStep(4)} onBack={() => setStep(2)} />}
        {step === 4 && <Step4 onBack={() => setStep(3)} />}
      </main>
    </div>
  )
}
