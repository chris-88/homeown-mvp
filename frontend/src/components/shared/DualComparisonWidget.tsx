import { useState } from 'react'
import { Link } from 'react-router-dom'
import { track, buildCalcUrl } from '@/lib/analytics'

let widgetInteractionFired = false

function fmt(n: number): string {
  if (n >= 10000) return `€${Math.round(n / 1000)}k`
  return `€${Math.round(n).toLocaleString('en-IE')}`
}

function fmtTimeline(yearsToSave: { years: number; months: number } | null): string {
  if (!yearsToSave) return 'Deposit never closes at this saving rate'
  const { years, months } = yearsToSave
  if (months === 0) return `${years} year${years !== 1 ? 's' : ''}`
  return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`
}

export function DualComparisonWidget({
  showCta = true,
  onCtaClick,
}: {
  showCta?: boolean
  onCtaClick?: (state: { propertyPrice: number; housingCost: number; depositSaving: number }) => void
}) {
  const [propertyPrice, setPropertyPrice] = useState(400000)
  const [housingCost, setHousingCost] = useState(1800)
  const [depositSaving, setDepositSaving] = useState(500)

  const domiter            = Math.round((propertyPrice * 0.082) / 12)
  const entryStake         = propertyPrice * 0.01
  const strikePrice        = propertyPrice * 0.90
  const traditionalDeposit = propertyPrice * 0.10
  const currentCombined    = housingCost + depositSaving
  const monthlyGap         = currentCombined - domiter

  const monthsToSave = depositSaving > 0
    ? Math.ceil(traditionalDeposit / depositSaving)
    : null
  const yearsToSave = monthsToSave !== null
    ? { years: Math.floor(monthsToSave / 12), months: monthsToSave % 12 }
    : null
  const tradBuyPrice = monthsToSave !== null
    ? Math.round(propertyPrice * Math.pow(1.05, monthsToSave / 12))
    : null

  function fireInteraction(pp: number, hc: number, ds: number) {
    if (!widgetInteractionFired) {
      widgetInteractionFired = true
      track('widget_interaction', { property_price: pp, housing_cost: hc, deposit_saving: ds })
    }
  }

  const calcUrl = buildCalcUrl()

  return (
    <div>
      {/* Sliders */}
      <div className="mb-5 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium">Property price</label>
            <span className="text-base font-semibold tabular-nums">{fmt(propertyPrice)}</span>
          </div>
          <input
            type="range" min={200000} max={800000} step={5000}
            value={propertyPrice}
            onChange={e => {
              const v = Number(e.target.value)
              setPropertyPrice(v)
              fireInteraction(v, housingCost, depositSaving)
            }}
            className="w-full accent-primary"
            style={{ minHeight: '44px', cursor: 'pointer' }}
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>€200k</span><span>€800k</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium">Current monthly housing cost</label>
            <span className="text-base font-semibold tabular-nums">{fmt(housingCost)}</span>
          </div>
          <input
            type="range" min={500} max={5000} step={50}
            value={housingCost}
            onChange={e => {
              const v = Number(e.target.value)
              setHousingCost(v)
              fireInteraction(propertyPrice, v, depositSaving)
            }}
            className="w-full accent-primary"
            style={{ minHeight: '44px', cursor: 'pointer' }}
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>€500</span><span>€5,000</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium">Monthly amount toward your deposit</label>
            <span className="text-base font-semibold tabular-nums">{fmt(depositSaving)}</span>
          </div>
          <input
            type="range" min={0} max={2000} step={50}
            value={depositSaving}
            onChange={e => {
              const v = Number(e.target.value)
              setDepositSaving(v)
              fireInteraction(propertyPrice, housingCost, v)
            }}
            className="w-full accent-primary"
            style={{ minHeight: '44px', cursor: 'pointer' }}
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>€0</span><span>€2,000</span>
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <div className="w-full border border-brand-cream rounded-lg overflow-hidden bg-white">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-[26%]" />
            <col className="w-[37%]" />
            <col className="w-[37%]" />
          </colgroup>
          <thead>
            <tr>
              <th className="px-3 py-3" />
              <th className="px-3 py-3 text-center text-xs font-semibold tracking-widest text-white uppercase bg-brand-green">
                Homeown
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold tracking-widest text-brand-taupe uppercase">
                Traditional Route
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Row 1 — Monthly */}
            <tr className="border-t border-brand-cream">
              <td className="px-3 py-4 text-sm text-brand-taupe">Monthly</td>
              <td className="px-3 py-4 text-center font-semibold text-brand-ink">
                {fmt(domiter)}/mo
                <span className="block text-xs text-brand-taupe mt-0.5">monthly service fee</span>
              </td>
              <td className="px-3 py-4 text-center text-brand-ink">
                {fmt(currentCombined)}/mo
                <span className="block text-xs text-brand-taupe mt-0.5">housing cost + deposit saving</span>
              </td>
            </tr>
            {monthlyGap !== 0 && (
              <tr className="border-t border-brand-cream">
                <td colSpan={3} className={`px-3 py-2 text-xs ${monthlyGap > 0 ? 'text-brand-green' : 'text-brand-taupe'}`}>
                  {monthlyGap > 0
                    ? `${fmt(monthlyGap)} less per month with Homeown.`
                    : `${fmt(Math.abs(monthlyGap))} more per month — for a property at a price locked today.`}
                </td>
              </tr>
            )}

            {/* Row 2 — To get started */}
            <tr className="border-t border-brand-cream">
              <td className="px-3 py-4 text-sm text-brand-taupe">To get started</td>
              <td className="px-3 py-4 text-center font-semibold text-brand-ink">
                {fmt(entryStake)}
                <span className="block text-xs text-brand-taupe mt-0.5">Entry Stake</span>
              </td>
              <td className="px-3 py-4 text-center text-brand-ink">
                {fmt(traditionalDeposit)}
                <span className="block text-xs text-brand-taupe mt-0.5">deposit required</span>
              </td>
            </tr>

            {/* Row 3 — When you move in */}
            <tr className="border-t border-brand-cream">
              <td className="px-3 py-4 text-sm text-brand-taupe">When you move in</td>
              <td className="px-3 py-4 text-center font-semibold text-brand-ink">
                This year
              </td>
              <td className="px-3 py-4 text-center text-brand-ink">
                {fmtTimeline(yearsToSave)}
                {yearsToSave && (
                  <span className="block text-xs text-brand-taupe mt-0.5">to save the deposit</span>
                )}
              </td>
            </tr>

            {/* Row 4 — You buy at */}
            <tr className="border-t border-brand-cream">
              <td className="px-3 py-4 text-sm text-brand-taupe">You buy at</td>
              <td className="px-3 py-4 text-center font-semibold text-brand-ink">
                {fmt(strikePrice)}
                <span className="block text-xs text-brand-taupe mt-0.5">fixed from day one</span>
              </td>
              <td className="px-3 py-4 text-center text-brand-ink">
                {tradBuyPrice !== null ? fmt(tradBuyPrice) : 'Rising market price'}
                <span className="block text-xs text-brand-taupe mt-0.5">
                  {tradBuyPrice !== null && yearsToSave
                    ? `market price in ${yearsToSave.years} yr${yearsToSave.years !== 1 ? 's' : ''} (5% appreciation assumed)`
                    : 'no fixed purchase date'}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
        Figures are illustrative and based on Homeown's current programme parameters. Assumes 5% annual property appreciation on the traditional route. Individual circumstances will vary. The monthly service fee is not rent. The Entry Stake is not a deposit.
      </p>

      {showCta && (
        <div className="mt-4">
          <Link
            to={calcUrl}
            onClick={() => onCtaClick?.({ propertyPrice, housingCost, depositSaving })}
            className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Check your full numbers →
          </Link>
          <p className="mt-2 text-xs text-muted-foreground">Two minutes. No account required.</p>
        </div>
      )}
    </div>
  )
}
