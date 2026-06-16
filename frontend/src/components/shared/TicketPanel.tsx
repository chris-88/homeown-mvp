import { cn, formatCurrency } from '@/lib/utils'

const STRIKE_DISCOUNT    = 0.10
const DOMITER_RATE       = 0.082
const APPRECIATION_RATE  = 0.05
const TERM_YEARS         = 5
const R_STRESS           = 0.055   // CBI base 3.5% + 2% stress add-on
const R_BASE             = 0.035   // CBI base rate
const MORTGAGE_YEARS     = 30

function pmtCalc(monthlyRate: number, nMonths: number, principal: number): number {
  if (monthlyRate === 0) return principal / nMonths
  const factor = Math.pow(1 + monthlyRate, nMonths)
  return (principal * monthlyRate * factor) / (factor - 1)
}

export function TicketPanel({ propertyPrice, ghi }: { propertyPrice: number; ghi: number }) {
  const strikePrice       = propertyPrice * (1 - STRIKE_DISCOUNT)
  const entryContrib      = propertyPrice * 0.01
  const strikeReduction   = propertyPrice - strikePrice
  const monthlyFee        = (propertyPrice * DOMITER_RATE) / 12
  const gmiMonthly        = ghi / 12
  const feePct            = Math.round((monthlyFee / gmiMonthly) * 100)
  const projectedValue    = propertyPrice * Math.pow(1 + APPRECIATION_RATE, TERM_YEARS)
  const appreciationEur   = projectedValue - strikePrice
  const appreciationPct   = (appreciationEur / propertyPrice) * 100
  const ltv               = (strikePrice / projectedValue) * 100
  const nMonths           = MORTGAGE_YEARS * 12
  const stressMortgage    = pmtCalc(R_STRESS / 12, nMonths, strikePrice)
  const baseMortgage      = pmtCalc(R_BASE / 12, nMonths, strikePrice)
  const stressPct         = Math.round((stressMortgage / gmiMonthly) * 100)
  const basePct           = Math.round((baseMortgage / gmiMonthly) * 100)
  const stressDiff        = monthlyFee - stressMortgage
  const baseDiff          = monthlyFee - baseMortgage

  const rows: Array<{ label: string; value: string; note?: string; separator?: boolean }> = [
    { label: 'Gross Household Income', value: formatCurrency(ghi) },
    { label: 'Entry Contribution',     value: formatCurrency(entryContrib) },
    { label: 'Purchase Price',         value: formatCurrency(propertyPrice) },
    { label: 'Strike Price',           value: formatCurrency(strikePrice) },
    { label: 'Strike Reduction',       value: formatCurrency(strikeReduction), separator: true },
    { label: 'Service Fee (month)',     value: formatCurrency(monthlyFee), note: `${feePct}%` },
    { label: 'Appreciation Rate',      value: `${(APPRECIATION_RATE * 100).toFixed(2)}%`, separator: true },
    { label: 'Appreciation (€)',       value: formatCurrency(appreciationEur) },
    { label: 'Appreciation (%)',       value: `${appreciationPct.toFixed(2)}%` },
    { label: 'LTV',                    value: `${ltv.toFixed(2)}%`, separator: true },
    { label: 'Stress Mortgage (€/mo)', value: formatCurrency(stressMortgage), note: `${stressPct}%` },
    { label: 'Base Mortgage (€/mo)',   value: formatCurrency(baseMortgage), note: `${basePct}%`, separator: true },
    { label: 'Stress Mortgage (diff)', value: formatCurrency(stressDiff) },
    { label: 'Base Mortgage (diff)',   value: formatCurrency(baseDiff) },
  ]

  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <h2 className="font-semibold text-sm">Ticket</h2>
      <div className="text-xs">
        {rows.map(({ label, value, note, separator }, i) => (
          <div key={i} className={cn('flex items-center justify-between gap-2 py-1.5', separator && 'border-b mb-1')}>
            <span className="text-muted-foreground leading-tight">{label}</span>
            <div className="flex items-center gap-2 shrink-0 tabular-nums">
              <span className="font-medium">{value}</span>
              {note && <span className="text-muted-foreground w-6 text-right">{note}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
