import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StageTimeline<T extends string>({
  stages, labels, current, terminal,
}: { stages: T[]; labels: Record<T, string>; current: T; terminal?: boolean }) {
  const currentIdx = stages.indexOf(current)

  return (
    <div className="flex items-center gap-0">
      {stages.map((stage, i) => {
        const done = !terminal && currentIdx > i
        const active = !terminal && currentIdx === i
        return (
          <div key={stage} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                done ? 'bg-brand-green border-brand-green text-white'
                  : active ? 'bg-white border-brand-green text-brand-green'
                    : terminal ? 'bg-white border-muted-foreground/20 text-muted-foreground/40'
                      : 'bg-white border-muted-foreground/30 text-muted-foreground/40',
              )}>
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={cn(
                'text-[10px] font-medium text-center leading-tight whitespace-nowrap',
                active ? 'text-brand-green' : done ? 'text-foreground' : 'text-muted-foreground/50',
              )}>
                {labels[stage]}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div className={cn(
                'h-0.5 flex-1 mx-1 mb-4',
                done ? 'bg-brand-green' : 'bg-muted-foreground/15',
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}
