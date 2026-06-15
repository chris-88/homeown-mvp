import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

function fmt(n: number) {
  return '€' + Math.round(n).toLocaleString('en-IE')
}

function yearsToSave(price: number, monthlySaving: number): string {
  const depositRequired = price * 0.10
  const totalMonths = Math.ceil(depositRequired / monthlySaving)
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  if (months === 0) return `${years} years`
  if (years === 0) return `${months} months`
  return `${years} years, ${months} months`
}

export function DualComparisonWidget() {
  const [price, setPrice] = useState(400000)
  const [monthlySaving, setMonthlySaving] = useState(350)

  const monthlyFee = (price * 0.082) / 12
  const entryStake = price * 0.01
  const optionPrice = price * 0.90
  const depositRequired = price * 0.10

  return (
    <div>
      {/* Slider */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="property-price" className="text-sm font-medium">
            Property price
          </label>
          <span className="text-base font-semibold tabular-nums">{fmt(price)}</span>
        </div>
        <input
          id="property-price"
          type="range"
          min={200000}
          max={800000}
          step={5000}
          value={price}
          onChange={e => setPrice(Number(e.target.value))}
          className="w-full accent-primary"
          style={{ minHeight: '44px', cursor: 'pointer' }}
        />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>€200,000</span>
          <span>€800,000</span>
        </div>
      </div>

      {/* Panels */}
      <div className="grid gap-4 sm:grid-cols-2">

        {/* Left: With Homeown */}
        <div className="rounded-xl border border-t-0 bg-card overflow-hidden">
          <div className="h-0.5 bg-primary w-full" />
          <div className="p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-5">
              With Homeown
            </p>
            <div className="space-y-5">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Monthly service fee</p>
                <p className="text-3xl font-semibold tabular-nums">{fmt(monthlyFee)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">per month</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Entry Stake</p>
                <p className="text-3xl font-semibold tabular-nums">{fmt(entryStake)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">paid once</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Option price</p>
                <p className="text-3xl font-semibold tabular-nums">{fmt(optionPrice)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">fixed</p>
              </div>
            </div>
            <p className="mt-6 text-sm font-medium text-brand-green">
              You could move in this year.
            </p>
          </div>
        </div>

        {/* Right: Traditional Route */}
        <div className="rounded-xl bg-muted/60 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-5">
            Traditional Route
          </p>
          <div className="space-y-5">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Deposit required</p>
              <p className="text-3xl font-semibold tabular-nums">{fmt(depositRequired)}</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="monthly-saving" className="text-xs text-muted-foreground">
                  Monthly saving
                </label>
                <span className="text-xs font-semibold tabular-nums">{fmt(monthlySaving)}</span>
              </div>
              <input
                id="monthly-saving"
                type="range"
                min={50}
                max={1500}
                step={50}
                value={monthlySaving}
                onChange={e => setMonthlySaving(Number(e.target.value))}
                className="w-full accent-primary"
                style={{ minHeight: '44px', cursor: 'pointer' }}
              />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>€50</span>
                <span>€1,500</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Years to save</p>
              <p className="text-3xl font-semibold tabular-nums">{yearsToSave(price, monthlySaving)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Below panels */}
      <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
        Figures are illustrative and based on Homeown's current programme parameters. The traditional deposit saving estimate uses your selected monthly saving of {fmt(monthlySaving)}. Individual circumstances will vary.
      </p>
      <Button asChild className="mt-4 w-full sm:w-auto">
        <Link to="/calc">Check your full numbers</Link>
      </Button>
    </div>
  )
}
