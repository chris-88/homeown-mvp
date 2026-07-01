import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { PublicNav } from '@/components/shared/PublicNav'
import { track } from '@/lib/analytics'

// ── Business constants ─────────────────────────────────────────
const GROWTH      = 0.05
const FEE_RATE    = 0.082
const STAKE_PCT   = 0.01
const DEPOSIT_PCT = 0.10
const DISCOUNT    = 0.10

// ── Chart layout ───────────────────────────────────────────────
const VW = 600, VH = 240
const ML = 52, MR = 56, MT = 16, MB = 32
const PW = VW - ML - MR   // 492
const PH = VH - MT - MB   // 192

// ── Types ──────────────────────────────────────────────────────
type Camera = {
  mode: 'dep' | 'eq'
  xMax: number
  yMin: number
  yMax: number
  reqPct: number
  reqGrowth: number
}

type ChartData = {
  price: number
  monthly: number
  saved: number
}

// ── Math ───────────────────────────────────────────────────────
const serviceFee  = (p: number) => Math.round(p * FEE_RATE / 12)
const strike      = (p: number) => Math.round(p * (1 - DISCOUNT))
const valueAtExit = (p: number) => Math.round(p * Math.pow(1 + GROWTH, 5))
const entryStake  = (p: number) => Math.round(p * STAKE_PCT)

// ── Format ─────────────────────────────────────────────────────
function fmt(n: number) {
  return '€' + Math.round(n).toLocaleString('en-IE')
}
function fmtK(n: number) {
  const r = Math.round(n)
  if (r >= 1_000_000) return '€' + (r / 1_000_000).toFixed(2) + 'm'
  return '€' + Math.round(r / 1000) + 'k'
}

// ── Camera per step ────────────────────────────────────────────
function cameraForStep(step: 1 | 2 | 3, d: ChartData): Camera {
  if (step === 1) {
    const dep10 = d.price * DEPOSIT_PCT * Math.pow(1 + GROWTH, 10)
    const sav10 = d.monthly * 12 * 10
    const yMax  = Math.ceil(Math.max(dep10, sav10) * 1.18 / 10_000) * 10_000
    return { mode: 'dep', xMax: 10, yMin: 0, yMax, reqPct: DEPOSIT_PCT, reqGrowth: GROWTH }
  }
  if (step === 2) {
    const stake = entryStake(d.price)
    const proj  = d.saved + d.monthly * 12 * 1.5
    const yMax  = Math.ceil(Math.max(stake * 1.9, proj * 1.25) / 1000) * 1000
    return { mode: 'dep', xMax: 1.5, yMin: 0, yMax, reqPct: STAKE_PCT, reqGrowth: 0 }
  }
  const s  = strike(d.price)
  const ve = valueAtExit(d.price)
  return { mode: 'eq', xMax: 5, yMin: s * 0.94, yMax: ve * 1.07, reqPct: 0, reqGrowth: 0 }
}

// ── Animation ──────────────────────────────────────────────────
function eioq(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function lerpCam(a: Camera, b: Camera, t: number): Camera {
  const e = eioq(t)
  return {
    mode:      b.mode,
    xMax:      a.xMax      + (b.xMax      - a.xMax)      * e,
    yMin:      a.yMin      + (b.yMin      - a.yMin)      * e,
    yMax:      a.yMax      + (b.yMax      - a.yMax)      * e,
    reqPct:    a.reqPct    + (b.reqPct    - a.reqPct)    * e,
    reqGrowth: a.reqGrowth + (b.reqGrowth - a.reqGrowth) * e,
  }
}

// ── SVG helpers ────────────────────────────────────────────────
const SVG_NS = 'http://www.w3.org/2000/svg'

function el(tag: string, attrs: Record<string, string | number>): SVGElement {
  const e = document.createElementNS(SVG_NS, tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v))
  return e
}

function txt(tag: string, attrs: Record<string, string | number>, content: string): SVGElement {
  const e = el(tag, attrs)
  e.textContent = content
  return e
}

const MONO = 'Montserrat,sans-serif'

