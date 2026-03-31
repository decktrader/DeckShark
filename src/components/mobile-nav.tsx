'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

export function MobileNav({
  isLoggedIn,
  pendingTradeCount,
}: {
  isLoggedIn: boolean
  pendingTradeCount: number
}) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="sm:hidden"
          aria-label="Open menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-64">
        <nav className="mt-8 flex flex-col gap-1">
          <Link
            href="/decks"
            onClick={() => setOpen(false)}
            className="hover:bg-accent rounded-md px-3 py-2 text-sm font-medium"
          >
            Browse decks
          </Link>
          <Link
            href="/want-lists"
            onClick={() => setOpen(false)}
            className="hover:bg-accent rounded-md px-3 py-2 text-sm font-medium"
          >
            Want lists
          </Link>
          {isLoggedIn && (
            <Link
              href="/trades"
              onClick={() => setOpen(false)}
              className="hover:bg-accent flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium"
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
              className="hover:bg-accent rounded-md px-3 py-2 text-sm font-medium"
            >
              Dashboard
            </Link>
          )}
          <div className="mt-4 border-t pt-4">
            {isLoggedIn ? (
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="hover:bg-accent rounded-md px-3 py-2 text-sm font-medium"
              >
                Settings
              </Link>
            ) : (
              <div className="flex flex-col gap-2 px-3">
                <Button asChild size="sm">
                  <Link href="/register" onClick={() => setOpen(false)}>
                    Get started
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/login" onClick={() => setOpen(false)}>
                    Sign in
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
