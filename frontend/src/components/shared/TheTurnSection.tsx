import { useState } from 'react'
import { Link } from 'react-router-dom'
import * as Popover from '@radix-ui/react-popover'
import { track } from '@/lib/analytics'

const GROWTH = 0.05
const DEPOSIT_PCT = 0.10
const YEARS = 10

const VW = 720, VH = 380
const ML = 58, MR = 74, MT = 18, MB = 40
const PW = VW - ML - MR
const PH = VH - MT - MB

function depositAt(price: number, t: number) {
  return DEPOSIT_PCT * price * Math.pow(1 + GROWTH, t)
}
function savingsAt(monthly: number, t: number) {
  return monthly * 12 * t
}
function findCrossing(price: number, monthly: number): number | null {
  let prev = savingsAt(monthly, 0) - depositAt(price, 0)
  for (let t = 0.02; t <= YEARS + 1e-4; t += 0.02) {
    const d = savingsAt(monthly, t) - depositAt(price, t)
    if (prev < 0 && d >= 0) {
      const frac = (0 - prev) / (d - prev)
      return (t - 0.02) + 0.02 * frac
    }
    prev = d
  }
  return null
}
function fmtEuro(n: number) {
  return '€' + Math.round(n).toLocaleString('en-IE')
}
function fmtEuroK(n: number) {
  return '€' + Math.round(n / 1000) + 'k'
}
function yearsLabel(t: number) {
  const r = Math.round(t * 10) / 10
  return r + (r === 1 ? ' year' : ' years')
}

const DISPLAY: React.CSSProperties = { fontFamily: "'Fraunces', Georgia, serif" }

const GROWTH_NOTE = `The 5% annual appreciation assumption is benchmarked against the CSO Residential Property Price Index, the official measure of Irish residential property price trends. Over the five complete years from 2021 to 2025, national residential property prices increased at an average annual rate of approximately 8.5%, based on CSO December year-on-year RPPI releases. The model applies a more conservative long-term assumption of 5.0% p.a.`

