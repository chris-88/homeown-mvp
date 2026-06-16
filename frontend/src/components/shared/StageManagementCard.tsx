import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function StageManagementCard<T extends string>({
  current, labels, options, canChange, loading, onConfirm, extraActions,
}: {
  current: T
  labels: Record<T, string>
  options: T[]
  canChange: boolean
  loading?: boolean
  onConfirm: (target: T, note: string) => void | Promise<void>
  extraActions?: React.ReactNode
}) {
  const [pending, setPending] = useState<T | null>(null)
  const [note, setNote] = useState('')

  if (!canChange) {
    return (
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="font-semibold text-sm">Stage</h2>
        <Badge>{labels[current]}</Badge>
      </div>
    )
  }

  async function handleConfirm() {
    if (!pending) return
    await onConfirm(pending, note)
    setPending(null)
    setNote('')
  }

  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <h2 className="font-semibold text-sm">Stage</h2>
      <Select
        value={pending ?? current}
        onValueChange={v => { if (v === current) { setPending(null) } else { setPending(v as T) } }}
      >
        <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={current}>{labels[current]}</SelectItem>
          {options.filter(s => s !== current).map(s => (
            <SelectItem key={s} value={s}>{labels[s]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {pending && (
        <div className="space-y-2">
          <Textarea
            placeholder="Optional note (recorded internally)…"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleConfirm} disabled={loading}>
              {loading ? 'Saving…' : `Confirm: ${labels[pending]}`}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setPending(null); setNote('') }}>Cancel</Button>
          </div>
        </div>
      )}

      {extraActions}
    </div>
  )
}
