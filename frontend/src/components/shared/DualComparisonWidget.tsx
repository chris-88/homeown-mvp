import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Info } from 'lucide-react'
import * as Popover from '@radix-ui/react-popover'
import { track, buildCalcUrl } from '@/lib/analytics'

function InfoTip({ content }: { content: string }) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="text-brand-taupe/50 hover:text-brand-taupe transition-colors ml-1.5 align-middle inline-flex items-center"
          aria-label="More information"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          avoidCollisions
          collisionPadding={16}
          className="w-64 rounded-lg bg-foreground px-3 py-2.5 text-xs text-background shadow-lg leading-relaxed z-50 animate-in fade-in-0 zoom-in-95"
        >
          {content}
          <Popover.Arrow className="fill-foreground" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

let widgetInteractionFired = false

export let lastWidgetState = { propertyPrice: 400000, housingCost: 2200, depositSaving: 500 }

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

export function DualComparisonWidget({ showCta = true }: { showCta?: boolean }) {
  const [propertyPrice, setPropertyPrice] = useState(400000)
  const [housingCost, setHousingCost] = useState(2200)
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

  function updateState(pp: number, hc: number, ds: number) {
    lastWidgetState = { propertyPrice: pp, housingCost: hc, depositSaving: ds }
    if (!widgetInteractionFired) {
      widgetInteractionFired = true
      track('widget_interaction', { property_price: pp, housing_cost: hc, deposit_saving: ds })
    }
  }

  const calcUrl = buildCalcUrl()

  return (
    <div>
      {/* YOUR SITUATION card */}
      <div className="border border-brand-cream rounded-xl bg-white p-5 space-y-5">
        <p className="text-xs font-medium tracking-widest text-brand-taupe uppercase">Your current situation</p>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium flex items-center gap-0">
              Target Purchase Price
              <InfoTip content="The price of the property you want to buy. Homeown uses this to calculate your Entry Stake (1% of purchase price), your monthly service fee, and your fixed purchase option price (90% of purchase price)." />
            </label>
            <span className="text-sm font-semibold tabular-nums">{fmt(propertyPrice)}</span>
          </div>
          <input
            type="range" min={200000} max={800000} step={5000}
            value={propertyPrice}
            onChange={e => {
              const v = Number(e.target.value)
              setPropertyPrice(v)
              updateState(v, housingCost, depositSaving)
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
            <label className="text-sm font-medium flex items-center gap-0">
              Monthly housing (rent/other) cost
              <InfoTip content="What you currently pay each month for where you live — typically rent, but could be a mortgage payment or any other regular housing cost. We compare your total monthly outgoing (this plus your deposit saving) against the Homeown monthly service fee." />
            </label>
            <span className="text-sm font-semibold tabular-nums">{fmt(housingCost)}</span>
          </div>
          <input
            type="range" min={500} max={5000} step={50}
            value={housingCost}
            onChange={e => {
              const v = Number(e.target.value)
              setHousingCost(v)
              updateState(propertyPrice, v, depositSaving)
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
            <label className="text-sm font-medium flex items-center gap-0">
              Monthly deposit savings
              <InfoTip content="How much you're currently setting aside each month toward saving a traditional 10% deposit. Combined with your housing cost, this is your total monthly outgoing that we compare against the Homeown service fee." />
            </label>
            <span className="text-sm font-semibold tabular-nums">{fmt(depositSaving)}</span>
          </div>
          <input
            type="range" min={0} max={2000} step={50}
            value={depositSaving}
            onChange={e => {
              const v = Number(e.target.value)
              setDepositSaving(v)
              updateState(propertyPrice, housingCost, v)
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
      <div className="w-full border border-brand-cream rounded-xl overflow-hidden bg-white mt-4">
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
            {/* Row 1 — To get started */}
            <tr className="border-t border-brand-cream">
              <td className="px-3 py-4 text-sm text-brand-taupe align-top">To get started</td>
              <td className="px-3 py-4 text-center font-semibold text-brand-ink align-top">
                {fmt(entryStake)}
                <span className="block text-xs text-brand-taupe mt-0.5">Entry Stake</span>
              </td>
              <td className="px-3 py-4 text-center text-brand-ink align-top">
                {fmt(traditionalDeposit)}
                <span className="block text-xs text-brand-taupe mt-0.5">deposit required</span>
              </td>
            </tr>

            {/* Row 2 — When you move in */}
            <tr className="border-t border-brand-cream">
              <td className="px-3 py-4 text-sm text-brand-taupe align-top">When you move in</td>
              <td className="px-3 py-4 text-center font-semibold text-brand-ink align-top">
                This year
              </td>
              <td className="px-3 py-4 text-center text-brand-ink align-top">
                {fmtTimeline(yearsToSave)}
                {yearsToSave && (
                  <span className="block text-xs text-brand-taupe mt-0.5">to save the deposit</span>
                )}
              </td>
            </tr>

            {/* Row 3 — You buy at */}
            <tr className="border-t border-brand-cream">
              <td className="px-3 py-4 text-sm text-brand-taupe align-top">You buy at</td>
              <td className="px-3 py-4 text-center font-semibold text-brand-ink align-top">
                {fmt(strikePrice)}
                <span className="block text-xs text-brand-taupe mt-0.5">fixed from day one</span>
              </td>
              <td className="px-3 py-4 text-center text-brand-ink align-top">
                {tradBuyPrice !== null ? fmt(tradBuyPrice) : 'Rising market price'}
                <span className="block text-xs text-brand-taupe mt-0.5">
                  {tradBuyPrice !== null && yearsToSave
                    ? `in ${yearsToSave.years} yr${yearsToSave.years !== 1 ? 's' : ''} (5% appreciation assumed)`
                    : 'no fixed date'}
                </span>
              </td>
            </tr>

            {/* Row 4 — Monthly (last, where Homeown may cost more) */}
            <tr className="border-t border-brand-cream">
              <td className="px-3 py-4 text-sm text-brand-taupe align-top">Monthly</td>
              <td className="px-3 py-4 text-center font-semibold text-brand-ink align-top">
                {fmt(domiter)}/mo
                <span className="block text-xs text-brand-taupe mt-0.5">monthly service fee</span>
              </td>
              <td className="px-3 py-4 text-center text-brand-ink align-top">
                {fmt(currentCombined)}/mo
                <span className="block text-xs text-brand-taupe mt-0.5">housing cost + saving combined</span>
              </td>
            </tr>
            {monthlyGap !== 0 && (
              <tr>
                <td colSpan={3} className={`px-4 pb-3 text-xs ${monthlyGap > 0 ? 'text-brand-green' : 'text-brand-taupe'}`}>
                  {monthlyGap > 0
                    ? `${fmt(monthlyGap)} less per month with Homeown.`
                    : `${fmt(Math.abs(monthlyGap))} more per month — for a property at a price locked today.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-brand-taupe leading-relaxed">
        Figures are illustrative. Assumes 5% annual property appreciation. The monthly service fee is not rent. The Entry Stake is not a deposit.
      </p>

      {showCta && (
        <div className="mt-4">
          <Link
            to={calcUrl}
            className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Check your full numbers →
          </Link>
          <p className="mt-2 text-xs text-brand-taupe text-center">Two minutes. No account required.</p>
        </div>
      )}
    </div>
  )
}
