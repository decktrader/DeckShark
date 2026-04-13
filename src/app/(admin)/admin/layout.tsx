import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/trades', label: 'Trades' },
  { href: '/admin/reports', label: 'Reports' },
  { href: '/admin/feedback', label: 'Feedback' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      {/* Sidebar */}
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-52 shrink-0 border-r border-white/5 bg-black/20 md:block">
        <nav className="flex flex-col gap-1 p-3">
          <p className="mb-2 px-3 text-xs font-bold tracking-widest text-red-400 uppercase">
            Admin
          </p>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <div className="my-2 border-t border-white/5" />
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground px-3 py-2 text-xs"
          >
            ← Back to app
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
