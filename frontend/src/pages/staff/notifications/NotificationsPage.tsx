import { useNavigate } from 'react-router-dom'
import { Bell, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useNotifications } from '@/hooks/useNotifications'
import { cn } from '@/lib/utils'
import type { Notification, NotificationType } from '@/types'

const TYPE_LABELS: Partial<Record<NotificationType, string>> = {
  new_lead:            'New Lead',
  doc_exception:       'Doc Exception',
  sla_breach:          'SLA Breach',
  stage_event:         'Stage Event',
  client_milestone:    'Milestone',
  dac_published:       'DAC Published',
  subscription_update: 'Subscription',
  system_alert:        'System Alert',
  domiter_failed:      'Domiter Failed',
  domiter_reminder:    'Domiter Reminder',
  milestone:           'Milestone',
}

const TYPE_BADGE: Partial<Record<NotificationType, 'default' | 'secondary' | 'destructive' | 'outline'>> = {
  sla_breach:     'destructive',
  system_alert:   'destructive',
  domiter_failed: 'destructive',
  new_lead:       'default',
  stage_event:    'secondary',
  client_milestone: 'secondary',
  milestone:      'secondary',
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function NotificationRow({ n, onRead, onDelete }: {
  n: Notification
  onRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  const navigate = useNavigate()

  function handleTitleClick() {
    if (!n.read_at) onRead(n.id)
    if (n.action_url) navigate(n.action_url)
  }

  return (
    <tr className={cn('border-b last:border-0', !n.read_at && 'bg-primary/[0.03]')}>
      <td className="py-3 pr-4 w-4">
        {!n.read_at && <div className="h-2 w-2 rounded-full bg-primary" />}
      </td>
      <td className="py-3 pr-4">
        <Badge variant={TYPE_BADGE[n.type] ?? 'outline'} className="text-xs whitespace-nowrap">
          {TYPE_LABELS[n.type] ?? n.type}
        </Badge>
      </td>
      <td className="py-3 pr-4">
        <button
          onClick={handleTitleClick}
          className={cn(
            'text-left hover:underline underline-offset-2',
            !n.read_at ? 'font-medium text-foreground' : 'text-foreground',
          )}
        >
          {n.title}
        </button>
        {n.body && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{n.body}</p>
        )}
      </td>
      <td className="py-3 pr-4 text-sm text-muted-foreground whitespace-nowrap">
        {relativeTime(n.created_at)}
      </td>
      <td className="py-3">
        <div className="flex items-center gap-2 justify-end">
          {!n.read_at && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={() => onRead(n.id)}
            >
              Mark read
            </Button>
          )}
          <button
            onClick={() => onDelete(n.id)}
            className="rounded p-1 text-muted-foreground/50 hover:text-destructive transition-colors"
            aria-label="Delete notification"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function NotificationsPage() {
  const { notifications, unreadCount, loading, markRead, markAllRead, deleteNotification, deleteAll } = useNotifications()

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="mt-1 text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            {notifications.length > 0 && ` · ${notifications.length} total`}
          </p>
        </div>
        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllRead}>
                Mark all read
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={deleteAll}
              className="text-destructive hover:text-destructive hover:border-destructive/50">
              Clear all
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="pt-4 overflow-x-auto">
          {loading ? (
            <p className="py-4 text-sm text-muted-foreground">Loading…</p>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Bell className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No notifications yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 w-4" />
                  <th className="pb-3 pr-4 font-medium">Type</th>
                  <th className="pb-3 pr-4 font-medium">Notification</th>
                  <th className="pb-3 pr-4 font-medium">Time</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map(n => (
                  <NotificationRow
                    key={n.id}
                    n={n}
                    onRead={markRead}
                    onDelete={deleteNotification}
                  />
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
