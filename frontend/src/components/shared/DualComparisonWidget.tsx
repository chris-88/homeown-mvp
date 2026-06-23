import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'

const MONTHLY_SAVING = 500

function fmt(n: number) {
  return '€' + Math.round(n).toLocaleString('en-IE')
}

function ghiToProperty(ghi: number): number {
  return Math.max(200000, Math.min(800000, Math.floor((ghi * 4) / 0.9 / 5000) * 5000))
}

function timeToSave(price: number): string {
  const totalMonths = Math.ceil((price * 0.10) / MONTHLY_SAVING)
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  if (months === 0) return `${years} years`
  if (years === 0) return `${months} months`
  return `${years} years, ${months} months`
}

export function DualComparisonWidget({ showCta = true }: { showCta?: boolean }) {
  const [ghi, setGhi] = useState(90000)
  const [showTooltip, setShowTooltip] = useState(false)

  const price       = ghiToProperty(ghi)
  const entryStake  = Math.round(price * 0.01)
  const deposit     = Math.round(price * 0.10)
  const monthlyFee  = Math.round((price * 0.082) / 12)
  const optionPrice = Math.round(price * 0.90)

  const rows = [
    { label: 'Upfront to start',   hw: `Entry Stake ${fmt(entryStake)}`,     trad: `Deposit ${fmt(deposit)}` },
    { label: 'Time to move in',    hw: '3–6 months',                          trad: timeToSave(price) },
    { label: 'Monthly commitment', hw: `${fmt(monthlyFee)} service fee`,      trad: `${fmt(MONTHLY_SAVING)}/mo saving` },
    { label: 'You buy at',         hw: `${fmt(optionPrice)} (fixed today)`,   trad: 'Market price at the time' },
  ]

  return (
    <div>
      {/* GHI slider */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <label className="text-sm font-medium">Gross household income</label>
            <span className="relative">
              <Info
                className="h-3.5 w-3.5 text-muted-foreground/50 cursor-pointer"
                onClick={() => setShowTooltip(v => !v)}
              />
              {showTooltip && (
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 rounded-md bg-foreground px-3 py-2 text-xs text-background shadow-md z-50 block">
                  Combined pre-tax income of all buyers
                </span>
              )}
            </span>
          </div>
          <span className="text-base font-semibold tabular-nums">{fmt(ghi)}</span>
        </div>
        <input
          type="range"
          min={25000} max={200000} step={1000}
          value={ghi}
          onChange={e => setGhi(Number(e.target.value))}
          className="w-full accent-primary"
          style={{ minHeight: '44px', cursor: 'pointer' }}
        />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>€25,000</span>
          <span>€200,000</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        Target property: <span className="font-medium tabular-nums">{fmt(price)}</span>
      </p>

      {/* Comparison table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left" />
              <th className="px-4 py-3 text-center text-xs font-semibold tracking-widest text-white uppercase bg-primary">
                With Homeown
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Traditional
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ label, hw, trad }) => (
              <tr key={label} className="border-t">
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{label}</td>
                <td className="px-4 py-3 font-semibold text-center tabular-nums">{hw}</td>
                <td className="px-4 py-3 font-normal text-center tabular-nums text-muted-foreground">{trad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
        Figures are illustrative. Traditional deposit timeline assumes {fmt(MONTHLY_SAVING)} per month net saving. Individual circumstances will vary.
      </p>

      {showCta && (
        <Button asChild className="mt-4 w-full sm:w-auto">
          <Link to="/calc">Check your full numbers</Link>
        </Button>
      )}
    </div>
  )
}
