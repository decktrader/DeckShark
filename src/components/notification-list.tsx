'use client'

import { useState } from 'react'
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
import { Button } from '@/components/ui/button'
import { markAsRead, markAllRead } from '@/lib/services/notifications'
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
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function NotificationList({
  initialNotifications,
}: {
  initialNotifications: Notification[]
}) {
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications)

  const unreadCount = notifications.filter((n) => !n.read).length

  async function handleMarkAllRead() {
    await markAllRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  async function handleClick(notif: Notification) {
    if (!notif.read) {
      await markAsRead(notif.id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)),
      )
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/[1%]">
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <div>
          <h1 className="text-lg font-bold">Notifications</h1>
          <p className="text-muted-foreground text-xs">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            Mark all as read
          </Button>
        )}
      </div>
      <div className="divide-y divide-white/5">
        {notifications.length === 0 ? (
          <p className="text-muted-foreground px-6 py-12 text-center text-sm">
            No notifications yet. When you get trade proposals, reviews, or want
            list matches, they&apos;ll show up here.
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
                href={n.link ?? '#'}
                onClick={() => handleClick(n)}
                className={`flex items-start gap-4 px-6 py-4 transition-colors hover:bg-white/[2%] ${!n.read ? 'bg-white/[2%]' : ''}`}
              >
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${config.color}`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${!n.read ? 'font-semibold' : ''}`}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {n.body}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-muted-foreground text-xs">
                    {timeAgo(n.created_at)}
                  </span>
                  {!n.read && (
                    <div className="h-2 w-2 rounded-full bg-violet-500" />
                  )}
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
