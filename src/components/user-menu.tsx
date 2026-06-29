'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/services/auth'
import { Pfp } from '@/components/ds/pfp'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const ITEM_CLASS =
  'cursor-pointer rounded-none px-3.5 py-2.5 text-[13.5px] font-medium text-ink-2 focus:bg-paper-2 focus:text-ink'

export function UserMenu({
  username,
  avatarUrl,
  city,
  province,
}: {
  username: string
  avatarUrl?: string | null
  city?: string | null
  province?: string | null
}) {
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push('/')
    router.refresh()
  }

  const location = [city, province].filter(Boolean).join(', ')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-pill bg-paper-2 hover:border-line-2 flex items-center gap-2 border border-transparent py-1 pr-2.5 pl-1 transition-colors">
          <Pfp src={avatarUrl} name={username} size={30} />
          <span className="text-ink text-[13px] font-semibold">{username}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-slate"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="border-line text-ink shadow-card w-56 overflow-hidden rounded-lg bg-white p-0"
      >
        <div className="border-line flex items-center gap-2.5 border-b px-3.5 py-3">
          <Pfp src={avatarUrl} name={username} size={36} />
          <div className="min-w-0">
            <div className="font-display text-ink truncate text-sm leading-tight font-bold">
              {username}
            </div>
            {location && (
              <div className="text-slate mt-0.5 truncate text-[11.5px]">
                {location}
              </div>
            )}
          </div>
        </div>
        <DropdownMenuItem asChild className={ITEM_CLASS}>
          <Link href="/dashboard">Dashboard</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={ITEM_CLASS}>
          <Link href={`/profile/${username}`}>My profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={ITEM_CLASS}>
          <Link href="/dashboard">My decks</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={ITEM_CLASS}>
          <Link href="/settings">Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-line" />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-terra-deep focus:bg-paper-2 cursor-pointer rounded-none px-3.5 py-2.5 text-[13.5px] font-semibold"
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
