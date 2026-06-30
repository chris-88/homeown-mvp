import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { track } from '@/lib/analytics'
import { supabase } from '@/lib/supabase'
import { PublicNav } from '@/components/shared/PublicNav'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ROI_COUNTIES, DUBLIN_POSTCODES } from '@/lib/calcWizard'

// ── Constants ──────────────────────────────────────────────────
const GROWTH = 0.05
const DEPOSIT_PCT = 0.10
const VW = 720
const ML = 58, MR = 74, MT = 18, MB = 40
const PW = VW - ML - MR    // 588

// ── Chart math ─────────────────────────────────────────────────
function depositAt(price: number, t: number) {
  return DEPOSIT_PCT * price * Math.pow(1 + GROWTH, t)
}
function savingsAt(monthly: number, t: number) {
  return monthly * 12 * t
}
function findCrossing(price: number, monthly: number): number | null {
  let prev = savingsAt(monthly, 0) - depositAt(price, 0)
  for (let t = 0.02; t <= 10.001; t += 0.02) {
    const d = savingsAt(monthly, t) - depositAt(price, t)
    if (prev < 0 && d >= 0) return (t - 0.02) + 0.02 * (0 - prev) / (d - prev)
    prev = d
  }
  return null
}
function fmt(n: number) { return '€' + Math.round(n).toLocaleString('en-IE') }
function fmtK(n: number) { return '€' + Math.round(n / 1000) + 'k' }
function yearsLabel(t: number) {
  const r = Math.round(t * 10) / 10
  return r + (r === 1 ? ' year' : ' years')
}

// ── Shared primitives ──────────────────────────────────────────
function Progress({ step }: { step: number }) {
  return (
    <div className="mb-10">
      <p className="text-xs text-muted-foreground mb-2">Step {step} of 4</p>
      <div className="h-[3px] w-full rounded-full bg-muted">
        <div className="h-[3px] rounded-full bg-primary transition-all duration-500"
          style={{ width: `${(step / 4) * 100}%` }} />
      </div>
    </div>
  )
}

function ChartSlider({ label, value, display, min, max, step, onChange }: {
  label: string; value: number; display: string
  min: number; max: number; step: number; onChange: (v: number) => void
}) {
  const pct = `${Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))}%`
  return (
    <div>
      <div className="flex justify-between items-baseline mb-2.5">
        <label className="text-[11px] tracking-[0.09em] uppercase text-muted-foreground">{label}</label>
        <span className="text-sm font-semibold text-brand-green tabular-nums">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="slider-range"
        style={{ '--pct': pct } as React.CSSProperties} />
    </div>
  )
}

