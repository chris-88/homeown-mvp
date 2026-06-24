import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PublicNav } from '@/components/shared/PublicNav'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCalcWizard, ROI_COUNTIES, DUBLIN_POSTCODES, maxMonthlyFor3yDeposit } from '@/lib/calcWizard'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { ArrowRight, Info } from 'lucide-react'
import CalcStepWow from '@/components/calc/CalcStepWow'

// ── Helpers ───────────────────────────────────────────────────
function fmtK(v: number) { return `€${Math.round(v / 1000)}k` }

function SliderCard({
  label, hint, warning, value, display, min, max, step, onChange, minLabel, maxLabel,
}: {
  label: string; hint?: string; warning?: string; value: number; display: string
  min: number; max: number; step: number
  onChange: (v: number) => void
  minLabel?: string; maxLabel?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [showHint, setShowHint] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const pct = `${Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))}%`

  function startEdit() {
    setDraft(String(value))
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  function commit() {
    const n = parseFloat(draft.replace(/[^0-9.]/g, ''))
    if (!isNaN(n)) {
      const snapped = Math.round(Math.max(min, Math.min(max, n)) / step) * step
      onChange(snapped)
    }
    setEditing(false)
  }

  return (
    <div className="rounded-md border bg-card px-5 py-4">
      <div className="flex items-baseline justify-between gap-4 mb-3">
        <div className="flex items-center gap-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          {hint && (
            <span className="relative">
              <Info
                className="h-3.5 w-3.5 text-muted-foreground/40 cursor-pointer"
                onClick={() => setShowHint(v => !v)}
              />
              {showHint && (
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 rounded-md bg-foreground px-3 py-2 text-xs text-background shadow-md z-50 block">
                  {hint}
                </span>
              )}
            </span>
          )}
        </div>
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); commit() }
              if (e.key === 'Escape') setEditing(false)
            }}
            className="text-2xl font-bold tabular-nums text-right bg-transparent border-b-2 border-primary outline-none w-36"
          />
        ) : (
          <p
            className="text-2xl font-bold tabular-nums cursor-text select-none"
            onClick={startEdit}
            title="Click to enter exact amount"
          >
            {display}
          </p>
        )}
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
      {warning && (
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{warning}</p>
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
  const { state, setPrice, setGhi, update } = useCalcWizard()
  const maxPropertyPrice = Math.min(800000, Math.floor(state.ghi * 4 / 0.9 / 5000) * 5000)
  const maxSavings = Math.round(state.propertyPrice * 0.10)
  const entryStakeMin = Math.round(state.propertyPrice * 0.01)
  const currentSavingsValue = Math.min(state.currentSavings, maxSavings)
  const maxMonthly = maxMonthlyFor3yDeposit(state.propertyPrice, currentSavingsValue)
  const effectiveMonthly = Math.min(state.monthlySavings, maxMonthly)

  function handleCurrentSavingsChange(v: number) {
    const newMax = maxMonthlyFor3yDeposit(state.propertyPrice, v)
    update({
      currentSavings: v,
      monthlySavings: Math.min(state.monthlySavings, newMax),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Your situation</h2>
        <p className="mt-2 text-muted-foreground">
          Adjust the sliders to see exactly what your options look like.
        </p>
      </div>

      <div className="space-y-2">
        <SliderCard
          label="Gross household income"
          hint="Combined pre-tax income of all buyers"
          value={state.ghi}
          display={formatCurrency(state.ghi)}
          min={45000} max={180000} step={1000}
          onChange={setGhi}
          minLabel="€45k" maxLabel="€180k"
        />

        <SliderCard
          label="Property target"
          hint="The price range you're aiming for"
          value={Math.min(state.propertyPrice, maxPropertyPrice)}
          display={formatCurrency(Math.min(state.propertyPrice, maxPropertyPrice))}
          min={200000} max={maxPropertyPrice} step={5000}
          onChange={setPrice}
          minLabel="€200k" maxLabel={fmtK(maxPropertyPrice)}
        />

        <SliderCard
          label="Funds set aside"
          hint="What you currently have available towards a purchase"
          value={currentSavingsValue}
          display={formatCurrency(currentSavingsValue)}
          min={0} max={maxSavings} step={100}
          onChange={handleCurrentSavingsChange}
          minLabel="€0" maxLabel={fmtK(maxSavings)}
          warning={currentSavingsValue < entryStakeMin
            ? `A ${formatCurrency(entryStakeMin)} Entry Stake (1% of your target price) is required by the time you go sale agreed on your chosen home. This does not need to be in place before you start the pathway.`
            : undefined}
        />

        <SliderCard
          label="Monthly contribution"
          hint="What you can set aside each month"
          value={effectiveMonthly}
          display={formatCurrency(effectiveMonthly)}
          min={100} max={maxMonthly} step={5}
          onChange={v => update({ monthlySavings: v })}
          minLabel="€100" maxLabel={fmtK(maxMonthly)}
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

// ── Step 3 — Pathway fundamentals ────────────────────────────
function Step3({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { state } = useCalcWizard()
  const { propertyPrice, currentSavings, monthlySavings, strikePrice, ghi } = state

  // Derive bucket so intro copy answers the CTA the user just clicked
  const depositData = Array.from({ length: 11 }, (_, i) => ({
    deposit:      Math.round(propertyPrice * 0.10 * Math.pow(1.05, i)),
    accumulated:  Math.round(currentSavings + monthlySavings * 12 * i),
  }))
  const crossoverIdx = depositData.findIndex((d, i) => i > 0 && d.accumulated >= d.deposit)
  const crossoverYears = (() => {
    if (crossoverIdx <= 0) return -1
    const prev = depositData[crossoverIdx - 1]
    const curr = depositData[crossoverIdx]
    const t = (prev.deposit - prev.accumulated) / ((curr.accumulated - prev.accumulated) - (curr.deposit - prev.deposit))
    return (crossoverIdx - 1) + Math.max(0, Math.min(1, t))
  })()
  const bucket = (() => {
    if (currentSavings >= propertyPrice * 0.10)   return 'already_eligible'
    if (ghi > 0 && ghi * 4 < strikePrice)         return 'income_capped'
    if (crossoverYears === -1)                     return 'never'
    if (crossoverYears > 5)                        return 'too_slow'
    return 'close_race'
  })()
  const fmtYrs = (y: number) => {
    const t = parseFloat(y.toFixed(1))
    return t === Math.floor(t) ? `${Math.floor(t)} years` : `${t.toFixed(1)} years`
  }
  const tradBuyPrice = Math.round(propertyPrice * Math.pow(1.05, crossoverYears > 0 ? crossoverYears : 10))

  const introLines: Record<string, string> = {
    already_eligible: `Your option price is ${formatCurrency(strikePrice)}, which is ${formatCurrency(propertyPrice - strikePrice)} below today's market price of ${formatCurrency(propertyPrice)}. That discount is locked from the day the property is acquired.`,
    close_race:       `Your option price is fixed at ${formatCurrency(strikePrice)} today. By the time you'd reach the traditional deposit in ${fmtYrs(crossoverYears)}, the same property would cost ${formatCurrency(tradBuyPrice)}.`,
    too_slow:         `At your current rate, you'd wait ${fmtYrs(crossoverYears)} and buy at a higher price. With Homeown, you start this year with the option price fixed at ${formatCurrency(strikePrice)}.`,
    never:            `Homeown gives you a fixed-price route into the market at ${formatCurrency(strikePrice)}. Here is what the programme involves.`,
    income_capped:    `These are the programme terms your adviser will walk through with you on the call.`,
  }
  const intro = introLines[bucket]

  const moments = [
    {
      when: 'At sale agreed',
      value: formatCurrency(state.entryStake),
      label: 'Entry Stake',
      note: 'Paid once. Your stake in the property from day one.',
    },
    {
      when: 'Every month',
      value: `${formatCurrency(state.monthlyDomiter)}/mo`,
      label: 'Monthly service fee',
      note: 'Your housing cost for 60 months. Not a mortgage.',
    },
    {
      when: 'At year 5',
      value: formatCurrency(state.strikePrice),
      label: 'Option price',
      note: 'Fixed from the start. The price you buy at.',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Your Homeown numbers</h2>
        <p className="mt-2 text-brand-ink leading-relaxed">{intro}</p>
      </div>

      {/* Timeline — 3 columns desktop, stacked mobile */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="grid sm:grid-cols-3 sm:divide-x divide-y sm:divide-y-0">
          {moments.map(({ when, value, label, note }) => (
            <div key={label} className="px-6 py-6">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">{when}</p>
              <p className="text-3xl font-bold tabular-nums text-primary">{value}</p>
              <p className="mt-1 text-sm font-medium text-foreground">{label}</p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{note}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Figures are illustrative. Subject to independent property valuation and document verification.
      </p>

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

  useEffect(() => { window.scrollTo(0, 0) }, [step])

  // Step 2 is full-width — it controls its own layout and progress bar
  if (step === 2) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNav />
        <CalcStepWow onNext={() => setStep(3)} onBack={() => setStep(1)} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="mx-auto max-w-lg px-6 py-12">
        <ProgressBar step={step} total={4} />
        {step === 1 && <Step1 onNext={() => setStep(2)} />}
        {step === 3 && <Step3 onNext={() => setStep(4)} onBack={() => setStep(2)} />}
        {step === 4 && <Step4 onBack={() => setStep(3)} />}
      </main>
    </div>
  )
}
