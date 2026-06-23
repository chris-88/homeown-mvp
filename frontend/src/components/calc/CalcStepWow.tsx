import { useCalcWizard } from '@/lib/calcWizard'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, ComposedChart, Area } from 'recharts'
import { ArrowRight, Clock, TrendingUp, XCircle, AlertTriangle, CircleCheck, Lock, Scale, Flag } from 'lucide-react'

const APPRECIATION = 0.05

function fmtK(v: number) { return `€${Math.round(v / 1000)}k` }
function fmtStat(v: number) { return v >= 10000 ? `€${Math.round(v / 1000)}k` : formatCurrency(v) }
function fmtYears(y: number): string {
  const t = parseFloat(y.toFixed(1))
  return t === Math.floor(t) ? `${Math.floor(t)} years` : `${t.toFixed(1)} years`
}

type Bucket = 'already_eligible' | 'close_race' | 'too_slow' | 'never' | 'income_capped'

const depositChartCfg = {
  deposit:     { label: 'Deposit required', color: '#48252F' },
  accumulated: { label: 'Accumulated',      color: '#857861' },
} satisfies ChartConfig

const homeownChartCfg = {
  marketValue: { label: 'Market value',     color: '#857861' },
  optionPrice: { label: 'Your option price', color: '#123A28' },
} satisfies ChartConfig

// ── Progress ──────────────────────────────────────────────────
function ProgressBar() {
  return (
    <div className="mb-8">
      <div className="mb-2 text-xs text-muted-foreground">Step 2 of 4</div>
      <div className="h-1 w-full rounded-full bg-muted">
        <div className="h-1 rounded-full bg-primary" style={{ width: '50%' }} />
      </div>
    </div>
  )
}

