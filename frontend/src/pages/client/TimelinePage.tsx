import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EVENT_TYPE_LABELS } from '@/types'
import type { Event } from '@/types'
import { formatDate } from '@/lib/utils'
import {
  CalendarDays, FileText, CheckCircle2, Star, XCircle,
  RotateCcw, Upload, ClipboardCheck, Home, Award,
} from 'lucide-react'

const EVENT_ICONS: Record<string, React.ReactNode> = {
  call_booked:             <CalendarDays className="h-4 w-4" />,
  call_rescheduled:        <RotateCcw className="h-4 w-4" />,
  call_cancelled:          <XCircle className="h-4 w-4" />,
  results_saved:           <ClipboardCheck className="h-4 w-4" />,
  limit_letter_issued:     <FileText className="h-4 w-4" />,
  document_approved:       <CheckCircle2 className="h-4 w-4" />,
  document_rejected:       <XCircle className="h-4 w-4" />,
  document_uploaded:       <Upload className="h-4 w-4" />,
  sale_agreed_submitted:   <Home className="h-4 w-4" />,
  approval_notice_issued:  <CheckCircle2 className="h-4 w-4" />,
  pathway_started:         <Star className="h-4 w-4" />,
  pathway_complete:        <Award className="h-4 w-4" />,
}

function eventIcon(type: string) {
  return EVENT_ICONS[type] ?? <Star className="h-4 w-4" />
}

function eventColor(type: string) {
  if (['call_cancelled', 'document_rejected'].includes(type)) return 'bg-destructive/10 text-destructive border-destructive/20'
  if (['call_booked', 'document_approved', 'pathway_started', 'pathway_complete', 'approval_notice_issued'].includes(type)) return 'bg-brand-green-muted text-brand-green border-brand-green/20'
  return 'bg-muted text-muted-foreground border-border'
}

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
            <div className="py-6 text-center">
              <Star className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Your timeline will fill in as your pathway progresses.</p>
            </div>
          )}
          {events && events.length > 0 && (
            <ol className="relative border-l border-border pl-6 space-y-5">
              {events.map((event) => (
                <li key={event.id} className="relative">
                  <div className={`absolute -left-[29px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full border ${eventColor(event.event_type)}`}>
                    {eventIcon(event.event_type)}
                  </div>
                  <p className="text-sm font-medium leading-snug">
                    {EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}
                  </p>
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
