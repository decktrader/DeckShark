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
  Sparkles,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  getRecentNotifications,
  getUnreadCountClient,
  markAsRead,
  markAllRead,
} from '@/lib/services/notifications'
import type { Notification, NotificationType } from '@/types'

// DeckShark vocabulary: terra/teal/brass only, never red/green traffic lights.
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

function NotificationList({
  notifications,
  unreadCount,
  onMarkAllRead,
  onClickNotification,
}: {
  notifications: Notification[]
  unreadCount: number
  onMarkAllRead: () => void
  onClickNotification: (n: Notification) => void
}) {
  return (
    <>
      <div className="border-line flex items-center justify-between border-b px-4 py-3">
        <p className="font-display text-ink text-sm font-bold">Notifications</p>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-terra-deep text-xs font-semibold hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>
      <div className="divide-line max-h-80 divide-y overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-slate px-4 py-8 text-center text-sm">
            No notifications yet
          </p>
        ) : (
          notifications.map((n) => {
            const config = NOTIF_ICONS[n.type] ?? {
              icon: Bell,
              color: 'text-slate',
            }
            const Icon = config.icon
            return (
              <Link
                key={n.id}
                href={n.link ?? '/notifications'}
                onClick={() => onClickNotification(n)}
                className={`hover:bg-paper-2 flex items-start gap-3 px-4 py-3 transition-colors ${!n.read ? 'bg-paper-2/60' : ''}`}
              >
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${config.color}`} />
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-xs ${!n.read ? 'text-ink font-semibold' : 'text-ink-2'}`}
                  >
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="text-slate mt-0.5 truncate text-xs">
                      {n.body}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="text-slate font-mono text-xs">
                    {timeAgo(n.created_at)}
                  </span>
                  {!n.read && (
                    <div className="bg-terra h-1.5 w-1.5 rounded-full" />
                  )}
                </div>
              </Link>
            )
          })
        )}
      </div>
      <div className="border-line border-t px-4 py-2.5 text-center">
        <Link
          href="/notifications"
          className="text-terra-deep text-xs font-semibold hover:underline"
        >
          View all notifications
        </Link>
      </div>
    </>
  )
}

export function NotificationBell({
  initialNotifications,
  initialUnreadCount,
}: NotificationBellProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
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

  // Refresh on window focus + poll every 30s
  useEffect(() => {
    const onFocus = () => void refreshData()
    window.addEventListener('focus', onFocus)
    const interval = setInterval(() => void refreshData(), 30_000)
    return () => {
      window.removeEventListener('focus', onFocus)
      clearInterval(interval)
    }
  }, [refreshData])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setDropdownOpen(false)
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
    setDropdownOpen(false)
    setSheetOpen(false)
  }

  const bellButton = (
    <button
      className="border-line text-ink-2 hover:border-line-2 hover:text-ink relative grid h-[38px] w-[38px] place-items-center rounded-md border bg-white transition-colors"
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <Bell className="h-[17px] w-[17px]" />
      {unreadCount > 0 && (
        <span className="bg-terra absolute top-2 right-[9px] h-[7px] w-[7px] rounded-full ring-2 ring-white" />
      )}
    </button>
  )

  return (
    <>
      {/* Mobile: Sheet */}
      <div className="sm:hidden">
        <Sheet
          open={sheetOpen}
          onOpenChange={(open) => {
            setSheetOpen(open)
            if (open) void refreshData()
          }}
        >
          <SheetTrigger asChild>{bellButton}</SheetTrigger>
          <SheetContent
            side="bottom"
            className="max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-0"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Notifications</SheetTitle>
            </SheetHeader>
            <NotificationList
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAllRead={handleMarkAllRead}
              onClickNotification={handleClickNotification}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Dropdown */}
      <div ref={ref} className="relative hidden sm:block">
        <div
          onClick={() => {
            setDropdownOpen(!dropdownOpen)
            if (!dropdownOpen) void refreshData()
          }}
        >
          {bellButton}
        </div>

        {dropdownOpen && (
          <div className="border-line shadow-card absolute top-full right-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border bg-white">
            <NotificationList
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAllRead={handleMarkAllRead}
              onClickNotification={handleClickNotification}
            />
          </div>
        )}
      </div>
    </>
  )
}
