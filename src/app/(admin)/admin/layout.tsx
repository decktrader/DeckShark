import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/growth', label: 'Growth' },
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
      <aside className="border-line bg-paper-2 sticky top-16 hidden h-[calc(100vh-4rem)] w-52 shrink-0 border-r md:block">
        <nav className="flex flex-col gap-1 p-3">
          <p className="text-terra-deep mb-2 px-3 font-mono text-xs font-bold tracking-[0.16em] uppercase">
            Admin
          </p>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-ink-2 hover:bg-paper-3 hover:text-ink rounded-md px-3 py-2 text-sm font-semibold transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <div className="border-line my-2 border-t" />
          <Link
            href="/dashboard"
            className="text-slate hover:text-ink px-3 py-2 text-xs"
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
