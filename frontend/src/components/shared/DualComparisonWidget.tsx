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
  if (months === 0) return `${years} yrs`
  if (years === 0) return `${months} mo`
  return `${years} yrs, ${months} mo`
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
    { label: 'Upfront',   hw: `Entry Stake\n${fmt(entryStake)}`,   trad: `Deposit\n${fmt(deposit)}` },
    { label: 'Move in',   hw: '3–6 months',                         trad: timeToSave(price) },
    { label: 'Monthly',   hw: `${fmt(monthlyFee)}\nservice fee`,    trad: `${fmt(MONTHLY_SAVING)}/mo\nsaving` },
    { label: 'Buy price', hw: `${fmt(optionPrice)}\nfixed today`,   trad: 'Market price\nat the time' },
  ]

  return (
    <div>
      {/* GHI slider */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2 gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <label className="text-sm font-medium truncate">Gross household income</label>
            <span className="relative shrink-0">
              <Info
                className="h-3.5 w-3.5 text-muted-foreground/50 cursor-pointer"
                onClick={() => setShowTooltip(v => !v)}
              />
              {showTooltip && (
                <span className="absolute bottom-full left-0 mb-2 w-52 rounded-md bg-foreground px-3 py-2 text-xs text-background shadow-md z-50 block">
                  Combined pre-tax income of all buyers
                </span>
              )}
            </span>
          </div>
          <span className="text-base font-semibold tabular-nums shrink-0">{fmt(ghi)}</span>
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
          <span>€25k</span>
          <span>€200k</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        Target property: <span className="font-medium tabular-nums">{fmt(price)}</span>
      </p>

      {/* Comparison table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full table-fixed text-xs">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[39%]" />
            <col className="w-[39%]" />
          </colgroup>
          <thead>
            <tr>
              <th className="px-2 py-2.5 text-left" />
              <th className="px-2 py-2.5 text-center font-semibold tracking-widest text-white uppercase bg-primary">
                Homeown
              </th>
              <th className="px-2 py-2.5 text-center font-semibold tracking-widest text-muted-foreground uppercase">
                Traditional
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ label, hw, trad }) => (
              <tr key={label} className="border-t">
                <td className="px-2 py-3 text-muted-foreground leading-tight">{label}</td>
                <td className="px-2 py-3 font-semibold text-center whitespace-pre-line leading-snug">{hw}</td>
                <td className="px-2 py-3 font-normal text-center text-muted-foreground whitespace-pre-line leading-snug">{trad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
        Figures are illustrative. Traditional timeline assumes {fmt(MONTHLY_SAVING)}/mo net saving. Individual circumstances will vary.
      </p>

      {showCta && (
        <div className="mt-4">
          <Button asChild className="w-full sm:w-auto">
            <Link to="/calc">Check your full numbers</Link>
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">Two minutes. No account required.</p>
        </div>
      )}
    </div>
  )
}
