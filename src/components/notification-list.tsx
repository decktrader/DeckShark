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
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { markAsRead, markAllRead } from '@/lib/services/notifications'
import type { Notification, NotificationType } from '@/types'

const NOTIF_ICONS: Record<
  NotificationType,
  { icon: typeof Bell; color: string }
> = {
  trade_proposed: { icon: Handshake, color: 'text-teal-deep' },
  trade_countered: { icon: ArrowLeftRight, color: 'text-brass-deep' },
  trade_accepted: { icon: CheckCircle2, color: 'text-teal-deep' },
  trade_declined: { icon: XCircle, color: 'text-terra-deep' },
  trade_completed: { icon: CheckCircle2, color: 'text-teal-deep' },
  want_list_match: { icon: Search, color: 'text-brass-deep' },
  review_received: { icon: Star, color: 'text-brass-deep' },
  interest_threshold: { icon: Package, color: 'text-terra-deep' },
  trade_match: { icon: Sparkles, color: 'text-brass-deep' },
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
    <div className="border-line overflow-hidden rounded-lg border bg-white">
      <div className="border-line flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="font-display text-ink text-lg font-bold">
            Notifications
          </h1>
          <p className="text-slate text-xs">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            Mark all as read
          </Button>
        )}
      </div>
      <div className="divide-line divide-y">
        {notifications.length === 0 ? (
          <p className="text-slate px-6 py-12 text-center text-sm">
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
                className={`hover:bg-paper-2 flex items-start gap-4 px-6 py-4 transition-colors ${!n.read ? 'bg-paper-2/60' : ''}`}
              >
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${config.color}`} />
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm ${!n.read ? 'text-ink font-semibold' : 'text-ink-2'}`}
                  >
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="text-slate mt-0.5 text-xs">{n.body}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-slate font-mono text-xs">
                    {timeAgo(n.created_at)}
                  </span>
                  {!n.read && <div className="bg-terra h-2 w-2 rounded-full" />}
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
