import type { Client } from '@/types'

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function ClientDetailsSection({ client }: { client: Client }) {
  const rows: Array<[string, string | number]> = [
    ['Email', client.email],
    ['Phone', client.phone ?? '-'],
    ['Target price', client.target_price ? `€${client.target_price.toLocaleString()}` : '-'],
    ['Target areas', client.target_areas ?? '-'],
    ['Household size', client.household_size ?? '-'],
    ['Deferred until', client.deferred_until ? fmtDate(client.deferred_until) : '-'],
    ['Joined', fmtDate(client.created_at)],
  ]

  return (
    <section className="rounded-xl border bg-card p-5 space-y-3">
      <h2 className="font-semibold">Details</h2>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2">
            <dt className="text-muted-foreground shrink-0">{k}</dt>
            <dd className="text-right font-medium">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
