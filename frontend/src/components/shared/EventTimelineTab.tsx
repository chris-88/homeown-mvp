import { LEAD_STAGE_LABELS, PROGRAMME_STAGE_LABELS, EVENT_TYPE_LABELS } from '@/types'
import type { Event } from '@/types'

const STAGE_LABELS: Record<string, string> = { ...LEAD_STAGE_LABELS, ...PROGRAMME_STAGE_LABELS }

function fmtDateTime(s: string) {
  return new Date(s).toLocaleString('en-IE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function describeEvent(ev: Event): string {
  if (ev.event_type === 'stage_changed') {
    const { from, to } = (ev.payload as { from?: string; to?: string }) ?? {}
    const fromLabel = from ? (STAGE_LABELS[from] ?? from) : '?'
    const toLabel = to ? (STAGE_LABELS[to] ?? to) : '?'
    return `Stage: ${fromLabel} → ${toLabel}`
  }
  return EVENT_TYPE_LABELS[ev.event_type] ?? ev.event_type
}

export function EventTimelineTab({ events }: { events: Event[] }) {
  const filtered = events.filter(e => e.event_type !== 'staff_note')

  return (
    <section className="rounded-xl border bg-card p-5 space-y-3">
      {filtered.length === 0 && <p className="text-sm text-muted-foreground">No events yet.</p>}
      <div className="space-y-3">
        {filtered.map(ev => (
          <div key={ev.id} className="flex gap-3 text-sm">
            <span className="mt-1.5 flex h-2 w-2 shrink-0 rounded-full bg-muted-foreground/40" />
            <div>
              <p className="font-medium">{describeEvent(ev)}</p>
              <p className="text-xs text-muted-foreground">{fmtDateTime(ev.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