// ── Chart renderer ─────────────────────────────────────────────
function drawChart(svg: SVGSVGElement, cam: Camera, d: ChartData): void {
  while (svg.lastChild) svg.removeChild(svg.lastChild)

  const xP = (t: number) => ML + (t / cam.xMax) * PW
  const yP = (v: number) => {
    const raw = MT + PH - ((v - cam.yMin) / (cam.yMax - cam.yMin)) * PH
    return Math.max(MT - 8, Math.min(MT + PH + 8, raw))
  }

  const pathD = (fn: (t: number) => number, xMax = cam.xMax, n = 80) =>
    Array.from({ length: n + 1 }, (_, i) => {
      const t = (i / n) * xMax
      return `${i === 0 ? 'M' : 'L'} ${xP(t).toFixed(1)} ${yP(fn(t)).toFixed(1)}`
    }).join(' ')

  // Y grid
  for (let i = 0; i <= 4; i++) {
    const v = cam.yMin + (cam.yMax - cam.yMin) * i / 4
    const y = yP(v)
    svg.appendChild(el('line', {
      x1: ML, y1: y.toFixed(1), x2: ML + PW, y2: y.toFixed(1),
      stroke: 'rgba(18,58,40,0.08)', 'stroke-width': 1,
    }))
    svg.appendChild(txt('text', {
      'font-family': MONO, 'font-size': 10, fill: '#857861',
      'text-anchor': 'end', x: ML - 6, y: (y + 3.5).toFixed(1),
    }, fmtK(v)))
  }

  // X axis labels
  const xLabels: [number, string][] =
    cam.mode === 'eq'
      ? [[0,'Now'],[1,'Yr 1'],[2,'Yr 2'],[3,'Yr 3'],[4,'Yr 4'],[5,'Yr 5']]
      : cam.xMax <= 2
      ? ([[0,'Now'],[0.25,'3mo'],[0.5,'6mo'],[0.75,'9mo'],[1,'1yr'],[1.25,'15mo'],[1.5,'18mo']] as [number,string][])
          .filter(([t]) => t <= cam.xMax + 0.01)
      : [[0,'Now'],[2,'2yr'],[4,'4yr'],[6,'6yr'],[8,'8yr'],[10,'10yr']]

  xLabels.forEach(([t, label]) => {
    svg.appendChild(txt('text', {
      'font-family': MONO, 'font-size': 10, fill: '#857861',
      'text-anchor': 'middle', x: xP(t).toFixed(1), y: MT + PH + 22,
    }, label))
  })

  if (cam.mode === 'dep') {
    const isEntry    = Math.abs(cam.reqPct - STAKE_PCT) < 0.001
    const targetFn   = (t: number) => d.price * cam.reqPct * Math.pow(1 + cam.reqGrowth, t)
    const initSaved  = isEntry ? d.saved : 0
    const savingsFn  = (t: number) => initSaved + d.monthly * 12 * t

    // Taupe dashed savings line (under green line)
    svg.appendChild(el('path', {
      d: pathD(savingsFn), fill: 'none',
      stroke: '#857861', 'stroke-width': 2, 'stroke-dasharray': '5 4',
    }))
    // Green solid target line
    svg.appendChild(el('path', {
      d: pathD(targetFn), fill: 'none',
      stroke: '#123A28', 'stroke-width': 2.5,
    }))

    // Right-edge labels
    const rX  = ML + PW + 7
    const l1y = yP(targetFn(cam.xMax))
    const l2y = yP(Math.min(savingsFn(cam.xMax), cam.yMax * 0.97))
    svg.appendChild(txt('text', {
      'font-family': MONO, 'font-size': 11, 'font-weight': 500,
      fill: '#123A28', x: rX, y: (l1y + 4).toFixed(1),
    }, isEntry ? 'Entry' : 'Deposit'))
    svg.appendChild(txt('text', {
      'font-family': MONO, 'font-size': 11, 'font-weight': 500,
      fill: '#857861', x: rX, y: (l2y + 4).toFixed(1),
    }, 'Saved'))

    // Crossing point
    let crossT: number | null = null
    let prevD = savingsFn(0) - targetFn(0)
    for (let i = 1; i <= 400; i++) {
      const t  = (i / 400) * cam.xMax
      const t0 = ((i - 1) / 400) * cam.xMax
      const dv = savingsFn(t) - targetFn(t)
      if (prevD < 0 && dv >= 0) {
        crossT = t0 + (t - t0) * (-prevD / (dv - prevD))
        break
      }
      prevD = dv
    }

    if (crossT !== null && crossT > 0 && crossT <= cam.xMax) {
      const xc = xP(crossT), yc = yP(targetFn(crossT))
      svg.appendChild(el('line', {
        x1: xc.toFixed(1), y1: MT, x2: xc.toFixed(1), y2: MT + PH,
        stroke: 'rgba(18,58,40,0.20)', 'stroke-width': 1, 'stroke-dasharray': '3 3',
      }))
      svg.appendChild(el('circle', { cx: xc.toFixed(1), cy: yc.toFixed(1), r: 4.5, fill: '#123A28' }))

      const bw = 148, bh = 44
      let bx = xc + 10; if (bx + bw > ML + PW) bx = xc - 10 - bw
      let by = yc - bh - 10; if (by < MT) by = yc + 10
      svg.appendChild(el('rect', {
        x: bx.toFixed(1), y: by.toFixed(1), width: bw, height: bh,
        rx: 6, fill: '#FAF6F0', stroke: 'rgba(18,58,40,0.14)', 'stroke-width': 1,
      }))

      if (cam.reqGrowth > 0) {
        const yrs = Math.round(crossT * 10) / 10
        svg.appendChild(txt('text', { 'font-family': MONO, 'font-size': 11.5, fill: '#101211', x: bx + 12, y: by + 18 }, `${yrs} yr${yrs !== 1 ? 's' : ''} to catch it`))
        svg.appendChild(txt('text', { 'font-family': MONO, 'font-size': 11.5, fill: '#857861', x: bx + 12, y: by + 34 }, `at ${fmt(targetFn(crossT))}`))
      } else {
        const months = Math.round(crossT * 12)
        svg.appendChild(txt('text', { 'font-family': MONO, 'font-size': 11.5, fill: '#101211', x: bx + 12, y: by + 18 }, `${months} month${months !== 1 ? 's' : ''}`))
        svg.appendChild(txt('text', { 'font-family': MONO, 'font-size': 11.5, fill: '#857861', x: bx + 12, y: by + 34 }, 'to get started'))
      }
    }

  } else {
    // Equity mode
    const s  = strike(d.price)
    const ve = valueAtExit(d.price)

    // Fill polygon between market value and strike
    const fillD = [
      `M ${xP(0).toFixed(1)} ${yP(s).toFixed(1)}`,
      ...Array.from({ length: 81 }, (_, i) => {
        const t = (i / 80) * 5
        return `L ${xP(t).toFixed(1)} ${yP(d.price * Math.pow(1 + GROWTH, t)).toFixed(1)}`
      }),
      `L ${xP(5).toFixed(1)} ${yP(s).toFixed(1)} Z`,
    ].join(' ')
    svg.appendChild(el('path', { d: fillD, fill: 'rgba(18,58,40,0.08)' }))

    // Strike dashed line
    svg.appendChild(el('path', {
      d: `M ${xP(0).toFixed(1)} ${yP(s).toFixed(1)} L ${xP(5).toFixed(1)} ${yP(s).toFixed(1)}`,
      fill: 'none', stroke: '#857861', 'stroke-width': 2, 'stroke-dasharray': '5 4',
    }))

    // Market value line
    svg.appendChild(el('path', {
      d: pathD(t => d.price * Math.pow(1 + GROWTH, t), 5),
      fill: 'none', stroke: '#123A28', 'stroke-width': 2.5,
    }))

    // Right-edge value labels
    const rX     = ML + PW + 7
    const mktEndY = yP(ve)
    const strikeY = yP(s)
    svg.appendChild(txt('text', {
      'font-family': MONO, 'font-size': 11, 'font-weight': 500,
      fill: '#123A28', x: rX, y: (mktEndY + 4).toFixed(1),
    }, `~${fmtK(ve)}`))
    svg.appendChild(txt('text', {
      'font-family': MONO, 'font-size': 11, 'font-weight': 500,
      fill: '#857861', x: rX, y: (strikeY + 4).toFixed(1),
    }, fmtK(s)))

    // Equity label inside fill
    const midT    = 2.5
    const mktMidY = yP(d.price * Math.pow(1 + GROWTH, midT))
    const midFillY = (mktMidY + strikeY) / 2
    const equity  = ve - s
    svg.appendChild(txt('text', {
      'font-family': MONO, 'font-size': 13, 'font-weight': 600,
      fill: '#101211', 'text-anchor': 'middle',
      x: xP(midT).toFixed(1), y: (midFillY - 4).toFixed(1),
    }, `+${fmt(equity)}`))
    svg.appendChild(txt('text', {
      'font-family': MONO, 'font-size': 10, fill: 'rgba(18,58,40,0.50)',
      'text-anchor': 'middle', x: xP(midT).toFixed(1), y: (midFillY + 12).toFixed(1),
    }, 'growing equity'))
  }
}