// ── Input summary bar ─────────────────────────────────────────
function InputSummaryBar({ propertyPrice, monthlySavings, currentSavings, ghi }: {
  propertyPrice: number; monthlySavings: number; currentSavings: number; ghi: number
}) {
  const stats = [
    { label: 'Target',    value: fmtStat(propertyPrice) },
    { label: 'Monthly',   value: `${fmtStat(monthlySavings)}/mo` },
    { label: 'Set aside', value: fmtStat(currentSavings) },
    { label: 'Income',    value: `${fmtStat(ghi)}/yr` },
  ]
  return (
    <div className="flex divide-x divide-brand-cream mt-6">
      {stats.map(({ label, value }) => (
        <div key={label} className="flex-1 flex flex-col px-4 first:pl-0">
          <span className="text-[10px] font-medium tracking-widest uppercase text-brand-taupe">{label}</span>
          <span className="text-sm font-semibold tabular-nums text-brand-ink mt-0.5">{value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Realisation moment ────────────────────────────────────────
function RealisationMoment({ bucket, propertyPrice, monthlySavings, strikePrice, ghi,
  crossoverYears, tradBuyPrice, tradDepositRequired }: {
  bucket: Bucket; propertyPrice: number; monthlySavings: number
  strikePrice: number; ghi: number; crossoverYears: number
  tradBuyPrice: number; tradDepositRequired: number
}) {
  if (bucket === 'income_capped') {
    const gap = strikePrice - ghi * 4
    return (
      <div className="py-12 max-w-xl mt-8">
        <p className="text-xl font-semibold text-brand-ink">Your income and your target are out of step.</p>
        <p className="text-base text-brand-taupe mt-3 leading-relaxed">
          On a household income of {formatCurrency(ghi)}/yr, standard lending typically supports a mortgage
          of up to {formatCurrency(ghi * 4)}. The Homeown purchase option on this property
          is {formatCurrency(strikePrice)}, which is {formatCurrency(gap)} above that range.
        </p>
      </div>
    )
  }

  type NonCapped = Exclude<Bucket, 'income_capped'>

  // [line1 icon, line2 icon, punchline icon]
  const icons: Record<NonCapped, [React.ElementType, React.ElementType, React.ElementType]> = {
    already_eligible: [CircleCheck, Lock,        Scale],
    close_race:       [Clock,       TrendingUp,  Flag],
    too_slow:         [Clock,       TrendingUp,  AlertTriangle],
    never:            [XCircle,     TrendingUp,  ArrowRight],
  }

  const copy: Record<NonCapped, { line1: string; line2: string; punchline: string }> = {
    already_eligible: {
      line1: 'You already have enough to buy traditionally.',
      line2: "Homeown offers something the traditional route doesn't: a price locked 10% below today's market, starting now.",
      punchline: `The question is whether you want to pay ${formatCurrency(strikePrice)} or ${formatCurrency(propertyPrice)}.`,
    },
    close_race: {
      line1: `At ${formatCurrency(monthlySavings)}/mo, you'd reach the ${formatCurrency(Math.round(propertyPrice * 0.10))} deposit in about ${fmtYears(crossoverYears)}.`,
      line2: 'But the property costs more each year, so the deposit grows faster than you can accumulate.',
      punchline: 'You can put more aside each month, or you can stop the race entirely.',
    },
    too_slow: {
      line1: `At ${formatCurrency(monthlySavings)}/mo, the deposit takes ${fmtYears(crossoverYears)} to reach.`,
      line2: `By then, the property costs ${formatCurrency(tradBuyPrice)}, making the deposit itself ${formatCurrency(tradDepositRequired)}.`,
      punchline: 'The longer you wait, the further away it gets.',
    },
    never: {
      line1: `At ${formatCurrency(monthlySavings)}/mo, the deposit never catches up.`,
      line2: 'Property prices rise faster than your funds accumulate at this rate.',
      punchline: 'The traditional route is closed. Homeown is the route in.',
    },
  }

  const { line1, line2, punchline } = copy[bucket as NonCapped]
  const [Icon1, Icon2, Icon3] = icons[bucket as NonCapped]

  return (
    <div className="py-10 max-w-xl mt-6 space-y-4">
      <div className="flex items-start gap-3">
        <Icon1 className="h-5 w-5 text-brand-taupe shrink-0 mt-0.5" />
        <p className="text-base leading-relaxed text-brand-ink">{line1}</p>
      </div>
      <div className="flex items-start gap-3">
        <Icon2 className="h-5 w-5 text-brand-taupe shrink-0 mt-0.5" />
        <p className="text-base leading-relaxed text-brand-ink">{line2}</p>
      </div>
      <div className="flex items-start gap-3">
        <Icon3 className="h-5 w-5 text-brand-burgundy shrink-0 mt-0.5" />
        <p className="text-base font-semibold leading-relaxed text-brand-burgundy">{punchline}</p>
      </div>
    </div>
  )
}

// ── Tooltips ──────────────────────────────────────────────────
function HomeownTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null
  const marketValue = payload.find(p => p.dataKey === 'marketValue')?.value
  const optionPrice = payload.find(p => p.dataKey === 'optionPrice')?.value
  return (
    <div className="rounded-md border border-brand-cream bg-white px-3 py-2 text-xs shadow-sm space-y-0.5">
      {marketValue != null && <p className="tabular-nums">Value: {formatCurrency(marketValue)}</p>}
      {optionPrice != null && <p className="tabular-nums">Strike: {formatCurrency(optionPrice)}</p>}
    </div>
  )
}

function TraditionalTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null
  const deposit     = payload.find(p => p.dataKey === 'deposit')?.value
  const accumulated = payload.find(p => p.dataKey === 'accumulated')?.value
  return (
    <div className="rounded-md border border-brand-cream bg-white px-3 py-2 text-xs shadow-sm space-y-0.5">
      {deposit     != null && <p className="tabular-nums">Required: {formatCurrency(deposit)}</p>}
      {accumulated != null && <p className="tabular-nums">Saved: {formatCurrency(accumulated)}</p>}
    </div>
  )
}

// ── Traditional section ───────────────────────────────────────
function TraditionalSection({ bucket, depositData, crossoverYears, monthlySavings,
  currentSavings, propertyPrice, tradDepositRequired, tradBuyPrice, tradSavingsAtCrossover }: {
  bucket: Bucket
  depositData: { year: number; deposit: number; savings: number }[]
  crossoverYears: number; monthlySavings: number; currentSavings: number
  propertyPrice: number; tradDepositRequired: number; tradBuyPrice: number
  tradSavingsAtCrossover: number
}) {
  const chartData = bucket === 'already_eligible' ? depositData.slice(0, 6) : depositData
  const mappedData = chartData.map(d => ({ year: d.year, deposit: d.deposit, accumulated: d.savings }))
  const yMax = Math.ceil(Math.max(...mappedData.map(d => Math.max(d.deposit, d.accumulated))) * 1.1 / 10000) * 10000

  const headlines: Record<Bucket, string> = {
    already_eligible: 'You could buy traditionally today.',
    close_race:       'The deposit keeps moving.',
    too_slow:         'The deposit keeps moving.',
    never:            'The deposit gap never closes.',
    income_capped:    '',
  }

  const callout = (() => {
    if (bucket === 'already_eligible') {
      return `You have ${formatCurrency(currentSavings)} set aside toward a deposit of ${formatCurrency(Math.round(propertyPrice * 0.10))}.`
    }
    if (bucket === 'close_race') {
      return `In ${fmtYears(crossoverYears)}: deposit ${formatCurrency(tradDepositRequired)}, you'd have ${formatCurrency(tradSavingsAtCrossover)}. But the property costs ${formatCurrency(tradBuyPrice)} by then.`
    }
    if (bucket === 'too_slow') {
      return `In ${fmtYears(crossoverYears)}: deposit ${formatCurrency(tradDepositRequired)}. Right now you have ${formatCurrency(currentSavings)} set aside.`
    }
    return `At ${formatCurrency(monthlySavings)}/mo, the gap never closes at 5% annual appreciation.`
  })()

  return (
    <section className="w-full bg-brand-stone py-16 mt-2">
      <div className="max-w-2xl mx-auto px-6">
        <p className="text-xs font-medium tracking-widest text-brand-taupe uppercase">Traditional route</p>
        <p className="text-3xl font-semibold text-brand-ink mt-2">{headlines[bucket]}</p>

        <ChartContainer config={depositChartCfg} className="h-48 md:h-56 w-full mt-8">
          <LineChart data={mappedData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <XAxis dataKey="year" tickLine={false} axisLine={false}
              tick={{ fontSize: 10, fill: '#857861' }}
              tickFormatter={(v: number) => v === 0 ? 'Now' : String(v)} />
            <YAxis tickFormatter={fmtK} tickLine={false} axisLine={false}
              tick={{ fontSize: 10 }} width={36} domain={[0, yMax]} />
            <ChartTooltip content={<TraditionalTooltip />} />
            <Line dataKey="deposit"     stroke="var(--color-deposit)"     strokeWidth={2.5} dot={false} />
            <Line dataKey="accumulated" stroke="var(--color-accumulated)" strokeWidth={1.5}
              dot={false} strokeDasharray="5 3" />
          </LineChart>
        </ChartContainer>

        <p className="text-sm text-brand-taupe mt-4">{callout}</p>
      </div>
    </section>
  )
}

// ── Homeown section ───────────────────────────────────────────
function HomeownSection({ bucket, homeownData, finalEquity, strikePrice, propertyPrice, finalMarket }: {
  bucket: Bucket
  homeownData: { year: number; marketValue: number; optionPrice: number }[]
  finalEquity: number; strikePrice: number; propertyPrice: number; finalMarket: number
}) {
  const yMin = Math.max(0, strikePrice - 50000)
  const yMax = Math.ceil(finalMarket * 1.06 / 10000) * 10000

  const headlineLines = bucket === 'already_eligible'
    ? [`Your price is ${formatCurrency(strikePrice)}.`, `Not ${formatCurrency(propertyPrice)}.`]
    : ['Fixed strike price, the market working for you.']

  return (
    <section className="w-full bg-white py-16">
      <div className="max-w-2xl mx-auto px-6">
        <p className="text-xs font-medium tracking-widest text-brand-green uppercase">Homeown pathway</p>
        <p className="text-3xl font-semibold text-brand-ink mt-2">{headlineLines[0]}</p>
        {headlineLines[1] && <p className="text-3xl font-semibold text-brand-ink">{headlineLines[1]}</p>}

        <ChartContainer config={homeownChartCfg} className="h-48 md:h-56 w-full mt-8">
          <ComposedChart data={homeownData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <XAxis dataKey="year" tickLine={false} axisLine={false}
              tick={{ fontSize: 10, fill: '#857861' }}
              tickFormatter={(v: number) => v === 0 ? 'Now' : String(v)} />
            <YAxis tickFormatter={fmtK} tickLine={false} axisLine={false}
              tick={{ fontSize: 10 }} width={36} domain={[yMin, yMax]} />
            <ChartTooltip content={<HomeownTooltip />} />
            <Area dataKey="marketValue" fill="var(--color-brand-green-muted)" fillOpacity={1}
              stroke="none" baseValue={strikePrice} legendType="none" />
            <Line dataKey="marketValue" stroke="var(--color-marketValue)"
              strokeWidth={1.5} dot={false} strokeDasharray="5 3" />
            <Line dataKey="optionPrice" stroke="var(--color-optionPrice)"
              strokeWidth={2} dot={false} />
          </ComposedChart>
        </ChartContainer>

        <p className="text-sm text-brand-taupe mt-4">
          Estimated equity position at year 5: {formatCurrency(finalEquity)}
        </p>
        <p className="text-sm text-brand-taupe">
          Market appreciation on a property locked at {formatCurrency(strikePrice)}.
        </p>
      </div>
    </section>
  )
}

// ── Income cap section ────────────────────────────────────────
function IncomeCapSection({ ghi, strikePrice, maxAffordableProperty, onBack, onNext }: {
  ghi: number; strikePrice: number; maxAffordableProperty: number
  onBack: () => void; onNext: () => void
}) {
  const gap = strikePrice - ghi * 4
  return (
    <section className="w-full bg-brand-stone py-12 mt-2">
      <div className="max-w-2xl mx-auto px-6">
        <p className="text-xs font-medium tracking-widest text-brand-green uppercase">Homeown pathway</p>
        <p className="text-2xl font-semibold text-brand-ink mt-1">Two ways to make it work.</p>

        <div className="grid gap-4 sm:grid-cols-2 mt-8">
          {/* Option A — lower target */}
          <div className="border border-brand-cream rounded-lg p-6 bg-card">
            <p className="text-sm font-semibold text-brand-ink">Target a lower property price</p>
            <p className="text-sm text-brand-taupe mt-2 leading-relaxed">
              At {formatCurrency(ghi)}/yr, Homeown works for properties up to:
            </p>
            <p className="text-3xl font-bold text-brand-green mt-4 tabular-nums">
              {formatCurrency(maxAffordableProperty)}
            </p>
            <Button variant="outline" size="sm" className="mt-6 w-full" onClick={onBack}>
              Adjust my target
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Option B — Entry Contribution */}
          <div className="border border-brand-cream rounded-lg p-6 bg-brand-green-muted">
            <p className="text-sm font-semibold text-brand-ink">Pay more upfront</p>
            <p className="text-sm text-brand-taupe mt-2 leading-relaxed">
              An Entry Contribution of {formatCurrency(gap)} above the standard 1% Entry Stake
              reduces your exit mortgage to {formatCurrency(ghi * 4)}, which is within your income's range.
            </p>
            <p className="text-xs text-brand-taupe mt-3 pt-3 border-t border-brand-green/15 leading-relaxed">
              The Entry Contribution is a confirmed product option, available above the standard 1%.
              Your adviser will set out the full structure, terms, and conditions on your discovery call.
            </p>
            <Button size="sm" className="mt-6 w-full" onClick={onNext}>
              Talk to us about this
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Comparison table ──────────────────────────────────────────
function ComparisonTable({ bucket, propertyPrice, currentSavings, monthlySavings,
  entryStake, strikePrice, tradDepositRequired, tradBuyPrice, startTimeLabel, finalEquity }: {
  bucket: Bucket; propertyPrice: number; currentSavings: number; monthlySavings: number
  entryStake: number; strikePrice: number; tradDepositRequired: number
  tradBuyPrice: number; startTimeLabel: string; finalEquity: number
}) {
  const yr5TraditSavings = currentSavings + monthlySavings * 60

  const tradWhenMoveIn = (() => {
    if (bucket === 'already_eligible') return 'Now'
    if (bucket === 'never') return '10+ years (never closes)'
    return startTimeLabel
  })()

  const tradBuyAt = bucket === 'already_eligible'
    ? formatCurrency(propertyPrice)
    : `${formatCurrency(tradBuyPrice)} (moving every year)`

  const rows = [
    {
      label: 'To get started',
      trad: `Deposit ${formatCurrency(bucket === 'already_eligible' ? Math.round(propertyPrice * 0.10) : tradDepositRequired)}`,
      hw: `Entry Stake ${formatCurrency(entryStake)}`,
    },
    { label: 'When you move in', trad: tradWhenMoveIn,   hw: '3-6 months' },
    { label: 'You buy at',       trad: tradBuyAt,         hw: `${formatCurrency(strikePrice)} (fixed from start)` },
    ...(bucket !== 'already_eligible' ? [{
      label: 'At year 5',
      trad: `${formatCurrency(yr5TraditSavings)} saved`,
      hw: `${formatCurrency(finalEquity)} equity`,
    }] : []),
  ]

  return (
    <div className="mt-10">
      <div className="w-full border border-brand-cream rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left w-1/3" />
              <th className="px-4 py-3 text-center text-xs font-semibold tracking-widest text-brand-taupe uppercase w-1/3">
                Traditional
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold tracking-widest text-white uppercase bg-brand-green w-1/3">
                Homeown
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ label, trad, hw }) => (
              <tr key={label} className="border-t border-brand-cream">
                <td className="px-4 py-4 text-sm text-brand-taupe text-left">{label}</td>
                <td className="px-4 py-4 font-normal text-brand-ink tabular-nums text-center">{trad}</td>
                <td className="px-4 py-4 font-semibold text-brand-ink tabular-nums text-center">{hw}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-brand-taupe mt-3">
        Assumes 5% annual property appreciation. Year 5 equity excludes mortgage costs at completion.
      </p>
    </div>
  )
}

// ── Trust bar ─────────────────────────────────────────────────
function TrustBar() {
  return (
    <p className="text-sm text-brand-taupe text-center mt-8">
      No obligation. No credit check. A 20-minute call with your questions answered.
    </p>
  )
}

// ── Step actions ──────────────────────────────────────────────
function StepActions({ bucket, onNext, onBack }: { bucket: Bucket; onNext: () => void; onBack: () => void }) {
  const ctaLabel: Record<Bucket, string> = {
    already_eligible: "Show me what I'd save",
    close_race:       "Show me what I'd save",
    too_slow:         'See my Homeown numbers',
    never:            'See the pathway in',
    income_capped:    'Talk to us about my options',
  }
  return (
    <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8">
      <Button variant="outline" onClick={onBack} className="flex-1 h-12">Back</Button>
      <Button onClick={onNext} className="flex-1 h-12" size="lg">
        {ctaLabel[bucket]}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function CalcStepWow({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { state } = useCalcWizard()
  const { propertyPrice, currentSavings, monthlySavings, strikePrice, entryStake, ghi } = state

  const depositData = Array.from({ length: 11 }, (_, i) => ({
    year: i,
    deposit: Math.round(propertyPrice * 0.10 * Math.pow(1 + APPRECIATION, i)),
    savings: Math.round(currentSavings + monthlySavings * 12 * i),
  }))

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
  }))
  const finalMarket = homeownData[5].marketValue
  const finalEquity = finalMarket - strikePrice

  const alreadyHasDeposit = currentSavings >= propertyPrice * 0.10
  const ghiEntered = ghi > 0
  const maxAffordableProperty = ghiEntered ? Math.floor((ghi * 4 / 0.9) / 5000) * 5000 : 0

  const tradBuyYear = crossoverYears > 0 ? crossoverYears : 10
  const tradBuyPrice = Math.round(propertyPrice * Math.pow(1 + APPRECIATION, tradBuyYear))
  const tradDepositRequired = Math.round(tradBuyPrice * 0.10)
  const tradSavingsAtCrossover = Math.round(currentSavings + monthlySavings * 12 * tradBuyYear)

  const startTimeLabel = crossoverYears > 0 ? fmtYears(crossoverYears) : '10+ years'

  const bucket: Bucket = (() => {
    if (alreadyHasDeposit)                   return 'already_eligible'
    if (ghiEntered && ghi * 4 < strikePrice) return 'income_capped'
    if (crossoverYears === -1)               return 'never'
    if (crossoverYears > 5)                  return 'too_slow'
    return 'close_race'
  })()

  return (
    <div className="w-full">
      {/* Narrow container: progress + summary + realisation */}
      <div className="max-w-2xl mx-auto px-6 pt-10">
        <ProgressBar />
        <InputSummaryBar
          propertyPrice={propertyPrice}
          monthlySavings={monthlySavings}
          currentSavings={currentSavings}
          ghi={ghi}
        />
        <RealisationMoment
          bucket={bucket}
          propertyPrice={propertyPrice}
          monthlySavings={monthlySavings}
          strikePrice={strikePrice}
          ghi={ghi}
          crossoverYears={crossoverYears}
          tradBuyPrice={tradBuyPrice}
          tradDepositRequired={tradDepositRequired}
        />
      </div>

      {/* Full-bleed chart sections — or income cap replacement */}
      {bucket === 'income_capped' ? (
        <IncomeCapSection
          ghi={ghi}
          strikePrice={strikePrice}
          maxAffordableProperty={maxAffordableProperty}
          onBack={onBack}
          onNext={onNext}
        />
      ) : (
        <>
          <TraditionalSection
            bucket={bucket}
            depositData={depositData}
            crossoverYears={crossoverYears}
            monthlySavings={monthlySavings}
            currentSavings={currentSavings}
            propertyPrice={propertyPrice}
            tradDepositRequired={tradDepositRequired}
            tradBuyPrice={tradBuyPrice}
            tradSavingsAtCrossover={tradSavingsAtCrossover}
          />
          <HomeownSection
            bucket={bucket}
            homeownData={homeownData}
            finalEquity={finalEquity}
            strikePrice={strikePrice}
            propertyPrice={propertyPrice}
            finalMarket={finalMarket}
          />
        </>
      )}

      {/* Narrow container: table + trust bar + actions */}
      <div className="max-w-2xl mx-auto px-6 pb-16">
        {bucket !== 'income_capped' ? (
          <ComparisonTable
            bucket={bucket}
            propertyPrice={propertyPrice}
            currentSavings={currentSavings}
            monthlySavings={monthlySavings}
            entryStake={entryStake}
            strikePrice={strikePrice}
            tradDepositRequired={tradDepositRequired}
            tradBuyPrice={tradBuyPrice}
            startTimeLabel={startTimeLabel}
            finalEquity={finalEquity}
          />
        ) : (
          <p className="text-sm text-brand-taupe text-center mt-10">
            Your adviser can walk through both options on a call.
            There's no obligation and it takes 20 minutes.
          </p>
        )}
        <TrustBar />
        <StepActions bucket={bucket} onNext={onNext} onBack={onBack} />
      </div>
    </div>
  )
}
