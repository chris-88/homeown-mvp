import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PublicNav } from '@/components/shared/PublicNav'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { useCalcWizard, ROI_COUNTIES, DUBLIN_POSTCODES } from '@/lib/calcWizard'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Area, ComposedChart } from 'recharts'
import { ArrowRight } from 'lucide-react'

const APPRECIATION = 0.05

// ── Helpers ───────────────────────────────────────────────────
function fmtK(v: number) { return `€${Math.round(v / 1000)}k` }

// Card-style slider used on Step 1 (prominent, like shadcn "Savings Targets")
function SliderCard({
  label, value, display, min, max, step, onChange, minLabel, maxLabel,
}: {
  label: string; value: number; display: string
  min: number; max: number; step: number
  onChange: (v: number) => void
  minLabel?: string; maxLabel?: string
}) {
  return (
    <div className="rounded-xl border bg-muted/40 px-4 py-3 space-y-1.5">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="text-xl font-bold tabular-nums">{display}</p>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-primary" style={{ minHeight: 36, cursor: 'pointer' }} />
      {(minLabel || maxLabel) && (
        <div className="flex justify-between text-xs text-muted-foreground">
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
        'w-full rounded-xl border-2 p-4 text-left transition-colors hover:bg-accent',
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Your situation</h2>
        <p className="mt-2 text-muted-foreground">
          Adjust the sliders — we'll show you exactly what your options look like.
        </p>
      </div>

      <div className="space-y-3">
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
        value={state.currentSavings}
        display={formatCurrency(state.currentSavings)}
        min={0} max={80000} step={50}
        onChange={v => update({ currentSavings: v })}
        minLabel="€0" maxLabel="€80k"
      />

      <SliderCard
        label="Monthly savings"
        value={state.monthlySavings}
        display={`${formatCurrency(state.monthlySavings)}/mo`}
        min={100} max={3000} step={50}
        onChange={v => update({ monthlySavings: v })}
        minLabel="€100" maxLabel="€3,000"
      />

      <SliderCard
        label="Gross household income"
        value={state.ghi}
        display={`${formatCurrency(state.ghi)}/yr`}
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
  marketValue: { label: 'Market value', color: 'hsl(var(--muted-foreground))' },
  optionPrice: { label: 'Your option price', color: 'var(--primary)' },
  equity: { label: 'Equity', color: 'var(--primary)' },
} satisfies ChartConfig

function Step2({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { state } = useCalcWizard()
  const { propertyPrice, currentSavings, monthlySavings, strikePrice, entryStake, monthlyDomiter, ghi } = state

  // Chart 1 — deposit trap (10 years)
  const depositData = Array.from({ length: 11 }, (_, i) => ({
    year: i,
    deposit: Math.round(propertyPrice * 0.10 * Math.pow(1 + APPRECIATION, i)),
    savings: Math.round(currentSavings + monthlySavings * 12 * i),
  }))
  const crossoverYear = depositData.findIndex((d, i) => i > 0 && d.savings >= d.deposit)

  // Chart 2 — Homeown path (5 years)
  const homeownData = Array.from({ length: 6 }, (_, i) => ({
    year: i,
    marketValue: Math.round(propertyPrice * Math.pow(1 + APPRECIATION, i)),
    optionPrice: strikePrice,
    equity: Math.round(propertyPrice * Math.pow(1 + APPRECIATION, i)) - strikePrice,
  }))
  const finalMarket = homeownData[5].marketValue
  const finalEquity = finalMarket - strikePrice

  const yMaxDeposit = Math.ceil(Math.max(depositData[10].deposit, depositData[10].savings) * 1.1 / 10000) * 10000
  const yMinHomeown = Math.floor(strikePrice * 0.90 / 10000) * 10000
  const yMaxHomeown = Math.ceil(finalMarket * 1.06 / 10000) * 10000

  // ── Scenario logic ──────────────────────────────────────────
  const alreadyHasDeposit = currentSavings >= propertyPrice * 0.10
  const depositClose      = !alreadyHasDeposit && crossoverYear > 0 && crossoverYear <= 2
  const depositReachable  = !alreadyHasDeposit && crossoverYear > 2 && crossoverYear <= 10

  // Price they'd pay via traditional route (at crossover year, or yr 10 if never reached)
  const tradBuyYear  = crossoverYear > 0 ? crossoverYear : 10
  const tradBuyPrice = Math.round(propertyPrice * Math.pow(1 + APPRECIATION, tradBuyYear))

  // "In the home for X of 5 years" equity gain (simplified, ignoring amortisation)
  const tradInHomeYears    = Math.max(0, 5 - tradBuyYear)
  const tradValueAtYear5   = Math.round(tradBuyPrice * Math.pow(1 + APPRECIATION, tradInHomeYears))
  const tradDepositPaid    = Math.round(tradBuyPrice * 0.10)
  const tradEquityAtYear5  = tradInHomeYears > 0 ? tradValueAtYear5 - (tradBuyPrice - tradDepositPaid) : null

  // Exit affordability check (4× GHI standard multiplier)
  const ghiEntered = ghi > 0
  const exitMortgageSupported = !ghiEntered || ghi * 4 >= strikePrice

  // ── Verdict ─────────────────────────────────────────────────
  const verdict = alreadyHasDeposit
    ? { tone: 'neutral', headline: 'You already have the deposit.', body: `Your ${formatCurrency(currentSavings)} in savings covers the ${formatCurrency(propertyPrice * 0.10)} deposit today. The traditional route is a real option for you. Homeown is worth considering only if locking in a price below today's market value is worth more than buying now.` }
    : depositClose
    ? { tone: 'neutral', headline: `You're within reach — around ${crossoverYear} year${crossoverYear === 1 ? '' : 's'} away.`, body: `That's genuinely achievable. But the property will cost ${formatCurrency(tradBuyPrice)} by then, not ${formatCurrency(propertyPrice)} today. Whether locking in the price now outweighs another ${crossoverYear} year of saving is the question to weigh.` }
    : depositReachable
    ? { tone: 'amber', headline: `At your savings rate, you'd reach the deposit in year ${crossoverYear}.`, body: `But by then the property costs ${formatCurrency(tradBuyPrice)}, so the deposit itself is ${formatCurrency(Math.round(tradBuyPrice * 0.10))}. The target keeps moving.` }
    : { tone: 'amber', headline: 'The deposit target is growing faster than your savings.', body: `Over 10 years, the required deposit reaches ${formatCurrency(depositData[10].deposit)} while your savings reach ${formatCurrency(depositData[10].savings)}. The gap widens, not closes.` }

  // ── Caveats ─────────────────────────────────────────────────
  const caveats: string[] = []
  if (!exitMortgageSupported) {
    caveats.push(`On a gross household income of ${formatCurrency(ghi)}, standard 4× lending supports a mortgage of up to ${formatCurrency(ghi * 4)}. The option price is ${formatCurrency(strikePrice)}. Exit affordability depends on your full financial picture — this is a key question for your discovery call.`)
  }
  if (monthlyDomiter > monthlySavings * 2) {
    caveats.push(`The monthly service fee of ${formatCurrency(monthlyDomiter)} is significantly higher than your current monthly savings capacity. Make sure the Domiter is affordable within your budget before proceeding.`)
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Your numbers, honestly.</h2>
        <p className="mt-2 text-muted-foreground">
          {formatCurrency(propertyPrice)} target · saving {formatCurrency(monthlySavings)}/mo
          {currentSavings > 0 ? ` · ${formatCurrency(currentSavings)} saved` : ''}
          {ghiEntered ? ` · ${formatCurrency(ghi)}/yr income` : ''}
        </p>
      </div>

      {/* Verdict */}
      <div className={cn(
        'rounded-xl border px-4 py-4',
        verdict.tone === 'amber' ? 'border-amber-200 bg-amber-50' : 'border-border bg-muted/30'
      )}>
        <p className={cn('font-semibold text-sm', verdict.tone === 'amber' ? 'text-amber-900' : 'text-foreground')}>
          {verdict.headline}
        </p>
        <p className={cn('text-sm mt-1 leading-relaxed', verdict.tone === 'amber' ? 'text-amber-800' : 'text-muted-foreground')}>
          {verdict.body}
        </p>
      </div>

      {/* Chart 1 */}
      <div className="rounded-2xl border p-5 space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Traditional route</p>
          <h3 className="mt-1 text-base font-semibold">The deposit keeps moving</h3>
        </div>

        <ChartContainer config={depositChartConfig} className="h-48 w-full">
          <LineChart data={depositData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
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
            <Line dataKey="deposit" stroke="var(--color-deposit)" strokeWidth={2} dot={false} />
            <Line dataKey="savings" stroke="var(--color-savings)" strokeWidth={2}
              dot={false} strokeDasharray="5 3" />
          </LineChart>
        </ChartContainer>

        <div className="flex gap-5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-5 bg-destructive" />
            Deposit required
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-5 border-t-2 border-dashed border-primary" />
            Your savings trajectory
          </span>
        </div>
      </div>

      {/* Chart 2 */}
      <div className="rounded-2xl border p-5 space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Homeown pathway</p>
          <h3 className="mt-1 text-base font-semibold">Your price is fixed. The market works for you.</h3>
        </div>

        <ChartContainer config={homeownChartConfig} className="h-48 w-full">
          <ComposedChart data={homeownData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
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
            <Area dataKey="optionPrice" stackId="1" fill="transparent"
              stroke="var(--color-optionPrice)" strokeWidth={2.5} />
            <Area dataKey="equity" stackId="1" fill="var(--color-equity)"
              fillOpacity={0.12} stroke="none" />
            <Line dataKey="marketValue" stroke="hsl(var(--muted-foreground))"
              strokeWidth={1.5} dot={false} strokeDasharray="5 3" />
          </ComposedChart>
        </ChartContainer>

        <div className="flex gap-5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-5 bg-primary" />
            Your option price (fixed)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-5 border-t border-dashed border-muted-foreground" />
            Market value
          </span>
        </div>
      </div>

      {/* Comparison table */}
      <div className="rounded-2xl border overflow-hidden">
        <div className="grid grid-cols-3 bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <span />
          <span>Traditional</span>
          <span className="text-primary">Homeown</span>
        </div>
        {[
          {
            label: 'To get started',
            trad: formatCurrency(propertyPrice * 0.10) + ' deposit',
            hw: formatCurrency(entryStake) + ' Entry Stake',
          },
          {
            label: 'Timeline',
            trad: crossoverYear > 0 ? `~${crossoverYear} year${crossoverYear === 1 ? '' : 's'} saving` : '10+ years saving',
            hw: 'Move in this year',
          },
          {
            label: 'You buy at',
            trad: `~${formatCurrency(tradBuyPrice)}`,
            tradSub: `market price, year ${tradBuyYear}`,
            hw: formatCurrency(strikePrice),
            hwSub: 'fixed today, regardless of market',
          },
          {
            label: 'At year 5',
            trad: tradEquityAtYear5 !== null
              ? `~${formatCurrency(tradEquityAtYear5)} equity`
              : 'Still saving',
            tradSub: tradEquityAtYear5 !== null ? `${tradInHomeYears} yr${tradInHomeYears === 1 ? '' : 's'} of appreciation` : `deposit still ${formatCurrency(depositData[Math.min(5, 10)].deposit - depositData[Math.min(5, 10)].savings)} short`,
            hw: `~${formatCurrency(finalEquity)} equity`,
            hwSub: `market ${formatCurrency(finalMarket)} minus ${formatCurrency(strikePrice)} option price`,
          },
        ].map(({ label, trad, tradSub, hw, hwSub }) => (
          <div key={label} className="grid grid-cols-3 px-4 py-3 text-sm border-t items-start gap-2">
            <span className="text-xs text-muted-foreground pt-0.5">{label}</span>
            <div>
              <p className="font-medium tabular-nums">{trad}</p>
              {tradSub && <p className="text-xs text-muted-foreground mt-0.5">{tradSub}</p>}
            </div>
            <div>
              <p className="font-semibold tabular-nums text-primary">{hw}</p>
              {hwSub && <p className="text-xs text-muted-foreground mt-0.5">{hwSub}</p>}
            </div>
          </div>
        ))}
        <div className="px-4 py-2 border-t bg-muted/20">
          <p className="text-xs text-muted-foreground">Assumes 5% annual property appreciation. Traditional equity figure excludes mortgage amortisation.</p>
        </div>
      </div>

      {/* Caveats — only shown when relevant */}
      {caveats.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Worth knowing</p>
          {caveats.map(c => (
            <div key={c} className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm text-amber-800 leading-relaxed">{c}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">Back</Button>
        <Button onClick={onNext} className="flex-1" size="lg">
          Show me my numbers
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
          <div key={label} className="rounded-2xl border p-5 space-y-2">
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

      <div className="rounded-xl border bg-muted/30 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
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
