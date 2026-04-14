'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  Bell,
  Handshake,
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  Star,
  Package,
  Search,
} from 'lucide-react'
import {
  getRecentNotifications,
  getUnreadCountClient,
  markAsRead,
  markAllRead,
} from '@/lib/services/notifications'
import type { Notification, NotificationType } from '@/types'

const NOTIF_ICONS: Record<
  NotificationType,
  { icon: typeof Bell; color: string }
> = {
  trade_proposed: { icon: Handshake, color: 'text-sky-400' },
  trade_countered: { icon: ArrowLeftRight, color: 'text-amber-400' },
  trade_accepted: { icon: CheckCircle2, color: 'text-emerald-400' },
  trade_declined: { icon: XCircle, color: 'text-rose-400' },
  trade_completed: { icon: CheckCircle2, color: 'text-emerald-400' },
  want_list_match: { icon: Search, color: 'text-violet-400' },
  review_received: { icon: Star, color: 'text-yellow-400' },
  interest_threshold: { icon: Package, color: 'text-pink-400' },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

interface NotificationBellProps {
  initialNotifications: Notification[]
  initialUnreadCount: number
}

export function NotificationBell({
  initialNotifications,
  initialUnreadCount,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const ref = useRef<HTMLDivElement>(null)

  const refreshData = useCallback(async () => {
    const [{ data: notifs }, { data: count }] = await Promise.all([
      getRecentNotifications(10),
      getUnreadCountClient(),
    ])
    if (notifs) setNotifications(notifs)
    if (count !== null) setUnreadCount(count)
  }, [])

  // Refresh on window focus (event handler, not effect-triggered setState)
  useEffect(() => {
    const onFocus = () => void refreshData()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refreshData])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleMarkAllRead() {
    await markAllRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  async function handleClickNotification(notif: Notification) {
    if (!notif.read) {
      await markAsRead(notif.id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)),
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    }
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          setOpen(!open)
          if (!open) void refreshData()
        }}
        className="text-muted-foreground hover:text-foreground relative p-2 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="bg-primary absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <p className="text-sm font-bold">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-primary text-xs hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 divide-y divide-white/5 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-muted-foreground px-4 py-8 text-center text-sm">
                No notifications yet
              </p>
            ) : (
              notifications.map((n) => {
                const config = NOTIF_ICONS[n.type] ?? {
                  icon: Bell,
                  color: 'text-muted-foreground',
                }
                const Icon = config.icon
                return (
                  <Link
                    key={n.id}
                    href={n.link ?? '/notifications'}
                    onClick={() => handleClickNotification(n)}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/[3%] ${!n.read ? 'bg-white/[2%]' : ''}`}
                  >
                    <Icon
                      className={`mt-0.5 h-4 w-4 shrink-0 ${config.color}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-xs ${!n.read ? 'font-semibold' : 'text-muted-foreground'}`}
                      >
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-muted-foreground mt-0.5 truncate text-[10px]">
                          {n.body}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className="text-muted-foreground text-[10px]">
                        {timeAgo(n.created_at)}
                      </span>
                      {!n.read && (
                        <div className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                      )}
                    </div>
                  </Link>
                )
              })
            )}
          </div>
          <div className="border-t border-white/5 px-4 py-2.5 text-center">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-primary text-xs hover:underline"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