// ── Slider ─────────────────────────────────────────────────────
function Slider({ label, value, display, min, max, step, onChange }: {
  label: string; value: number; display: string
  min: number; max: number; step: number; onChange: (v: number) => void
}) {
  const pct = `${Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))}%`
  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <label className="text-[11px] tracking-[0.09em] uppercase text-muted-foreground">{label}</label>
        <span className="text-sm font-semibold text-brand-green tabular-nums numeric">{display}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="slider-range"
        style={{ '--pct': pct } as React.CSSProperties}
      />
    </div>
  )
}

// ── Progress bars ──────────────────────────────────────────────
function ProgressBars({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex gap-1.5 mb-10">
      {([1, 2, 3] as const).map(s => (
        <div key={s} className="flex-1 h-[3px] rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: step >= s ? '100%' : '0%', background: step >= s ? 'var(--color-primary)' : 'transparent' }}
          />
        </div>
      ))}
    </div>
  )
}

// ── Fig card (step 3) ──────────────────────────────────────────
function FigCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <p className="text-[10px] font-semibold tracking-[0.10em] uppercase text-muted-foreground mb-1">{label}</p>
      <p className="text-xl font-bold tabular-nums numeric text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────
export default function Calc2Page() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const initPrice   = Math.max(250_000, Math.min(900_000, parseInt(searchParams.get('price') ?? '', 10) || 580_000))
  const initMonthly = Math.max(300, Math.min(3_000, parseInt(searchParams.get('save') ?? '', 10) || 1_000))

  const [step,    setStep]    = useState<1 | 2 | 3>(1)
  const [price,   setPrice]   = useState(initPrice)
  const [monthly, setMonthly] = useState(initMonthly)
  const [saved,   setSaved]   = useState(0)
  const [housing, setHousing] = useState(1_800)

  const svgRef    = useRef<SVGSVGElement>(null)
  const camRef    = useRef<Camera>(cameraForStep(1, { price: initPrice, monthly: initMonthly, saved: 0 }))
  const dataRef   = useRef<ChartData>({ price: initPrice, monthly: initMonthly, saved: 0 })
  const tweenRef  = useRef<number | null>(null)
  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  // Sync data + redraw on any slider change
  useEffect(() => {
    dataRef.current = { price, monthly, saved }
    // Update camera for current step (only when not mid-tween)
    if (tweenRef.current === null) {
      camRef.current = cameraForStep(step, dataRef.current)
    }
    if (svgRef.current) drawChart(svgRef.current, camRef.current, dataRef.current)
  }, [price, monthly, saved, step])

  useEffect(() => {
    track(`calc2_step${step}_view`, {})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  const tweenToStep = useCallback((target: 1 | 2 | 3) => {
    if (tweenRef.current !== null) cancelAnimationFrame(tweenRef.current)

    const fromCam = { ...camRef.current }
    const toCam   = cameraForStep(target, dataRef.current)
    const dur     = target === 3 ? 1000 : 950

    if (reducedMotion.current) {
      camRef.current = toCam
      if (svgRef.current) drawChart(svgRef.current, toCam, dataRef.current)
      return
    }

    const t0 = performance.now()
    const tick = (now: number) => {
      const t   = Math.min((now - t0) / dur, 1)
      const cam = lerpCam(fromCam, toCam, t)
      camRef.current = cam
      if (svgRef.current) drawChart(svgRef.current, cam, dataRef.current)
      if (t < 1) tweenRef.current = requestAnimationFrame(tick)
      else tweenRef.current = null
    }
    tweenRef.current = requestAnimationFrame(tick)
  }, [])

  function goNext() {
    const next = (step < 3 ? step + 1 : 3) as 1 | 2 | 3
    tweenToStep(next)
    setStep(next)
  }

  function goBack() {
    const prev = (step > 1 ? step - 1 : 1) as 1 | 2 | 3
    tweenToStep(prev)
    setStep(prev)
  }

  // Step 3 derived figures
  const fee    = serviceFee(price)
  const stake  = entryStake(price)
  const delta  = fee - housing
  const feeSub = delta <= 0 ? `${fmt(-delta)} less than now` : `vs ${fmt(housing)} now`
  const fitRead =
    housing >= fee
      ? 'On what you already spend, the monthly works.'
      : housing >= fee * 0.85
      ? 'The monthly is close to what you spend now, worth talking through.'
      : 'The monthly would be a stretch on what you spend now, and we would say so on the call.'

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main className="mx-auto max-w-[500px] px-6 py-12">
        <ProgressBars step={step} />

        {/* Persistent chart — never unmounts, redrawn via direct DOM manipulation */}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VW} ${VH}`}
          className="w-full h-auto mb-8 overflow-visible"
          role="img"
          aria-label="Pathway comparison chart"
        />

        {/* Step content — keyed for entrance animation */}
        <div key={step} className="animate-step-enter">

          {step === 1 && (
            <div>
              <h2
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                className="text-[clamp(28px,7vw,44px)] font-semibold leading-[1.08] tracking-tight mb-8"
              >
                The deposit keeps moving.
              </h2>
              <div className="space-y-6">
                <Slider
                  label="Target price" value={price} display={fmt(price)}
                  min={250_000} max={900_000} step={10_000} onChange={setPrice}
                />
                <Slider
                  label="Saving / month" value={monthly} display={fmt(monthly)}
                  min={300} max={3_000} step={50} onChange={setMonthly}
                />
              </div>
              <button
                onClick={goNext}
                className="mt-8 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-[15px] font-medium text-primary-foreground hover:bg-brand-green-light transition-[background-color,transform] active:scale-[0.97]"
              >
                See what Homeown changes <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                className="text-[clamp(28px,7vw,44px)] font-semibold leading-[1.08] tracking-tight mb-8"
              >
                A 1% entry stake.
              </h2>
              <div className="space-y-6">
                <Slider
                  label="Saved so far" value={saved} display={fmt(saved)}
                  min={0} max={40_000} step={500} onChange={setSaved}
                />
                <Slider
                  label="Housing cost / month" value={housing} display={fmt(housing)}
                  min={800} max={5_500} step={50} onChange={setHousing}
                />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Entry stake: <span className="font-semibold text-foreground">{fmt(stake)}</span>
              </p>
              <div className="mt-8 flex gap-3">
                <button
                  onClick={goBack}
                  className="inline-flex items-center gap-2 rounded-lg border px-5 py-3 text-sm font-medium hover:bg-accent transition-[background-color,transform] active:scale-[0.97]"
                >
                  <ArrowLeft className="h-4 w-4" />Back
                </button>
                <button
                  onClick={goNext}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-[15px] font-medium text-primary-foreground hover:bg-brand-green-light transition-[background-color,transform] active:scale-[0.97]"
                >
                  See it grow for you <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                className="text-[clamp(28px,7vw,44px)] font-semibold leading-[1.08] tracking-tight mb-6"
              >
                Appreciation working for you.
              </h2>
              <div className="grid grid-cols-3 gap-2 mb-6">
                <FigCard label="Entry stake" value={fmt(stake)} />
                <FigCard label="Monthly" value={fmt(fee)} sub={feeSub} />
                <FigCard label="Option price" value={fmt(strike(price))} />
              </div>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">{fitRead}</p>
              <div className="flex gap-3">
                <button
                  onClick={goBack}
                  className="inline-flex items-center gap-2 rounded-lg border px-5 py-3 text-sm font-medium hover:bg-accent transition-[background-color,transform] active:scale-[0.97]"
                >
                  <ArrowLeft className="h-4 w-4" />Back
                </button>
                <button
                  onClick={() => { track('calc2_book_call', { price }); navigate('/calc/save') }}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-[15px] font-medium text-primary-foreground hover:bg-brand-green-light transition-[background-color,transform] active:scale-[0.97]"
                >
                  Book a 20-minute call <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