function GrowthNotePopover() {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="underline underline-offset-2 decoration-primary-foreground/30 hover:decoration-primary-foreground/60 transition-colors cursor-pointer bg-transparent"
        >
          Assumes 5% yearly price growth.
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="center"
          avoidCollisions
          collisionPadding={16}
          className="w-80 rounded-lg bg-card px-4 py-3 text-xs text-foreground shadow-lg leading-relaxed z-50 animate-in fade-in-0 zoom-in-95"
        >
          <p>{GROWTH_NOTE}</p>
          <a
            href="https://www.cso.ie/en/statistics/prices/residentialpropertypricesindex/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-brand-green underline underline-offset-2 hover:text-brand-green-light transition-colors"
          >
            CSO Residential Property Price Index →
          </a>
          <Popover.Arrow className="fill-card" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

let interactionFired = false

export function TheTurnSection({ calcUrl }: { calcUrl: string }) {
  const [price, setPrice] = useState(580000)
  const [monthly, setMonthly] = useState(1000)

  const maxVal = Math.max(depositAt(price, YEARS), savingsAt(monthly, YEARS))
  const niceMax = Math.max(10000, Math.ceil(maxVal * 1.05 / 10000) * 10000)

  const xPix = (t: number) => ML + (t / YEARS) * PW
  const yPix = (v: number) => MT + PH - (v / niceMax) * PH

  const depositPts = Array.from({ length: 51 }, (_, i) => {
    const t = (i / 50) * YEARS
    return `${xPix(t).toFixed(1)},${yPix(depositAt(price, t)).toFixed(1)}`
  }).join(' ')

  const savingsEndY = Math.max(yPix(savingsAt(monthly, YEARS)), MT)
  const crossing = findCrossing(price, monthly)

  const gridLines = [0, 1, 2, 3, 4].map(i => ({
    v: (niceMax * i) / 4,
    y: yPix((niceMax * i) / 4),
  }))

  let crossingMark: React.ReactNode = null
  let captionNode: React.ReactNode = null

  if (crossing !== null) {
    const vc = depositAt(price, crossing)
    const xc = xPix(crossing)
    const yc = yPix(vc)
    const bw = 160, bh = 46
    let bx = xc + 12
    if (bx + bw > ML + PW) bx = xc - 12 - bw
    let by = yc - bh - 10
    if (by < MT) by = yc + 12

    crossingMark = (
      <>
        <line stroke="rgba(18,58,40,0.22)" strokeWidth="1" strokeDasharray="3 3"
          x1={xc.toFixed(1)} y1={MT} x2={xc.toFixed(1)} y2={(MT + PH)} />
        <circle fill="#123A28" cx={xc.toFixed(1)} cy={yc.toFixed(1)} r="4.5" />
        <rect fill="#FAF6F0" stroke="rgba(18,58,40,0.14)" strokeWidth="1"
          x={bx.toFixed(1)} y={by.toFixed(1)} width={bw} height={bh} rx="7" />
        <text fontFamily="Montserrat,sans-serif" fontSize="12.5" fill="#101211"
          x={bx + 14} y={by + 20}>{yearsLabel(crossing)} to catch it</text>
        <text fontFamily="Montserrat,sans-serif" fontSize="12.5" fill="#857861"
          x={bx + 14} y={by + 37}>at {fmtEuro(vc)}</text>
      </>
    )

    captionNode = (
      <p className="mt-5 text-[15px] text-brand-taupe leading-relaxed">
        You start <strong className="text-brand-ink font-semibold">{fmtEuro(price * DEPOSIT_PCT)}</strong> behind.
        {' '}You finally catch the deposit in{' '}
        <strong className="text-brand-ink font-semibold">{yearsLabel(crossing)}</strong>.
        {' '}By then it has climbed to{' '}
        <strong className="text-brand-ink font-semibold">{fmtEuro(vc)}</strong>.
      </p>
    )
  } else {
    captionNode = (
      <p className="mt-5 text-[15px] text-brand-taupe leading-relaxed">
        At <strong className="text-brand-ink font-semibold">{fmtEuro(monthly)}</strong> a month,
        {' '}you never catch the deposit within ten years. It rises faster than you save.
      </p>
    )
  }

  const pricePct = ((price - 250000) / (900000 - 250000) * 100).toFixed(1)
  const monthlyPct = ((monthly - 100) / (3000 - 100) * 100).toFixed(1)

  function handleChange(p: number, m: number) {
    if (!interactionFired) {
      interactionFired = true
      track('turn_interaction', { price: p, monthly: m })
    }
  }

  return (
    <>
      {/* ── Chart + sliders — light background ─────────────────────── */}
      <section className="border-b py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-brand-taupe mb-2.5">
            The Traditional Route
          </p>
          <h2
            className="text-[clamp(34px,6vw,52px)] leading-[1.02] tracking-tight text-brand-ink mb-8"
            style={{ ...DISPLAY, fontWeight: 340 }}
          >
            The deposit keeps moving.
          </h2>

          <svg
            viewBox={`0 0 ${VW} ${VH}`}
            className="w-full h-auto overflow-visible"
            role="img"
            aria-label="Chart comparing savings against the rising deposit required over ten years"
          >
            {gridLines.map(({ v, y }) => (
              <g key={v}>
                <line stroke="rgba(18,58,40,0.14)" strokeWidth="1"
                  x1={ML} y1={y.toFixed(1)} x2={ML + PW} y2={y.toFixed(1)} />
                <text fontFamily="Montserrat,sans-serif" fontSize="11" fill="#857861"
                  textAnchor="end" x={ML - 12} y={(y + 4).toFixed(1)}>
                  {fmtEuroK(v)}
                </text>
              </g>
            ))}

            {Array.from({ length: YEARS + 1 }, (_, k) => (
              <text key={k} fontFamily="Montserrat,sans-serif" fontSize="11" fill="#857861"
                textAnchor="middle" x={xPix(k).toFixed(1)} y={MT + PH + 24}>
                {k === 0 ? 'Now' : k}
              </text>
            ))}

            <line stroke="#857861" strokeWidth="2" strokeDasharray="5 5"
              x1={xPix(0).toFixed(1)} y1={yPix(0).toFixed(1)}
              x2={xPix(YEARS).toFixed(1)} y2={savingsEndY.toFixed(1)} />

            <polyline fill="none" stroke="#123A28" strokeWidth="2.5" points={depositPts} />

            <text fontFamily="Montserrat,sans-serif" fontSize="12" fontWeight="500" fill="#123A28"
              x={ML + PW + 8} y={(yPix(depositAt(price, YEARS)) + 4).toFixed(1)}>
              Deposit
            </text>
            <text fontFamily="Montserrat,sans-serif" fontSize="12" fontWeight="500" fill="#857861"
              x={ML + PW + 8} y={(savingsEndY + 4).toFixed(1)}>
              Saved
            </text>

            {crossingMark}
          </svg>

          {captionNode}

          <div className="mt-8 pt-6 border-t border-brand-cream">
            <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-brand-taupe mb-5">
              Dublin's average three-bed. Adjust for your own.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <div className="flex justify-between items-baseline mb-2.5">
                  <label htmlFor="turn-price" className="text-[11px] tracking-[0.09em] uppercase text-brand-taupe">
                    Target price
                  </label>
                  <span className="text-sm font-semibold text-brand-green tabular-nums">{fmtEuro(price)}</span>
                </div>
                <input
                  id="turn-price" type="range" min={250000} max={900000} step={10000} value={price}
                  className="slider-range"
                  style={{ '--pct': `${pricePct}%` } as React.CSSProperties}
                  onChange={e => {
                    const v = Number(e.target.value)
                    setPrice(v)
                    handleChange(v, monthly)
                  }}
                />
              </div>
              <div>
                <div className="flex justify-between items-baseline mb-2.5">
                  <label htmlFor="turn-monthly" className="text-[11px] tracking-[0.09em] uppercase text-brand-taupe">
                    Saving / month
                  </label>
                  <span className="text-sm font-semibold text-brand-green tabular-nums">{fmtEuro(monthly)}</span>
                </div>
                <input
                  id="turn-monthly" type="range" min={100} max={3000} step={50} value={monthly}
                  className="slider-range"
                  style={{ '--pct': `${monthlyPct}%` } as React.CSSProperties}
                  onChange={e => {
                    const v = Number(e.target.value)
                    setMonthly(v)
                    handleChange(price, v)
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pivot — dark green, full section ───────────────────────── */}
      <section className="bg-primary py-24 md:py-32">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-primary-foreground/50 mb-4">
            The Homeown pathway
          </p>
          <h2
            className="text-[clamp(34px,6vw,56px)] leading-[1.08] tracking-tight text-primary-foreground"
            style={{ ...DISPLAY, fontWeight: 340 }}
          >
            Stop chasing the deposit.
          </h2>
          <p className="text-base text-primary-foreground/70 mt-5 max-w-[44ch] mx-auto leading-relaxed">
            Choose the home. Fix the price. Follow a clear pathway to buying it through a standard mortgage.
          </p>
          <div className="mt-10">
            <Link
              to={calcUrl}
              onClick={() => track('turn_cta_click', { price, monthly })}
              className="inline-flex items-center justify-center rounded-lg bg-primary-foreground px-8 py-3.5 text-[15px] font-medium text-primary hover:bg-primary-foreground/90 transition-colors"
            >
              See your numbers
            </Link>
            <p className="mt-3 text-sm text-primary-foreground/50">Two minutes. No account required.</p>
          </div>
          <p className="mt-12 text-xs text-primary-foreground/40 leading-relaxed max-w-[520px] mx-auto">
            Illustrative only.{' '}
            <GrowthNotePopover />{' '}
            The entry stake is not a deposit and the purchase right is contractual, not guaranteed.
          </p>
        </div>
      </section>
    </>
  )
}
