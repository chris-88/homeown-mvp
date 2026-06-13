import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PublicNav } from '@/components/shared/PublicNav'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCalcWizard, ROI_COUNTIES, DUBLIN_POSTCODES } from '@/lib/calcWizard'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

// ── Progress bar ──────────────────────────────────────────────
function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
        <span>Step {step} of {total}</span>
        <span>{Math.round((step / total) * 100)}% complete</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div
          className="h-1.5 rounded-full bg-primary transition-all duration-300"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
    </div>
  )
}

// ── Price input group ─────────────────────────────────────────
function PriceInput({
  value,
  onChange,
  onBlur,
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur: () => void
}) {
  return (
    <div className="flex max-w-[200px] items-center rounded-md border bg-background px-3 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0">
      <span className="shrink-0 text-sm text-muted-foreground select-none">€</span>
      <input
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        inputMode="numeric"
        className="w-full bg-transparent py-2 pl-1 text-sm font-medium outline-none"
      />
    </div>
  )
}

// ── Radio card ────────────────────────────────────────────────
function RadioCard({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-xl border-2 p-4 text-left transition-colors hover:bg-accent',
        selected ? 'border-primary bg-primary/5' : 'border-border bg-background',
      )}
    >
      {children}
    </button>
  )
}

// ── Step 1 — Property Target ──────────────────────────────────
function Step1({ onNext }: { onNext: () => void }) {
  const { state, setPrice } = useCalcWizard()
  const [inputValue, setInputValue] = useState(state.propertyPrice.toLocaleString('en-IE'))

  function handleSlider(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseInt(e.target.value)
    setPrice(v)
    setInputValue(v.toLocaleString('en-IE'))
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    setInputValue(e.target.value)
    const v = parseInt(raw)
    if (!isNaN(v)) setPrice(v)
  }

  function handleInputBlur() {
    const v = parseInt(inputValue.replace(/[^0-9]/g, ''))
    const clamped = isNaN(v) ? 350000 : Math.min(800000, Math.max(200000, v))
    const snapped = Math.round(clamped / 5000) * 5000
    setPrice(snapped)
    setInputValue(snapped.toLocaleString('en-IE'))
  }

  const valid = state.propertyPrice >= 200000 && state.propertyPrice <= 800000

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">What property price are you targeting?</h2>
        <p className="mt-1 text-sm text-muted-foreground">Properties between €200,000 and €800,000 are eligible.</p>
      </div>

      <div className="space-y-3">
        <input
          type="range"
          min={200000}
          max={800000}
          step={5000}
          value={state.propertyPrice}
          onChange={handleSlider}
          className="w-full accent-primary"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>€200,000</span>
          <span>€800,000</span>
        </div>
        <PriceInput value={inputValue} onChange={handleInput} onBlur={handleInputBlur} />
      </div>

      <Card className="bg-muted/30">
        <CardContent className="divide-y pt-0 pb-0">
          {[
            { label: 'Monthly service fee', sub: 'Domiter, per month for 60 months', value: `${formatCurrency(state.monthlyDomiter)} / mo` },
            { label: 'Entry Stake', sub: '1% of property price, paid once', value: formatCurrency(state.entryStake) },
            { label: 'Purchase option price', sub: 'Fixed at 10% below acquisition price', value: formatCurrency(state.strikePrice) },
          ].map(({ label, sub, value }) => (
            <div key={label} className="flex items-center justify-between gap-4 py-3.5">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
              </div>
              <p className="text-sm font-semibold tabular-nums shrink-0">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        These figures are illustrative. The monthly service fee is your decision; Homeown does not assess whether it suits your budget.
      </p>

      <Button onClick={onNext} disabled={!valid} className="w-full">Next</Button>
    </div>
  )
}

// ── Step 2 — Location ─────────────────────────────────────────
function Step2({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { state, update } = useCalcWizard()
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleNext() {
    const errs: Record<string, string> = {}
    if (!state.county) errs.county = 'Please select a county'
    if (state.county === 'Dublin' && !state.dublinPostcode) errs.dublinPostcode = 'Please select a postcode'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Where are you looking to buy?</h2>
        <p className="mt-1 text-sm text-muted-foreground">Select your target county. Location data helps us understand programme demand.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">County</label>
          <Select value={state.county || undefined} onValueChange={(v) => update({ county: v, dublinPostcode: v !== 'Dublin' ? null : state.dublinPostcode })}>
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
            <Select value={state.dublinPostcode || undefined} onValueChange={(v) => update({ dublinPostcode: v })}>
              <SelectTrigger><SelectValue placeholder="Select postcode" /></SelectTrigger>
              <SelectContent>
                {DUBLIN_POSTCODES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.dublinPostcode && <p className="text-sm text-destructive">{errors.dublinPostcode}</p>}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">Back</Button>
        <Button onClick={handleNext} className="flex-1">Next</Button>
      </div>
    </div>
  )
}

// ── Step 3 — Household ────────────────────────────────────────
function Step3({ onNext, onBack, onMover }: { onNext: () => void; onBack: () => void; onMover: () => void }) {
  const { state, update } = useCalcWizard()
  const [errors, setErrors] = useState('')

  function handleNext() {
    if (state.householdType === null || state.isFtb === null) {
      setErrors('Please answer both questions to continue.')
      return
    }
    setErrors('')
    if (state.isFtb === false) {
      onMover()
    } else {
      onNext()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Tell us about your household</h2>
      </div>

      <div className="space-y-4">
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
      </div>

      <div className="space-y-4">
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
      </div>

      {errors && <p className="text-sm text-destructive">{errors}</p>}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">Back</Button>
        <Button onClick={handleNext} className="flex-1">Next</Button>
      </div>
    </div>
  )
}

// ── Step 4 — Income ───────────────────────────────────────────
function Step4({ onBack }: { onBack: () => void }) {
  const { state, update } = useCalcWizard()
  const navigate = useNavigate()
  const [ghiInput, setGhiInput] = useState(state.ghi > 0 ? state.ghi.toLocaleString('en-IE') : '')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const ghiRaw = parseInt(ghiInput.replace(/[^0-9]/g, '')) || 0
  const maxMortgageHint = ghiRaw >= 10000 ? ghiRaw * 4 : null

  async function handleNext() {
    const errs: Record<string, string> = {}
    const ghi = parseInt(ghiInput.replace(/[^0-9]/g, ''))
    if (!ghi || ghi <= 0) errs.ghi = 'Please enter your household income'
    if (!state.employmentType) errs.employmentType = 'Please select an employment type'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setSubmitting(true)

    const eligible = (ghi * 4) >= state.strikePrice
    const maxPropertyForIncome = Math.floor((ghi * 4) / 0.9 / 5000) * 5000
    const variant = eligible ? 'eligible' : 'income_gap'

    update({ ghi, eligible, maxPropertyForIncome, variant })

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
      is_ftb: true,
      ghi,
      employment_type: state.employmentType,
      eligible,
      saved: false,
    }).select('id').single()

    if (data?.id) sessionStorage.setItem('snapshot_id', data.id)

    setSubmitting(false)
    navigate('/calc/results')
  }

  const incomeLabel = state.householdType === 'couple'
    ? 'Combined gross annual income'
    : 'Gross annual income'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">What is your household's gross annual income?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We use this to check whether your target property is within range for a regulated mortgage at the end of the term. It is not a credit check.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{incomeLabel}</label>
          <PriceInput
            value={ghiInput}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, '')
              setGhiInput(e.target.value)
              const v = parseInt(raw)
              if (!isNaN(v)) update({ ghi: v })
            }}
            onBlur={() => {
              const v = parseInt(ghiInput.replace(/[^0-9]/g, ''))
              if (!isNaN(v)) {
                setGhiInput(v.toLocaleString('en-IE'))
                update({ ghi: v })
              }
            }}
          />
          {maxMortgageHint && (
            <p className="text-xs text-muted-foreground">
              At 4× income, a standard mortgage supports up to{' '}
              <span className="font-medium text-foreground">{formatCurrency(maxMortgageHint)}</span>
            </p>
          )}
          {errors.ghi && <p className="text-sm text-destructive">{errors.ghi}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Employment type</label>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { value: 'paye', label: 'Employed (PAYE)' },
              { value: 'self_employed', label: 'Self-employed' },
              { value: 'mixed', label: 'Mix of both' },
            ].map(({ value, label }) => (
              <RadioCard
                key={value}
                selected={state.employmentType === value}
                onClick={() => update({ employmentType: value as 'paye' | 'self_employed' | 'mixed' })}
              >
                <p className="text-sm font-medium">{label}</p>
              </RadioCard>
            ))}
          </div>
          {errors.employmentType && <p className="text-sm text-destructive">{errors.employmentType}</p>}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1" disabled={submitting}>Back</Button>
        <Button onClick={handleNext} className="flex-1" disabled={submitting}>
          {submitting ? 'Checking...' : 'See my results'}
        </Button>
      </div>
    </div>
  )
}

// ── Page root ─────────────────────────────────────────────────
export default function CalcPage() {
  const { state, update } = useCalcWizard()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)

  async function handleMover() {
    update({ variant: 'mover' })

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
      is_ftb: false,
      eligible: false,
      saved: false,
    }).select('id').single()

    if (data?.id) sessionStorage.setItem('snapshot_id', data.id)
    navigate('/calc/results')
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="mx-auto max-w-lg px-6 py-12">
        <ProgressBar step={step} total={4} />
        {step === 1 && <Step1 onNext={() => setStep(2)} />}
        {step === 2 && <Step2 onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <Step3 onNext={() => setStep(4)} onBack={() => setStep(2)} onMover={handleMover} />}
        {step === 4 && <Step4 onBack={() => setStep(3)} />}
      </main>
    </div>
  )
}
