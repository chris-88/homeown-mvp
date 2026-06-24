import type { Client } from '@/types'

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })
}

const HOUSEHOLD_LABELS: Record<string, string> = { solo: 'Solo', couple: 'Couple' }
const EMPLOYMENT_LABELS: Record<string, string> = { paye: 'PAYE', self_employed: 'Self-employed', mixed: 'Mixed' }

export interface CalcSnapshot {
  ghi?: number | null
  age?: number | null
  household_type?: string | null
  is_ftb?: boolean | null
  employment_type?: string | null
  county?: string | null
  dublin_postcode?: string | null
  current_housing_cost?: number | null
}

interface Props {
  client: Client
  snapshot?: CalcSnapshot | null
}

export function ClientDetailsSection({ client, snapshot }: Props) {
  const rows: Array<[string, string | number]> = [
    ['Email', client.email],
    ['Phone', client.phone ?? '-'],
    ['Target price', client.target_price ? `€${client.target_price.toLocaleString()}` : '-'],
    ['Target areas', client.target_areas ?? '-'],
    ['Deferred until', client.deferred_until ? fmtDate(client.deferred_until) : '-'],
    ['Joined', fmtDate(client.created_at)],
  ]

  const snapRows: Array<[string, string | number]> = snapshot ? [
    ...(snapshot.age                                             ? [['Age', snapshot.age] as [string, number]] : []),
    ...(snapshot.household_type                                  ? [['Household', HOUSEHOLD_LABELS[snapshot.household_type] ?? snapshot.household_type] as [string, string]] : []),
    ...(snapshot.is_ftb !== null && snapshot.is_ftb !== undefined? [['First-time buyer', snapshot.is_ftb ? 'Yes' : 'No'] as [string, string]] : []),
    ...(snapshot.employment_type                                 ? [['Employment', EMPLOYMENT_LABELS[snapshot.employment_type] ?? snapshot.employment_type] as [string, string]] : []),
    ...(snapshot.ghi                                             ? [['Gross income', `€${snapshot.ghi.toLocaleString()}`] as [string, string]] : []),
    ...(snapshot.current_housing_cost                            ? [['Current housing', `€${snapshot.current_housing_cost.toLocaleString()}/mo`] as [string, string]] : []),
  ] : []

  return (
    <section className="rounded-md border bg-card p-5 space-y-4">
      <h2 className="font-semibold">Details</h2>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2">
            <dt className="text-muted-foreground shrink-0">{k}</dt>
            <dd className="text-right font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      {snapRows.length > 0 && (
        <>
          <div className="border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">From calculator</p>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {snapRows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <dt className="text-muted-foreground shrink-0">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </>
      )}
    </section>
  )
}
