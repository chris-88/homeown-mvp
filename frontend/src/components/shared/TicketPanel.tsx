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

const HOUSEHOLD_LABELS: Record<string, string> = {
  solo: 'Solo',
  couple: 'Couple',
}
const EMPLOYMENT_LABELS: Record<string, string> = {
  paye: 'PAYE',
  self_employed: 'Self-employed',
  mixed: 'Mixed',
}

interface TicketPanelProps {
  propertyPrice: number
  ghi: number
  age?: number | null
  householdType?: string | null
  isFtb?: boolean | null
  employmentType?: string | null
  county?: string | null
  dublinPostcode?: string | null
  currentHousingCost?: number | null
}

export function TicketPanel({
  propertyPrice, ghi,
  age, householdType, isFtb, employmentType, county, dublinPostcode, currentHousingCost,
}: TicketPanelProps) {
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

  const location = county
    ? (county === 'Dublin' && dublinPostcode ? `Dublin ${dublinPostcode}` : county)
    : null

  const profileRows: Array<{ label: string; value: string }> = [
    ...(location                              ? [{ label: 'Location',        value: location }] : []),
    ...(age                                   ? [{ label: 'Age',             value: `${age}` }] : []),
    ...(householdType                         ? [{ label: 'Household',       value: HOUSEHOLD_LABELS[householdType] ?? householdType }] : []),
    ...(isFtb !== null && isFtb !== undefined ? [{ label: 'First-time buyer',value: isFtb ? 'Yes' : 'No' }] : []),
    ...(employmentType                        ? [{ label: 'Employment',      value: EMPLOYMENT_LABELS[employmentType] ?? employmentType }] : []),
  ]

  const ticketRows: Array<{ label: string; value: string; note?: string; separator?: boolean }> = [
    { label: 'Gross Household Income',  value: formatCurrency(ghi) },
    ...(currentHousingCost
      ? [{ label: 'Current housing cost', value: formatCurrency(currentHousingCost) }]
      : []),
    { label: 'Entry Contribution',      value: formatCurrency(entryContrib) },
    { label: 'Purchase Price',          value: formatCurrency(propertyPrice) },
    { label: 'Strike Price',            value: formatCurrency(strikePrice) },
    { label: 'Strike Reduction',        value: formatCurrency(strikeReduction), separator: true },
    { label: 'Service Fee (month)',      value: formatCurrency(monthlyFee), note: `${feePct}%` },
    ...(currentHousingCost
      ? [{
          label: 'Fee vs housing cost',
          value: formatCurrency(Math.abs(monthlyFee - currentHousingCost)),
          note: monthlyFee <= currentHousingCost ? '↓' : '↑',
        }]
      : []),
    { label: 'Appreciation Rate',       value: `${(APPRECIATION_RATE * 100).toFixed(2)}%`, separator: true },
    { label: 'Appreciation (€)',        value: formatCurrency(appreciationEur) },
    { label: 'Appreciation (%)',        value: `${appreciationPct.toFixed(2)}%` },
    { label: 'LTV',                     value: `${ltv.toFixed(2)}%`, separator: true },
    { label: 'Stress Mortgage (€/mo)',  value: formatCurrency(stressMortgage), note: `${stressPct}%` },
    { label: 'Base Mortgage (€/mo)',    value: formatCurrency(baseMortgage), note: `${basePct}%`, separator: true },
    { label: 'Stress Mortgage (diff)',  value: formatCurrency(stressDiff) },
    { label: 'Base Mortgage (diff)',    value: formatCurrency(baseDiff) },
  ]

  return (
    <div className="rounded-md border bg-card p-5 space-y-4">
      <h2 className="font-semibold text-sm">Ticket</h2>

      {profileRows.length > 0 && (
        <div className="text-xs border rounded-sm overflow-hidden">
          {profileRows.map(({ label, value }, i) => (
            <div key={i} className={cn(
              'flex items-center justify-between gap-2 px-3 py-1.5',
              i % 2 === 0 ? 'bg-muted/40' : '',
            )}>
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>
      )}

      <div className="text-xs">
        {ticketRows.map(({ label, value, note, separator }, i) => (
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
