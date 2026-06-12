import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EVENT_TYPE_LABELS } from '@/types'
import type { Event } from '@/types'
import { formatDate } from '@/lib/utils'

export default function TimelinePage() {
  const { client } = useAuth()
  const { data: events, isLoading } = useQuery({
    queryKey: ['timeline', client?.id],
    queryFn: async () => {
      if (!client) return []
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('client_id', client.id)
        .eq('visibility', 'client')
        .order('created_at', { ascending: false })
      return (data ?? []) as Event[]
    },
    enabled: !!client,
  })

  if (!client) return null

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">Timeline</h1>
        <p className="mt-1 text-muted-foreground">Key milestones on your Homeown pathway.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Activity</CardTitle></CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && (!events || events.length === 0) && (
            <p className="text-sm text-muted-foreground">No timeline events yet.</p>
          )}
          {events && events.length > 0 && (
            <ol className="relative border-l border-border pl-6 space-y-6">
              {events.map((event) => (
                <li key={event.id} className="relative">
                  <div className="absolute -left-[25px] top-1 h-3 w-3 rounded-full border-2 border-primary bg-background" />
                  <p className="text-sm font-medium">{EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}</p>
                  <time className="text-xs text-muted-foreground">{formatDate(event.created_at)}</time>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
