export function StageFilterChips<T extends string>({
  stages, labels, counts, active, onToggle, extra,
}: {
  stages: T[]
  labels: Record<T, string>
  counts: Record<string, number>
  active: string
  onToggle: (stage: T) => void
  extra?: Array<{ value: string; label: string; variant: 'destructive' | 'default' }>
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {stages.map(s => (
        <button
          key={s}
          onClick={() => onToggle(s)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            active === s
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-card hover:bg-accent'
          }`}
        >
          {labels[s]} <span className="ml-1 opacity-70">{counts[s] ?? 0}</span>
        </button>
      ))}
      {extra?.map(e => (
        <button
          key={e.value}
          onClick={() => onToggle(e.value as T)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            active === e.value
              ? e.variant === 'destructive'
                ? 'border-destructive bg-destructive text-destructive-foreground'
                : 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-card hover:bg-accent'
          }`}
        >
          {e.label} <span className="ml-1 opacity-70">{counts[e.value] ?? 0}</span>
        </button>
      ))}
    </div>
  )
}
