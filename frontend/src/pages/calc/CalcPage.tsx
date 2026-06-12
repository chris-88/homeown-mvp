import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PublicNav } from '@/components/shared/PublicNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  const [inputValue, setInputValue] = useState(state.propertyPrice.toString())

  function handleSlider(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseInt(e.target.value)
    setPrice(v)
    setInputValue(v.toString())
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value)
    const v = parseInt(e.target.value.replace(/[^0-9]/g, ''))
    if (!isNaN(v)) setPrice(v)
  }

  function handleInputBlur() {
    const v = parseInt(inputValue.replace(/[^0-9]/g, ''))
    const clamped = isNaN(v) ? 350000 : Math.min(800000, Math.max(200000, v))
    const snapped = Math.round(clamped / 5000) * 5000
    setPrice(snapped)
    setInputValue(snapped.toString())
  }

  const valid = state.propertyPrice >= 200000 && state.propertyPrice <= 800000

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">What property price are you targeting?</h2>
        <p className="mt-1 text-sm text-muted-foreground">Properties between €200,000 and €800,000 are eligible.</p>
      </div>

      <div className="space-y-4">
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
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">€</span>
          <Input
            value={inputValue}
            onChange={handleInput}
            onBlur={handleInputBlur}
            className="max-w-[180px] font-medium"
          />
        </div>
      </div>

      <Card className="bg-muted/30">
        <CardContent className="pt-4 pb-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Monthly service fee (Domiter)</span>
            <span className="font-semibold">{formatCurrency(state.monthlyDomiter)} / month</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Entry Stake</span>
            <span className="font-semibold">{formatCurrency(state.entryStake)} <span className="text-muted-foreground font-normal">(1% of property price)</span></span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Purchase option price</span>
            <span className="font-semibold">{formatCurrency(state.strikePrice)} <span className="text-muted-foreground font-normal">(fixed at 10% below today's price)</span></span>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        These figures are illustrative. The monthly service fee is your choice — Homeown does not assess whether it suits your budget.
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
  const [ghiInput, setGhiInput] = useState(state.ghi > 0 ? state.ghi.toString() : '')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

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
    ? 'Combined gross annual income (both applicants)'
    : 'Gross annual income'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">What is your household's gross annual income?</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          To complete the pathway, you purchase the property via a regulated mortgage at the end of the term.
          We use your income to check whether the property is within a range where a regulated mortgage at exit
          is a realistic outcome — not to assess whether you can afford the monthly service fee.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{incomeLabel}</label>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">€</span>
            <Input
              value={ghiInput}
              onChange={(e) => setGhiInput(e.target.value)}
              onBlur={() => {
                const v = parseInt(ghiInput.replace(/[^0-9]/g, ''))
                if (!isNaN(v)) { setGhiInput(v.toString()); update({ ghi: v }) }
              }}
              placeholder="75000"
              className="max-w-[200px]"
            />
          </div>
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