function Pills({ options, value, onChange }: {
  options: { value: string; label: string }[]
  value: string | null; onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={cn(
            'rounded-full border px-4 py-1.5 text-sm font-medium',
            'transition-[background-color,color,border-color,transform] duration-[80ms]',
            'active:scale-[0.94]',
            value === o.value
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-input bg-background text-foreground hover:bg-accent'
          )}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

function NavRow({ onBack, onNext, nextLabel, disabled }: {
  onBack: () => void; onNext: () => void; nextLabel: string; disabled?: boolean
}) {
  return (
    <div className="flex gap-3 mt-10">
      <button onClick={onBack}
        className="inline-flex items-center gap-2 rounded-lg border px-5 py-3 text-sm font-medium hover:bg-accent transition-[background-color,transform] active:scale-[0.97]">
        <ArrowLeft className="h-4 w-4" />Back
      </button>
      <button onClick={onNext} disabled={disabled}
        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-[15px] font-medium text-primary-foreground hover:bg-brand-green-light transition-[background-color,transform] active:scale-[0.97] disabled:opacity-60">
        {nextLabel}<ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

// ── SharedChart — persists across steps 1–3, animates between scenes ──
// CSS `transition: d` interpolates path coordinates between scenes.
// All three scenes use 51-point paths (1 M + 50 L) so the structure is identical.
function SharedChart({ scene, price, monthly, savedSoFar }: {
  scene: 1 | 2 | 3
  price: number; monthly: number; savedSoFar: number
}) {
  const VH = 320, PH = VH - MT - MB
  const YEARS = 10

  const entryStake = Math.round(price * 0.01)
  const strike = Math.round(price * 0.90)
  const startT = Math.max(0, (entryStake - savedSoFar) / monthly) / 12
  const endT = Math.min(startT + 5, YEARS)
  const mktAtEnd = price * Math.pow(1 + GROWTH, 5)

  // Y domain per scene — scene 3 zooms into the equity region
  let yMin: number, yMax: number
  if (scene === 1) {
    const maxVal = Math.max(depositAt(price, YEARS), savingsAt(monthly, YEARS))
    yMin = 0
    yMax = Math.max(10000, Math.ceil(maxVal * 1.1 / 10000) * 10000)
  } else if (scene === 2) {
    yMin = 0
    yMax = entryStake * 5
  } else {
    yMin = strike * 0.90
    yMax = mktAtEnd * 1.06
  }

  const xPix = (t: number) => ML + (t / YEARS) * PW
  const yPix = (v: number) => {
    const raw = MT + PH - ((v - yMin) / (yMax - yMin)) * PH
    return Math.max(MT - 12, Math.min(MT + PH + 12, raw))
  }

  // Build 51-point SVG path — identical structure across all scenes enables CSS d-transition
  const buildD = (getY: (t: number) => number) =>
    Array.from({ length: 51 }, (_, i) => {
      const t = (i / 50) * YEARS
      return `${i === 0 ? 'M' : 'L'} ${xPix(t).toFixed(1)} ${yPix(getY(t)).toFixed(1)}`
    }).join(' ')

  // Line 1 (green solid): deposit curve → entry stake flat → market value rising
  const d1 = buildD(t => {
    if (scene === 1) return depositAt(price, t)
    if (scene === 2) return entryStake
    if (t <= startT) return price
    if (t <= endT) return price * Math.pow(1 + GROWTH, t - startT)
    return mktAtEnd
  })

  // Line 2 (taupe dashed): savings line → savings toward entry → option price flat
  const d2 = buildD(t => {
    if (scene === 1) return savingsAt(monthly, t)
    if (scene === 2) return savedSoFar + monthly * 12 * t
    if (t <= startT) return price   // before lock-in: tracks market (same start point as line 1)
    return strike                   // after lock-in: flat option price
  })

  // Y grid — 5 evenly-spaced ticks
  const yTicks = [0, 1, 2, 3, 4].map(i => {
    const v = yMin + (yMax - yMin) * i / 4
    return { v, y: yPix(v) }
  })

  // Scene 1 crossing: where savings finally catch the growing deposit
  const cross1 = scene === 1 ? findCrossing(price, monthly) : null

  // Scene 2 crossing: when savings reach entry stake
  const cross2Months = scene === 2 && savedSoFar < entryStake && monthly > 0
    ? (entryStake - savedSoFar) / monthly : null
  const cross2T = cross2Months !== null ? cross2Months / 12 : null

  // Scene 3 equity fill polygon (between market value curve and option price flat line)
  const fillD = scene === 3
    ? [
        `M ${xPix(startT).toFixed(1)} ${yPix(strike).toFixed(1)}`,
        ...Array.from({ length: 51 }, (_, i) => {
          const t = startT + (i / 50) * 5
          return `L ${xPix(Math.min(t, endT)).toFixed(1)} ${yPix(price * Math.pow(1 + GROWTH, i / 50 * 5)).toFixed(1)}`
        }),
        `L ${xPix(endT).toFixed(1)} ${yPix(strike).toFixed(1)} Z`,
      ].join(' ')
    : null

  const midT = (startT + endT) / 2
  const mktMidY = yPix(price * Math.pow(1 + GROWTH, 2.5))
  const optY = yPix(strike)
  const yMidFill = (mktMidY + optY) / 2

  // Right-edge labels for scenes 1 and 2
  const label1y = scene === 1 ? yPix(depositAt(price, YEARS)) : yPix(entryStake)
  const label2y = scene === 1
    ? yPix(savingsAt(monthly, YEARS))
    : yPix(Math.min(savedSoFar + monthly * 12 * YEARS, yMax))

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full h-auto overflow-visible mb-6" role="img"
      aria-label="Pathway comparison chart">

      {/* Y grid */}
      {yTicks.map(({ v, y }) => (
        <g key={v}>
          <line stroke="rgba(18,58,40,0.10)" strokeWidth="1"
            x1={ML} y1={y.toFixed(1)} x2={ML + PW} y2={y.toFixed(1)} />
          <text fontFamily="Montserrat,sans-serif" fontSize="11" fill="#857861"
            textAnchor="end" x={ML - 8} y={(y + 4).toFixed(1)}>{fmtK(v)}</text>
        </g>
      ))}

      {/* X axis labels — even years */}
      {[0, 2, 4, 6, 8, 10].map(k => (
        <text key={k} fontFamily="Montserrat,sans-serif" fontSize="11" fill="#857861"
          textAnchor="middle" x={xPix(k).toFixed(1)} y={MT + PH + 24}>
          {k === 0 ? 'Now' : `Yr ${k}`}
        </text>
      ))}

      {/* Scene 3 equity fill */}
      {fillD && <path d={fillD} fill="rgba(18,58,40,0.08)" />}

      {/* Line 2 — taupe dashed — CSS d-transition animates between scenes */}
      <path d={d2} fill="none" stroke="#857861" strokeWidth="2" strokeDasharray="5 5"
        style={{ transition: 'd 0.6s ease-in-out' } as React.CSSProperties} />

      {/* Line 1 — green solid — CSS d-transition animates between scenes */}
      <path d={d1} fill="none" stroke="#123A28" strokeWidth="2.5"
        style={{ transition: 'd 0.6s ease-in-out' } as React.CSSProperties} />

      {/* Scene 1: crossing callout — where deposit catches up to savings */}
      {cross1 !== null && (() => {
        const xc = xPix(cross1)
        const yc = yPix(depositAt(price, cross1))
        const bw = 160, bh = 46
        let bx = xc + 12; if (bx + bw > ML + PW) bx = xc - 12 - bw
        let by = yc - bh - 10; if (by < MT) by = yc + 12
        return (
          <>
            <line stroke="rgba(18,58,40,0.22)" strokeWidth="1" strokeDasharray="3 3"
              x1={xc.toFixed(1)} y1={MT} x2={xc.toFixed(1)} y2={MT + PH} />
            <circle fill="#123A28" cx={xc.toFixed(1)} cy={yc.toFixed(1)} r="4.5" />
            <rect fill="#FAF6F0" stroke="rgba(18,58,40,0.14)" strokeWidth="1"
              x={bx.toFixed(1)} y={by.toFixed(1)} width={bw} height={bh} rx="7" />
            <text fontFamily="Montserrat,sans-serif" fontSize="12.5" fill="#101211"
              x={bx + 14} y={by + 20}>{yearsLabel(cross1)} to catch it</text>
            <text fontFamily="Montserrat,sans-serif" fontSize="12.5" fill="#857861"
              x={bx + 14} y={by + 37}>at {fmt(depositAt(price, cross1))}</text>
          </>
        )
      })()}

      {/* Scene 2: entry crossing callout */}
      {cross2T !== null && cross2T <= YEARS && (() => {
        const xc = xPix(cross2T)
        const yc = yPix(entryStake)
        const bw = 148, bh = 44
        let bx = xc + 12; if (bx + bw > ML + PW) bx = xc - 12 - bw
        let by = yc - bh - 10; if (by < MT) by = yc + 12
        return (
          <>
            <line stroke="rgba(18,58,40,0.22)" strokeWidth="1" strokeDasharray="3 3"
              x1={xc.toFixed(1)} y1={MT} x2={xc.toFixed(1)} y2={MT + PH} />
            <circle fill="#123A28" cx={xc.toFixed(1)} cy={yc.toFixed(1)} r="4.5" />
            <rect fill="#FAF6F0" stroke="rgba(18,58,40,0.14)" strokeWidth="1"
              x={bx.toFixed(1)} y={by.toFixed(1)} width={bw} height={bh} rx="7" />
            <text fontFamily="Montserrat,sans-serif" fontSize="12.5" fill="#101211"
              x={bx + 14} y={by + 18}>{Math.round(cross2Months!)} months</text>
            <text fontFamily="Montserrat,sans-serif" fontSize="12.5" fill="#857861"
              x={bx + 14} y={by + 34}>to get started</text>
          </>
        )
      })()}

      {/* Scene 3: start/end markers, end-line value labels, equity callout */}
      {scene === 3 && (
        <>
          {startT > 0.05 && (
            <>
              <line stroke="rgba(18,58,40,0.25)" strokeWidth="1" strokeDasharray="4 3"
                x1={xPix(startT).toFixed(1)} y1={MT} x2={xPix(startT).toFixed(1)} y2={MT + PH} />
              <text fontFamily="Montserrat,sans-serif" fontSize="11" fontWeight="500" fill="#857861"
                textAnchor="middle" x={xPix(startT).toFixed(1)} y={MT - 6}>Start</text>
            </>
          )}
          <line stroke="rgba(18,58,40,0.25)" strokeWidth="1" strokeDasharray="4 3"
            x1={xPix(endT).toFixed(1)} y1={MT} x2={xPix(endT).toFixed(1)} y2={MT + PH} />
          <text fontFamily="Montserrat,sans-serif" fontSize="11" fontWeight="500" fill="#857861"
            textAnchor="middle" x={xPix(endT).toFixed(1)} y={MT - 6}>End</text>
          <text fontFamily="Montserrat,sans-serif" fontSize="12" fontWeight="500" fill="#123A28"
            x={(xPix(endT) + 8).toFixed(1)} y={(yPix(mktAtEnd) + 4).toFixed(1)}>~{fmtK(mktAtEnd)}</text>
          <text fontFamily="Montserrat,sans-serif" fontSize="12" fontWeight="500" fill="#857861"
            x={(xPix(endT) + 8).toFixed(1)} y={(optY + 4).toFixed(1)}>{fmtK(strike)}</text>
          <text fontFamily="Montserrat,sans-serif" fontSize="13" fontWeight="600" fill="#101211"
            textAnchor="middle" x={xPix(midT).toFixed(1)} y={(yMidFill - 6).toFixed(1)}>
            + {fmt(mktAtEnd - strike)}
          </text>
          <text fontFamily="Montserrat,sans-serif" fontSize="11" fill="rgba(18,58,40,0.45)"
            textAnchor="middle" x={xPix(midT).toFixed(1)} y={(yMidFill + 10).toFixed(1)}>
            growing equity
          </text>
        </>
      )}

      {/* Scenes 1 + 2: right-edge line labels */}
      {scene !== 3 && (
        <>
          <text fontFamily="Montserrat,sans-serif" fontSize="12" fontWeight="500" fill="#123A28"
            x={ML + PW + 8} y={(label1y + 4).toFixed(1)}>
            {scene === 1 ? 'Deposit' : 'Entry'}
          </text>
          <text fontFamily="Montserrat,sans-serif" fontSize="12" fontWeight="500" fill="#857861"
            x={ML + PW + 8} y={(label2y + 4).toFixed(1)}>Saved</text>
        </>
      )}
    </svg>
  )
}

// ── Step 1 — text + sliders (chart lives in parent) ────────────
function Step1({ price, monthly, setPrice, setMonthly, onNext }: {
  price: number; monthly: number
  setPrice: (v: number) => void; setMonthly: (v: number) => void
  onNext: () => void
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted-foreground mb-2.5">
        The traditional route
      </p>
      <h2 className="text-[clamp(34px,6vw,52px)] font-bold leading-[1.02] tracking-tight mb-8">
        The deposit keeps moving.
      </h2>

      <div className="pt-2 pb-4 border-t border-brand-cream">
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-muted-foreground mb-5">
          Adjust for your own.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <ChartSlider label="Target price" value={price} display={fmt(price)}
            min={250000} max={900000} step={10000} onChange={setPrice} />
          <ChartSlider label="Saving / month" value={monthly} display={fmt(monthly)}
            min={100} max={3000} step={50} onChange={setMonthly} />
        </div>
      </div>

      <div className="mt-8">
        <button onClick={onNext}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-[15px] font-medium text-primary-foreground hover:bg-brand-green-light transition-[background-color,transform] active:scale-[0.97]">
          See what Homeown changes <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ── Step 2 — controlled props so parent chart updates in real-time ─
function Step2({ price, savedSoFar, setSavedSoFar, housingCost, setHousingCost, onNext, onBack }: {
  price: number
  savedSoFar: number; setSavedSoFar: (v: number) => void
  housingCost: number; setHousingCost: (v: number) => void
  onNext: () => void; onBack: () => void
}) {
  const entryStake = Math.round(price * 0.01)

  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted-foreground mb-2.5">
        Your starting point
      </p>
      <h2 className="text-[clamp(28px,5vw,48px)] font-bold leading-[1.08] tracking-tight mb-8">
        A 1% entry stake.
      </h2>

      <div className="pt-2 pb-4 border-t border-brand-cream">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <ChartSlider label="Saved so far" value={savedSoFar} display={fmt(savedSoFar)}
            min={0} max={Math.max(100, entryStake - 100)} step={100}
            onChange={v => setSavedSoFar(Math.min(v, entryStake))} />
          <ChartSlider label="Housing cost each month" value={housingCost} display={fmt(housingCost)}
            min={500} max={5000} step={50} onChange={setHousingCost} />
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <button onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border px-5 py-3 text-sm font-medium hover:bg-accent transition-[background-color,transform] active:scale-[0.97]">
          <ArrowLeft className="h-4 w-4" />Back
        </button>
        <button onClick={onNext}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-[15px] font-medium text-primary-foreground hover:bg-brand-green-light transition-[background-color,transform] active:scale-[0.97]">
          See it grow for you <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ── Step 3 — text + CTA (chart lives in parent) ────────────────
function Step3({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted-foreground mb-2.5">
        While you live there
      </p>
      <h2 className="text-[clamp(28px,5vw,48px)] font-bold leading-[1.08] tracking-tight mb-8">
        The price is locked. The value isn't.
      </h2>
      <NavRow onBack={onBack} onNext={onNext} nextLabel="Calculate my full numbers" />
    </div>
  )
}

// ── Step 4 — Details form ──────────────────────────────────────
function Step4({ price, monthly, housingCost, onBack }: {
  price: number; monthly: number; housingCost: number; onBack: () => void
}) {
  const navigate = useNavigate()
  // Minimum income needed: mortgage (90% of price) / 4x LTI rule, rounded to nearest 1k
  const minIncome = Math.round(price * 0.225 / 1000) * 1000
  const sliderMax = Math.max(200000, Math.round(minIncome * 2 / 10000) * 10000)
  const [ghi, setGhi] = useState(minIncome)
  const [county, setCounty] = useState('')
  const [dublinPostcode, setDublinPostcode] = useState<string | null>(null)
  const [householdType, setHouseholdType] = useState<'solo' | 'couple' | null>(null)
  const [isFtb, setIsFtb] = useState<boolean | null>(null)
  const [employmentType, setEmploymentType] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    const errs: Record<string, string> = {}
    if (ghi < minIncome) errs.ghi = `At least ${fmt(minIncome)} household income is needed for this purchase price`
    if (!county) errs.county = 'Please select a county'
    if (county === 'Dublin' && !dublinPostcode) errs.dublinPostcode = 'Please select a postcode'
    if (!householdType) errs.householdType = 'Please select an option'
    if (isFtb === null) errs.isFtb = 'Please answer this question'
    if (!employmentType) errs.employmentType = 'Please select an option'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setSubmitting(true)

    const eligible = isFtb !== false
    const anonId = sessionStorage.getItem('anon_id') ?? crypto.randomUUID()
    sessionStorage.setItem('anon_id', anonId)
    const snapshotId = crypto.randomUUID()

    await supabase.from('calculator_snapshots').insert({
      id: snapshotId,
      anon_session_id: anonId,
      property_price: price,
      entry_stake: Math.round(price * 0.01),
      monthly_domiter: parseFloat(((price * 0.082) / 12).toFixed(2)),
      strike_price: Math.round(price * 0.90),
      county,
      dublin_postcode: dublinPostcode ?? null,
      household_type: householdType,
      is_ftb: isFtb,
      ghi,
      employment_type: employmentType,
      eligible,
      saved: false,
      monthly_savings: monthly,
      current_housing_cost: housingCost > 0 ? housingCost : null,
    })

    sessionStorage.setItem('snapshot_id', snapshotId)
    track('calc2_complete', { county, eligible })
    setSubmitting(false)
    navigate('/calc/save')
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Personal information
        </h2>
        <p className="mt-2 text-muted-foreground">
          A few details so we can personalise your pathway numbers.
        </p>
      </div>

      {/* Income */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Income</p>
        <ChartSlider label="Gross household income" value={ghi} display={fmt(ghi)}
          min={45000} max={sliderMax} step={1000} onChange={setGhi} />
        <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
          <span>€45k</span><span>{fmtK(sliderMax)}</span>
        </div>
        {ghi < minIncome && (
          <p className="mt-2 text-sm text-destructive">
            At least {fmt(minIncome)} is typically needed to qualify for a mortgage on this property.
          </p>
        )}
        {errors.ghi && <p className="mt-1 text-sm text-destructive">{errors.ghi}</p>}
      </div>

      {/* Location */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Location</p>
        <div className="grid grid-cols-4 gap-1.5">
          {ROI_COUNTIES.map(c => (
            <button key={c} type="button"
              onClick={() => { setCounty(c); if (c !== 'Dublin') setDublinPostcode(null) }}
              className={cn(
                'rounded-full border px-2 py-1 text-xs font-medium text-center',
                'transition-[background-color,color,border-color,transform] duration-[80ms] active:scale-[0.94]',
                county === c
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-input bg-background text-foreground hover:bg-accent'
              )}>
              {c}
            </button>
          ))}
        </div>
        {errors.county && <p className="text-sm text-destructive">{errors.county}</p>}
        {county === 'Dublin' && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Dublin postcode</label>
            <Select value={dublinPostcode || undefined} onValueChange={setDublinPostcode}>
              <SelectTrigger><SelectValue placeholder="Select postcode" /></SelectTrigger>
              <SelectContent>
                {DUBLIN_POSTCODES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.dublinPostcode && <p className="text-sm text-destructive">{errors.dublinPostcode}</p>}
          </div>
        )}
      </div>

      {/* Household */}
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Your household</p>
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Who will be on the pathway?</p>
          <Pills
            options={[{ value: 'solo', label: 'Just me' }, { value: 'couple', label: 'Me and my partner' }]}
            value={householdType}
            onChange={v => setHouseholdType(v as 'solo' | 'couple')}
          />
          {errors.householdType && <p className="text-sm text-destructive">{errors.householdType}</p>}
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Have you ever owned a home?</p>
          <Pills
            options={[{ value: 'ftb', label: 'No, never' }, { value: 'prev', label: 'Yes' }]}
            value={isFtb === null ? null : isFtb ? 'ftb' : 'prev'}
            onChange={v => setIsFtb(v === 'ftb')}
          />
          {errors.isFtb && <p className="text-sm text-destructive">{errors.isFtb}</p>}
        </div>
      </div>

      {/* Employment */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Employment</p>
        <Pills
          options={[
            { value: 'paye', label: 'Employed (PAYE)' },
            { value: 'self_employed', label: 'Self-employed' },
            { value: 'mixed', label: 'Mix of both' },
          ]}
          value={employmentType}
          onChange={setEmploymentType}
        />
        {errors.employmentType && <p className="text-sm text-destructive">{errors.employmentType}</p>}
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg border px-5 py-3 text-sm font-medium hover:bg-accent transition-[background-color,transform] active:scale-[0.97] disabled:opacity-60">
          <ArrowLeft className="h-4 w-4" />Back
        </button>
        <button onClick={handleSubmit} disabled={submitting}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-[15px] font-medium text-primary-foreground hover:bg-brand-green-light transition-[background-color,transform] active:scale-[0.97] disabled:opacity-60">
          {submitting ? 'Saving…' : 'See my results'}{!submitting && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

// ── Page root ──────────────────────────────────────────────────
export default function Calc2Page() {
  const [step, setStep] = useState(1)
  const [price, setPrice] = useState(580000)
  const [monthly, setMonthly] = useState(1000)
  const [savedSoFar, setSavedSoFar] = useState(0)
  const [housingCost, setHousingCost] = useState(1800)

  useEffect(() => {
    window.scrollTo(0, 0)
    track(`calc2_step${step}_view`, {})
  }, [step])

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <Progress step={step} />

        {/* SharedChart persists outside the keyed div so CSS d-transitions fire on scene change */}
        {step <= 3 && (
          <SharedChart
            scene={step as 1 | 2 | 3}
            price={price}
            monthly={monthly}
            savedSoFar={savedSoFar}
          />
        )}

        {/* key={step} remounts step content for slide-in animation without affecting SharedChart */}
        <div key={step} className="animate-step-enter">
          {step === 1 && (
            <Step1 price={price} monthly={monthly}
              setPrice={setPrice} setMonthly={setMonthly}
              onNext={() => setStep(2)} />
          )}
          {step === 2 && (
            <Step2 price={price}
              savedSoFar={savedSoFar} setSavedSoFar={setSavedSoFar}
              housingCost={housingCost} setHousingCost={setHousingCost}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)} />
          )}
          {step === 3 && (
            <Step3 onNext={() => setStep(4)} onBack={() => setStep(2)} />
          )}
          {step === 4 && (
            <Step4 price={price} monthly={monthly} housingCost={housingCost} onBack={() => setStep(3)} />
          )}
        </div>
      </main>
    </div>
  )
}
