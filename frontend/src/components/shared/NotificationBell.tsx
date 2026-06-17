import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/hooks/useNotifications'
import { HIGH_PRIORITY_NOTIFICATIONS } from '@/types'
import type { Notification, NotificationType } from '@/types'
import { cn } from '@/lib/utils'

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function dateGroup(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return 'Earlier'
}

function NotificationIcon({ type }: { type: NotificationType }) {
  const base = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold'
  const map: Partial<Record<NotificationType, string>> = {
    new_lead:       'bg-blue-100 text-blue-700',
    doc_exception:  'bg-brand-burgundy-muted text-brand-burgundy',
    sla_breach:     'bg-red-100 text-red-700',
    stage_event:    'bg-brand-green-muted text-brand-green',
    client_milestone: 'bg-brand-green-muted text-brand-green',
    dac_published:  'bg-purple-100 text-purple-700',
    subscription_update: 'bg-purple-100 text-purple-700',
    system_alert:   'bg-red-100 text-red-700',
    domiter_failed: 'bg-red-100 text-red-700',
    domiter_reminder: 'bg-blue-100 text-blue-700',
    milestone:      'bg-brand-green-muted text-brand-green',
  }
  const cls = map[type] ?? 'bg-muted text-muted-foreground'
  return (
    <div className={cn(base, cls)}>
      <Bell className="h-3.5 w-3.5" />
    </div>
  )
}

interface NotificationItemProps {
  notification: Notification
  onRead: (id: string) => void
}

function NotificationItem({ notification: n, onRead }: NotificationItemProps) {
  const navigate = useNavigate()

  function handleClick() {
    onRead(n.id)
    if (n.action_url) navigate(n.action_url)
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-md px-3 py-3 text-left transition-colors hover:bg-accent',
        !n.read_at && 'bg-primary/5',
      )}
    >
      <NotificationIcon type={n.type} />
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm leading-snug', !n.read_at && 'font-medium')}>{n.title}</p>
        {n.body && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{relativeTime(n.created_at)}</p>
      </div>
      {!n.read_at && (
        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
      )}
    </button>
  )
}

interface Props {
  /** Override icon colour for dark portal headers */
  iconClassName?: string
}

export function NotificationBell({ iconClassName }: Props) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()

  // Toast for high-priority incoming notifications
  useEffect(() => {
    if (!notifications.length) return
    const latest = notifications[0]
    if (!latest.read_at && HIGH_PRIORITY_NOTIFICATIONS.has(latest.type)) {
      toast(latest.title, {
        description: latest.body ?? undefined,
        duration: 6000,
      })
    }
  }, [notifications[0]?.id])

  const groups = ['Today', 'Yesterday', 'Earlier'] as const
  const grouped = groups.reduce((acc, g) => {
    acc[g] = notifications.filter((n) => dateGroup(n.created_at) === g)
    return acc
  }, {} as Record<string, Notification[]>)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-white/10"
          aria-label="Notifications"
        >
          <Bell className={cn('h-5 w-5', iconClassName)} />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold text-white leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-sm">
        <SheetHeader className="flex flex-row items-center justify-between border-b px-4 py-3">
          <SheetTitle className="text-sm font-semibold">Notifications</SheetTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 text-xs text-muted-foreground"
              onClick={markAllRead}
            >
              Mark all as read
            </Button>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-2">
          {notifications.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-sm text-muted-foreground">You're all caught up.</p>
            </div>
          ) : (
            groups.map((group) => {
              const items = grouped[group]
              if (!items?.length) return null
              return (
                <div key={group} className="mb-4">
                  <p className="mb-1 px-3 text-xs font-medium text-muted-foreground">{group}</p>
                  <div className="space-y-0.5">
                    {items.map((n) => (
                      <NotificationItem key={n.id} notification={n} onRead={markRead} />
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
