import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import type { Notification } from '@/types'

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const unreadCount = notifications.filter((n) => !n.read_at).length

  // Initial fetch
  useEffect(() => {
    if (!user) { setNotifications([]); setLoading(false); return }

    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setNotifications((data as Notification[]) ?? [])
        setLoading(false)
      })
  }, [user?.id])

  // Realtime subscription
  useEffect(() => {
    if (!user) return

    // Unique name prevents Supabase reusing a stale already-subscribed channel
    const channel = supabase
      .channel(`notifications:${user.id}:${Math.random()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev])
        },
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [user?.id])

  const markRead = useCallback(async (id: string) => {
    const now = new Date().toISOString()
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: now } : n)),
    )
    await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('id', id)
  }, [])

  const markAllRead = useCallback(async () => {
    if (!user) return
    const now = new Date().toISOString()
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? now })))
    await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('user_id', user.id)
      .is('read_at', null)
  }, [user])

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    await supabase.from('notifications').delete().eq('id', id)
  }, [])

  const deleteAll = useCallback(async () => {
    if (!user) return
    setNotifications([])
    await supabase.from('notifications').delete().eq('user_id', user.id)
  }, [user])

  return { notifications, unreadCount, loading, markRead, markAllRead, deleteNotification, deleteAll }
}
