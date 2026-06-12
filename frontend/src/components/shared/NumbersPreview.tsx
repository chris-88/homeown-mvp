import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

function fmt(n: number) {
  return '€' + Math.round(n).toLocaleString('en-IE')
}

interface NumbersPreviewProps {
  defaultPrice?: number
}

export function NumbersPreview({ defaultPrice = 350000 }: NumbersPreviewProps) {
  const [price, setPrice] = useState(defaultPrice)

  const domiter = (price * 0.082) / 12
  const entryStake = price * 0.01
  const optionPrice = price * 0.90

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      {/* Slider */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium">Property price</label>
          <span className="text-lg font-bold">{fmt(price)}</span>
        </div>
        <input
          type="range"
          min={200000}
          max={800000}
          step={5000}
          value={price}
          onChange={e => setPrice(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>€200k</span>
          <span>€800k</span>
        </div>
      </div>

      {/* Numbers */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-background p-4">
          <p className="text-xs text-muted-foreground">Monthly service fee</p>
          <p className="mt-1 text-2xl font-bold">{fmt(domiter)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Per month, for 60 months</p>
        </div>
        <div className="rounded-lg border bg-background p-4">
          <p className="text-xs text-muted-foreground">Entry Stake</p>
          <p className="mt-1 text-2xl font-bold">{fmt(entryStake)}</p>
          <p className="mt-1 text-xs text-muted-foreground">1% — paid once at the start</p>
        </div>
        <div className="rounded-lg border bg-background p-4">
          <p className="text-xs text-muted-foreground">Purchase option price</p>
          <p className="mt-1 text-2xl font-bold">{fmt(optionPrice)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Fixed from day one (10% below acquisition price)</p>
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        These figures are illustrative. See the{' '}
        <Link to="/calc" className="underline underline-offset-2 hover:text-foreground">full calculator</Link>{' '}
        for your programme fit assessment.
      </p>

      <Button asChild className="mt-4 w-full sm:w-auto">
        <Link to="/calc">Check your full numbers</Link>
      </Button>
    </div>
  )
}
