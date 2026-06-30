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

// SVG viewport
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
const SERIF: React.CSSProperties = { fontFamily: "'Fraunces', Georgia, serif" }

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
          className={cn('rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
            value === o.value
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-input bg-background text-foreground hover:bg-accent')}>
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
        className="inline-flex items-center gap-2 rounded-lg border px-5 py-3 text-sm font-medium hover:bg-accent transition-colors">
        <ArrowLeft className="h-4 w-4" />Back
      </button>
      <button onClick={onNext} disabled={disabled}
        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-[15px] font-medium text-primary-foreground hover:bg-brand-green-light transition-colors disabled:opacity-60">
        {nextLabel}<ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

// ── Step 1 — The problem chart ─────────────────────────────────
function Step1({ price, monthly, setPrice, setMonthly, onNext }: {
  price: number; monthly: number
  setPrice: (v: number) => void; setMonthly: (v: number) => void
  onNext: () => void
}) {
  const VH = 380, PH = VH - MT - MB
  const YEARS = 10

  const maxVal = Math.max(depositAt(price, YEARS), savingsAt(monthly, YEARS))
  const niceMax = Math.max(10000, Math.ceil(maxVal * 1.05 / 10000) * 10000)
  const xPix = (t: number) => ML + (t / YEARS) * PW
  const yPix = (v: number) => MT + PH - (v / niceMax) * PH

  const depositPts = Array.from({ length: 51 }, (_, i) => {
    const t = (i / 50) * YEARS
    return `${xPix(t).toFixed(1)},${yPix(depositAt(price, t)).toFixed(1)}`
  }).join(' ')
  const savY0 = yPix(0)
  const savYEnd = Math.max(yPix(savingsAt(monthly, YEARS)), MT)
  const crossing = findCrossing(price, monthly)
  const gridLines = [0, 1, 2, 3, 4].map(i => ({ v: niceMax * i / 4, y: yPix(niceMax * i / 4) }))

  let crossingMark: React.ReactNode = null

  if (crossing !== null) {
    const vc = depositAt(price, crossing)
    const xc = xPix(crossing), yc = yPix(vc)
    const bw = 160, bh = 46
    let bx = xc + 12; if (bx + bw > ML + PW) bx = xc - 12 - bw
    let by = yc - bh - 10; if (by < MT) by = yc + 12
    crossingMark = (
      <>
        <line stroke="rgba(18,58,40,0.22)" strokeWidth="1" strokeDasharray="3 3"
          x1={xc.toFixed(1)} y1={MT} x2={xc.toFixed(1)} y2={MT + PH} />
        <circle fill="#123A28" cx={xc.toFixed(1)} cy={yc.toFixed(1)} r="4.5" />
        <rect fill="#FAF6F0" stroke="rgba(18,58,40,0.14)" strokeWidth="1"
          x={bx.toFixed(1)} y={by.toFixed(1)} width={bw} height={bh} rx="7" />
        <text fontFamily="Montserrat,sans-serif" fontSize="12.5" fill="#101211"
          x={bx + 14} y={by + 20}>{yearsLabel(crossing)} to catch it</text>
        <text fontFamily="Montserrat,sans-serif" fontSize="12.5" fill="#857861"
          x={bx + 14} y={by + 37}>at {fmt(vc)}</text>
      </>
    )
  }

  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted-foreground mb-2.5">
        The traditional route
      </p>
      <h2 className="text-[clamp(34px,6vw,52px)] font-bold leading-[1.02] tracking-tight mb-8">
        The deposit keeps moving.
      </h2>

      <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full h-auto overflow-visible" role="img"
        aria-label="Chart comparing deposit required against savings over ten years">
        {gridLines.map(({ v, y }) => (
          <g key={v}>
            <line stroke="rgba(18,58,40,0.14)" strokeWidth="1" x1={ML} y1={y.toFixed(1)} x2={ML + PW} y2={y.toFixed(1)} />
            <text fontFamily="Montserrat,sans-serif" fontSize="11" fill="#857861"
              textAnchor="end" x={ML - 12} y={(y + 4).toFixed(1)}>{fmtK(v)}</text>
          </g>
        ))}
        {Array.from({ length: YEARS + 1 }, (_, k) => (
          <text key={k} fontFamily="Montserrat,sans-serif" fontSize="11" fill="#857861"
            textAnchor="middle" x={xPix(k).toFixed(1)} y={MT + PH + 24}>
            {k === 0 ? 'Start' : k}
          </text>
        ))}
        <line stroke="#857861" strokeWidth="2" strokeDasharray="5 5"
          x1={xPix(0).toFixed(1)} y1={savY0.toFixed(1)}
          x2={xPix(YEARS).toFixed(1)} y2={savYEnd.toFixed(1)} />
        <polyline fill="none" stroke="#123A28" strokeWidth="2.5" points={depositPts} />
        <text fontFamily="Montserrat,sans-serif" fontSize="12" fontWeight="500" fill="#123A28"
          x={ML + PW + 8} y={(yPix(depositAt(price, YEARS)) + 4).toFixed(1)}>Deposit</text>
        <text fontFamily="Montserrat,sans-serif" fontSize="12" fontWeight="500" fill="#857861"
          x={ML + PW + 8} y={(savYEnd + 4).toFixed(1)}>Saved</text>
        {crossingMark}
      </svg>

      <div className="mt-8 pt-6 border-t border-brand-cream">
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

      <div className="mt-12">
        <button onClick={onNext}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-[15px] font-medium text-primary-foreground hover:bg-brand-green-light transition-colors">
          See what Homeown changes <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ── Step 2 — Entry stake chart (months) ───────────────────────
function Step2({ price, monthly, initSaved, initHousing, onNext, onBack }: {
  price: number; monthly: number
  initSaved: number; initHousing: number
  onNext: (savedSoFar: number, housingCost: number) => void
  onBack: () => void
}) {
  const [savedSoFar, setSavedSoFar] = useState(initSaved)
  const [housingCost, setHousingCost] = useState(initHousing)

  const VH = 300, PH = VH - MT - MB
  const entryStake = Math.round(price * 0.01)
  const ready = savedSoFar >= entryStake

  // Crossing in months (using the step-1 monthly saving rate)
  const crossingMonths = ready ? 0 : (entryStake - savedSoFar) / monthly

  // Dynamic X range: snap up to nearest 6-month boundary, min 18
  const maxMonths = ready
    ? 18
    : Math.min(48, Math.ceil(Math.max(18, crossingMonths * 2) / 6) * 6)

  const finalSavings = savedSoFar + monthly * maxMonths
  const niceMax = Math.ceil(Math.max(entryStake * 1.3, finalSavings * 1.05) / 1000) * 1000

  const xPix = (m: number) => ML + (m / maxMonths) * PW
  const yPix = (v: number) => MT + PH - (v / niceMax) * PH

  const entryY = yPix(entryStake)
  const savY0 = yPix(savedSoFar)
  const savYEnd = Math.max(yPix(finalSavings), MT)

  // Y grid ticks
  const yTicks = [0, 1, 2, 3].map(i => ({
    v: (niceMax * i) / 3, y: yPix((niceMax * i) / 3),
  }))

  // X tick marks every 6 months
  const xTicks = Array.from({ length: maxMonths / 6 + 1 }, (_, i) => i * 6)

  // Crossing marker
  let crossingMark: React.ReactNode = null
  if (!ready && crossingMonths <= maxMonths) {
    const xc = xPix(crossingMonths)
    const yc = entryY   // savings line meets entry stake at entryY
    const bw = 148, bh = 44
    let bx = xc + 12; if (bx + bw > ML + PW) bx = xc - 12 - bw
    let by = yc - bh - 10; if (by < MT) by = yc + 12
    crossingMark = (
      <>
        <line stroke="rgba(18,58,40,0.22)" strokeWidth="1" strokeDasharray="3 3"
          x1={xc.toFixed(1)} y1={MT} x2={xc.toFixed(1)} y2={MT + PH} />
        <circle fill="#123A28" cx={xc.toFixed(1)} cy={yc.toFixed(1)} r="4.5" />
        <rect fill="#FAF6F0" stroke="rgba(18,58,40,0.14)" strokeWidth="1"
          x={bx.toFixed(1)} y={by.toFixed(1)} width={bw} height={bh} rx="7" />
        <text fontFamily="Montserrat,sans-serif" fontSize="12.5" fill="#101211"
          x={bx + 14} y={by + 18}>{Math.round(crossingMonths)} months</text>
        <text fontFamily="Montserrat,sans-serif" fontSize="12.5" fill="#857861"
          x={bx + 14} y={by + 34}>to get started</text>
      </>
    )
  }

  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted-foreground mb-2.5">
        Your starting point
      </p>
      <h2 className="text-[clamp(28px,5vw,48px)] font-bold leading-[1.08] tracking-tight mb-8">
        A 1% entry stake.
      </h2>

      <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full h-auto overflow-visible" role="img"
        aria-label="Chart showing how quickly savings reach the 1% entry stake">
        {/* Y grid */}
        {yTicks.map(({ v, y }) => (
          <g key={v}>
            <line stroke="rgba(18,58,40,0.12)" strokeWidth="1" x1={ML} y1={y.toFixed(1)} x2={ML + PW} y2={y.toFixed(1)} />
            <text fontFamily="Montserrat,sans-serif" fontSize="11" fill="#857861"
              textAnchor="end" x={ML - 12} y={(y + 4).toFixed(1)}>{fmtK(v)}</text>
          </g>
        ))}
        {/* X labels */}
        {xTicks.map(m => (
          <text key={m} fontFamily="Montserrat,sans-serif" fontSize="11" fill="#857861"
            textAnchor="middle" x={xPix(m).toFixed(1)} y={MT + PH + 24}>
            {m === 0 ? '0m' : `${m}m`}
          </text>
        ))}
        {/* Savings line — rising dashed gray */}
        <line stroke="#857861" strokeWidth="2" strokeDasharray="5 5"
          x1={xPix(0).toFixed(1)} y1={savY0.toFixed(1)}
          x2={xPix(maxMonths).toFixed(1)} y2={savYEnd.toFixed(1)} />
        {/* Entry stake — flat solid green */}
        <line stroke="#123A28" strokeWidth="2.5"
          x1={xPix(0).toFixed(1)} y1={entryY.toFixed(1)}
          x2={xPix(maxMonths).toFixed(1)} y2={entryY.toFixed(1)} />
        {/* Labels */}
        <text fontFamily="Montserrat,sans-serif" fontSize="12" fontWeight="500" fill="#123A28"
          x={ML + PW + 8} y={(entryY + 4).toFixed(1)}>Entry</text>
        <text fontFamily="Montserrat,sans-serif" fontSize="12" fontWeight="500" fill="#857861"
          x={ML + PW + 8} y={(savYEnd + 4).toFixed(1)}>Saved</text>
        {crossingMark}
      </svg>

      <div className="mt-8 pt-6 border-t border-brand-cream">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <ChartSlider label="Saved so far" value={savedSoFar} display={fmt(savedSoFar)}
            min={0} max={Math.max(100, entryStake - 100)} step={100}
            onChange={v => setSavedSoFar(Math.min(v, entryStake))} />
          <ChartSlider label="Housing cost each month" value={housingCost} display={fmt(housingCost)}
            min={500} max={5000} step={50} onChange={setHousingCost} />
        </div>
      </div>

      <div className="mt-10 flex gap-3">
        <button onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border px-5 py-3 text-sm font-medium hover:bg-accent transition-colors">
          <ArrowLeft className="h-4 w-4" />Back
        </button>
        <button onClick={() => onNext(savedSoFar, housingCost)}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-[15px] font-medium text-primary-foreground hover:bg-brand-green-light transition-colors">
          See it grow for you <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ── Step 3 — Equity / appreciation chart ──────────────────────
function Step3({ price, monthsToStart, onNext, onBack }: {
  price: number; monthsToStart: number; onNext: () => void; onBack: () => void
}) {
  const VH = 320, PH = VH - MT - MB

  const strike = Math.round(price * 0.90)
  const startT = monthsToStart / 12                            // years until move-in
  const TOTAL_YEARS = Math.max(6, Math.ceil(startT + 5.5))   // always space after End
  const endT = startT + 5                                      // 60-month Homeown term

  const mktAtEnd = price * Math.pow(1 + GROWTH, 5)
  const equityAtEnd = mktAtEnd - strike

  const yMin = strike * 0.90
  const yMax = mktAtEnd * 1.06
  const yRange = yMax - yMin

  const xPix = (t: number) => ML + (t / TOTAL_YEARS) * PW
  const yPix = (v: number) => MT + PH - ((v - yMin) / yRange) * PH

  const optY = yPix(strike)
  const mktStartY = yPix(price)

  // Market value curve: startT → endT (0 → 5 years of appreciation)
  const mktPts = Array.from({ length: 51 }, (_, i) => {
    const years = (i / 50) * 5
    return `${xPix(startT + years).toFixed(1)},${yPix(price * Math.pow(1 + GROWTH, years)).toFixed(1)}`
  }).join(' ')

  // Fill polygon
  const fillPts = [
    `${xPix(startT).toFixed(1)},${optY.toFixed(1)}`,
    ...Array.from({ length: 51 }, (_, i) => {
      const years = (i / 50) * 5
      return `${xPix(startT + years).toFixed(1)},${yPix(price * Math.pow(1 + GROWTH, years)).toFixed(1)}`
    }),
    `${xPix(endT).toFixed(1)},${optY.toFixed(1)}`,
  ].join(' ')

  // Equity callout at midpoint of the Homeown term
  const midT = startT + 2.5
  const mktMidY = yPix(price * Math.pow(1 + GROWTH, 2.5))
  const yMidFill = (mktMidY + optY) / 2

  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted-foreground mb-2.5">
        While you live there
      </p>
      <h2 className="text-[clamp(28px,5vw,48px)] font-bold leading-[1.08] tracking-tight mb-8">
        The price is locked. The value isn't.
      </h2>

      <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full h-auto overflow-visible" role="img"
        aria-label="Chart showing fixed option price against rising market value over five years">

        {/* Y reference lines at starting values */}
        <line stroke="rgba(18,58,40,0.10)" strokeWidth="1"
          x1={ML} y1={optY.toFixed(1)} x2={ML + PW} y2={optY.toFixed(1)} />
        <line stroke="rgba(18,58,40,0.10)" strokeWidth="1"
          x1={ML} y1={mktStartY.toFixed(1)} x2={ML + PW} y2={mktStartY.toFixed(1)} />

        {/* Y axis labels: strike (option start) and price (market start) */}
        <text fontFamily="Montserrat,sans-serif" fontSize="11" fill="#857861" textAnchor="end"
          x={ML - 12} y={(optY + 4).toFixed(1)}>{fmtK(strike)}</text>
        <text fontFamily="Montserrat,sans-serif" fontSize="11" fill="#857861" textAnchor="end"
          x={ML - 12} y={(mktStartY + 4).toFixed(1)}>{fmtK(price)}</text>

        {/* X axis labels: Now, Yr 1, ..., Yr {TOTAL_YEARS} */}
        {Array.from({ length: TOTAL_YEARS + 1 }, (_, k) => (
          <text key={k} fontFamily="Montserrat,sans-serif" fontSize="11" fill="#857861"
            textAnchor="middle" x={xPix(k).toFixed(1)} y={MT + PH + 24}>
            {k === 0 ? 'Now' : `Yr ${k}`}
          </text>
        ))}

        {/* Equity fill */}
        <polygon points={fillPts} fill="rgba(18,58,40,0.08)" />

        {/* Option price — flat dashed, startT → endT */}
        <line stroke="#857861" strokeWidth="2" strokeDasharray="5 5"
          x1={xPix(startT).toFixed(1)} y1={optY.toFixed(1)}
          x2={xPix(endT).toFixed(1)} y2={optY.toFixed(1)} />

        {/* Market value — rising solid, startT → endT */}
        <polyline fill="none" stroke="#123A28" strokeWidth="2.5" points={mktPts} />

        {/* "Start" dashed vertical line + label (only if not immediate) */}
        {startT > 0.05 && (
          <>
            <line stroke="rgba(18,58,40,0.25)" strokeWidth="1" strokeDasharray="4 3"
              x1={xPix(startT).toFixed(1)} y1={MT} x2={xPix(startT).toFixed(1)} y2={MT + PH} />
            <text fontFamily="Montserrat,sans-serif" fontSize="11" fontWeight="500" fill="#857861"
              textAnchor="middle" x={xPix(startT).toFixed(1)} y={MT - 6}>Start</text>
          </>
        )}

        {/* "End" dashed vertical line + label */}
        <line stroke="rgba(18,58,40,0.25)" strokeWidth="1" strokeDasharray="4 3"
          x1={xPix(endT).toFixed(1)} y1={MT} x2={xPix(endT).toFixed(1)} y2={MT + PH} />
        <text fontFamily="Montserrat,sans-serif" fontSize="11" fontWeight="500" fill="#857861"
          textAnchor="middle" x={xPix(endT).toFixed(1)} y={MT - 6}>End</text>

        {/* Abbreviated values at End line */}
        <text fontFamily="Montserrat,sans-serif" fontSize="12" fontWeight="500" fill="#123A28"
          x={(xPix(endT) + 8).toFixed(1)} y={(yPix(mktAtEnd) + 4).toFixed(1)}>~{fmtK(mktAtEnd)}</text>
        <text fontFamily="Montserrat,sans-serif" fontSize="12" fontWeight="500" fill="#857861"
          x={(xPix(endT) + 8).toFixed(1)} y={(optY + 4).toFixed(1)}>{fmtK(strike)}</text>

        {/* Equity callout inside fill area */}
        <text fontFamily="Montserrat,sans-serif" fontSize="13" fontWeight="600" fill="#101211"
          textAnchor="middle" x={xPix(midT).toFixed(1)} y={(yMidFill - 6).toFixed(1)}>
          + {fmt(equityAtEnd)}
        </text>
        <text fontFamily="Montserrat,sans-serif" fontSize="11" fill="rgba(18,58,40,0.45)"
          textAnchor="middle" x={xPix(midT).toFixed(1)} y={(yMidFill + 10).toFixed(1)}>
          growing equity
        </text>
      </svg>

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
              className={cn('rounded-full border px-2 py-1 text-xs font-medium text-center transition-colors',
                county === c
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-input bg-background text-foreground hover:bg-accent')}>
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
          className="inline-flex items-center gap-2 rounded-lg border px-5 py-3 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-60">
          <ArrowLeft className="h-4 w-4" />Back
        </button>
        <button onClick={handleSubmit} disabled={submitting}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-[15px] font-medium text-primary-foreground hover:bg-brand-green-light transition-colors disabled:opacity-60">
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
        {step === 1 && (
          <Step1 price={price} monthly={monthly}
            setPrice={setPrice} setMonthly={setMonthly}
            onNext={() => setStep(2)} />
        )}
        {step === 2 && (
          <Step2 price={price} monthly={monthly}
            initSaved={savedSoFar} initHousing={housingCost}
            onNext={(sf, hc) => { setSavedSoFar(sf); setHousingCost(hc); setStep(3) }}
            onBack={() => setStep(1)} />
        )}
        {step === 3 && (
          <Step3 price={price}
            monthsToStart={Math.max(0, (Math.round(price * 0.01) - savedSoFar) / monthly)}
            onNext={() => setStep(4)} onBack={() => setStep(2)} />
        )}
        {step === 4 && (
          <Step4 price={price} monthly={monthly} housingCost={housingCost} onBack={() => setStep(3)} />
        )}
      </main>
    </div>
  )
}
