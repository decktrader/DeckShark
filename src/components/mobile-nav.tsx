'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function MobileNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false)
  const [pendingTradeCount, setPendingTradeCount] = useState(0)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const lastTouchRef = useRef(0)

  const fetchCount = useCallback(async () => {
    if (!isLoggedIn) return
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { count: proposedCount } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('status', 'proposed')

    const { count: counterCount } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'countered')
      .neq('last_counter_by', user.id)
      .or(`proposer_id.eq.${user.id},receiver_id.eq.${user.id}`)

    setPendingTradeCount((proposedCount ?? 0) + (counterCount ?? 0))
  }, [isLoggedIn])

  useEffect(() => {
    const onFocus = () => {
      void fetchCount()
    }
    window.addEventListener('focus', onFocus)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch on mount is intentional
    void fetchCount()
    return () => window.removeEventListener('focus', onFocus)
  }, [fetchCount])

  useEffect(() => {
    const button = buttonRef.current
    if (!button) return
    const handler = (e: TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()
      lastTouchRef.current = Date.now()
      setOpen((v) => !v)
    }
    button.addEventListener('touchstart', handler, { passive: false })
    return () => button.removeEventListener('touchstart', handler)
  }, [])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Open menu"
        onClick={() => {
          if (Date.now() - lastTouchRef.current < 600) return
          setOpen((v) => !v)
        }}
        style={{ touchAction: 'manipulation' }}
        className="active:bg-accent flex h-11 w-11 cursor-pointer items-center justify-center rounded-md"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="4" x2="20" y1="6" y2="6" />
          <line x1="4" x2="20" y1="12" y2="12" />
          <line x1="4" x2="20" y1="18" y2="18" />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Menu panel — fixed below header */}
          <div className="bg-background border-border fixed top-[72px] right-0 left-0 z-50 border-b shadow-lg">
            <nav className="container mx-auto flex flex-col px-4 py-2">
              <Link
                href="/decks"
                onClick={() => setOpen(false)}
                className="hover:bg-accent rounded-md px-3 py-3 text-sm font-medium"
              >
                Browse decks
              </Link>
              <Link
                href="/want-lists"
                onClick={() => setOpen(false)}
                className="hover:bg-accent rounded-md px-3 py-3 text-sm font-medium"
              >
                Want lists
              </Link>
              {isLoggedIn && (
                <Link
                  href="/trades"
                  onClick={() => setOpen(false)}
                  className="hover:bg-accent flex items-center justify-between rounded-md px-3 py-3 text-sm font-medium"
                >
                  Trades
                  {pendingTradeCount > 0 && (
                    <span className="bg-primary flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white">
                      {pendingTradeCount > 9 ? '9+' : pendingTradeCount}
                    </span>
                  )}
                </Link>
              )}
              {isLoggedIn && (
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="hover:bg-accent rounded-md px-3 py-3 text-sm font-medium"
                >
                  Dashboard
                </Link>
              )}
              <div className="my-1 border-t" />
              {isLoggedIn ? (
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className="hover:bg-accent rounded-md px-3 py-3 text-sm font-medium"
                >
                  Settings
                </Link>
              ) : (
                <div className="flex gap-2 px-3 py-2">
                  <Button asChild className="flex-1">
                    <Link href="/register" onClick={() => setOpen(false)}>
                      Get started
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link href="/login" onClick={() => setOpen(false)}>
                      Sign in
                    </Link>
                  </Button>
                </div>
              )}
            </nav>
          </div>
        </>
      )}
    </>
  )
}
